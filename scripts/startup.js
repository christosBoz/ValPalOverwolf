import base64 from 'base-64';

// Import your resources here
import { regions, regionShardOverride, shardRegionOverride, baseEndpoint, baseEndpointGlz, baseEndpointLocal, baseEndpointShared, queues } from './resources.js';

// Import your exceptions here
import { ResponseError, HandshakeError, LockfileError, PhaseError } from './exceptions.js';

class Client {
    constructor(region = 'na', auth = null) {
        this.lockfilePath = 'C:\\Users\\majdh\\AppData\\Local\\Riot Games\\Riot Client\\Config\\lockfile'; // Adjust this path to your environment

        this.puuid = '';
        this.playerName = '';
        this.playerTag = '';
        this.lockfile = {};
        this.headers = {};
        this.localHeaders = {};
        this.region = region;
        this.shard = region;
        this.auth = null;
        this.clientPlatform = `ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9`;

        if (auth) {
            this.auth = new Auth(auth);
        }

        if (regions.includes(this.region)) {
            if (regionShardOverride[this.region]) {
                this.shard = regionShardOverride[this.region];
            }
            if (shardRegionOverride[this.shard]) {
                this.region = shardRegionOverride[this.shard];
            }
            [this.baseUrl, this.baseUrlGlz, this.baseUrlShared] = this.buildUrls();
        } else {
            throw new Error(`Invalid region, valid regions are: ${regions}`);
        }
    }

    async activate() {
        try {
            if (!this.auth) {
                this.lockfile = await this.getLockfile();
                [this.puuid, this.headers, this.localHeaders] = await this.getHeaders();
                
                const session = await this.fetchChatSession();
                this.playerName = session.game_name;
                this.playerTag = session.game_tag;
            } else {
                [this.puuid, this.headers, this.localHeaders] = await this.auth.authenticate();
            }
        } catch (err) {
            throw new HandshakeError('Unable to activate; is VALORANT running?');
        }
    }

    static fetchRegions() {
        return regions;
    }

    verifyStatusCode(statusCode, exceptions = {}) {
        if (exceptions[statusCode]) {
            const [ExceptionClass, message] = exceptions[statusCode];
            throw new ExceptionClass(message);
        }
    }

    async fetch(endpoint = '/', endpointType = 'pd', exceptions = {}) {
        let data = null;
        const url = endpointType === 'glz' ? this.baseUrlGlz :
            endpointType === 'pd' ? this.baseUrl :
            endpointType === 'shared' ? this.baseUrlShared :
            this.baseUrl;

        try {
            const response = await fetch(`${url}${endpoint}`, { headers: this.headers });

            if (!response.ok) {
                this.verifyStatusCode(response.status, exceptions);
            }

            data = await response.json();
        } catch (err) {
            // Handle exception or logging
            console.error('Fetch error:', err);
        }

        if (!data) throw new ResponseError('Request returned NoneType');
        if (!data.httpStatus) return data;
        if (data.httpStatus === 400) {
            if (!this.auth) {
                [this.puuid, this.headers, this.localHeaders] = await this.getHeaders();
            } else {
                [this.puuid, this.headers, this.localHeaders] = await this.auth.authenticate();
            }
            return this.fetch(endpoint, endpointType);
        }
    }

    async post(endpoint = '/', endpointType = 'pd', jsonData = {}, exceptions = {}) {
        const url = endpointType === 'glz' ? this.baseUrlGlz : this.baseUrl;

        const response = await fetch(`${url}${endpoint}`, {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            this.verifyStatusCode(response.status, exceptions);
        }

        return await response.json() || null;
    }

    async put(endpoint = '/', endpointType = 'pd', jsonData = {}, exceptions = {}) {
        const url = endpointType === 'glz' ? this.baseUrlGlz : this.baseUrl;

        const response = await fetch(`${url}${endpoint}`, {
            method: 'PUT',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            this.verifyStatusCode(response.status, exceptions);
        }

        return await response.json() || null;
    }

    async delete(endpoint = '/', endpointType = 'pd', jsonData = {}, exceptions = {}) {
        const url = endpointType === 'glz' ? this.baseUrlGlz : this.baseUrl;

        const response = await fetch(`${url}${endpoint}`, {
            method: 'DELETE',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            this.verifyStatusCode(response.status, exceptions);
        }

        return await response.json() || null;
    }

    async fetchContent() {
        return await this.fetch('/content-service/v3/content', 'shared');
    }

    // Utility functions
    async getLiveSeason() {
        return (await this.fetchMMR()).LatestCompetitiveUpdate.SeasonID;
    }

    checkPuuid(puuid) {
        return puuid || this.puuid;
    }

    async getCurrentPartyId() {
        const party = await this.partyFetchPlayer();
        return party.CurrentPartyID;
    }

    async coregameCheckMatchId(matchId) {
        return matchId || (await this.coregameFetchPlayer()).MatchID;
    }

    async pregameCheckMatchId(matchId) {
        return matchId || (await this.pregameFetchPlayer()).MatchID;
    }

    checkQueueType(queueId) {
        if (!queues.includes(queueId)) {
            throw new Error('Invalid queue type');
        }
    }

    buildUrls() {
        const baseUrl = baseEndpoint.replace('{shard}', this.shard);
        const baseUrlGlz = baseEndpointGlz.replace('{shard}', this.shard).replace('{region}', this.region);
        const baseUrlShared = baseEndpointShared.replace('{shard}', this.shard);
        return [baseUrl, baseUrlGlz, baseUrlShared];
    }

    async getHeaders() {
        if (!this.auth) {
            return await this.getAuthHeaders();
        }

        const [puuid, headers, _] = await this.auth.authenticate();
        headers['X-Riot-ClientPlatform'] = this.clientPlatform;
        headers['X-Riot-ClientVersion'] = await this.getCurrentVersion();
        return [puuid, headers, null];
    }

    async getAuthHeaders() {
        const localHeaders = {
            'Authorization': `Basic ${base64.encode(`riot:${this.lockfile.password}`)}`
        };

        const response = await fetch(`https://127.0.0.1:${this.lockfile.port}/entitlements/v1/token`, {
            headers: localHeaders,
            agent: new (require('https').Agent)({ rejectUnauthorized: false }) // This line is specific to Node.js and should be removed for browser use
        });

        if (!response.ok) {
            throw new Error('Failed to get auth headers');
        }

        const entitlements = await response.json();
        const puuid = entitlements.subject;
        const headers = {
            'Authorization': `Bearer ${entitlements.accessToken}`,
            'X-Riot-Entitlements-JWT': entitlements.token,
            'X-Riot-ClientPlatform': this.clientPlatform,
            'X-Riot-ClientVersion': await this.getCurrentVersion()
        };

        return [puuid, headers, localHeaders];
    }

    async getCurrentVersion() {
        const response = await fetch('https://valorant-api.com/v1/version');
        const data = await response.json();
        return `${data.branch}-shipping-${data.buildVersion}-${data.version.split('.')[3]}`;
    }

    async getLockfile() {
        return new Promise((resolve, reject) => {
            overwolf.io.readFileContents(this.lockfilePath, 'utf8', result => {
                if (result.success) {
                    const data = result.content.split(':');
                    const keys = ['name', 'PID', 'port', 'password', 'protocol'];
                    resolve(Object.fromEntries(keys.map((key, index) => [key, data[index]])));
                } else {
                    reject(new LockfileError('Lockfile not found'));
                }
            });
        });
    }
}

export default Client;

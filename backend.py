from xmlrpc.client import ResponseError
from flask import Flask, json, jsonify, request
from flask_cors import CORS
import requests
import valclient  # Ensure valclient is installed and configured
import typing as t
import base64



app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class CustomClient(valclient.Client):
    def __init__(self, region: t.Text = "na", auth: t.Optional[t.Mapping] = None, lockfile_content: t.Optional[str] = None, *args, **kwargs):
        self.base_endpoint_local = "http://127.0.0.1:{port}"
        self.base_endpoint = "https://pd.{shard}.a.pvp.net"
        self.base_endpoint_glz = "https://glz-{region}-1.{shard}.a.pvp.net"
        self.base_endpoint_shared = "https://shared.{shard}.a.pvp.net"

        self.regions = ["na", "eu", "latam", "br", "ap", "kr", "pbe"]
        self.region_shard_override = {
        "latam": "na",
        "br": "na",
        }
        self.shard_region_override = {"pbe": "na"}

        self.queues = [
        "competitive",
        "custom",
        "deathmatch",
        "ggteam",
        "snowball",
        "spikerush",
        "unrated",
        "onefa",
        "null",
]
        self.puuid = ""
        self.player_name = ""
        self.player_tag = ""
        self.lockfile = {}
        self.headers = {}
        self.local_headers = {}
        self.region = region
        self.shard = region
        self.auth = None
        self.client_platform = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9"
        self.session = {}  # Placeholder for session data
        if lockfile_content:
            print("hi")
            # Parse the lockfile content and use it to initialize the client
            self.lockfile = self._parse_lockfile(lockfile_content)
            print(self.lockfile)
        else:
            self.lockfile = None
        self.base_url, self.base_url_glz, self.base_url_shared = self.__build_urls()

    def __build_urls(self) -> t.Tuple[str, str, str]:
        """Generate URLs based on region/shard"""
        base_url = self.base_endpoint.format(shard=self.shard)
        base_url_glz = self.base_endpoint_glz.format(shard=self.shard, region=self.region)
        base_url_shared = self.base_endpoint_shared.format(shard=self.shard)
        return base_url, base_url_glz, base_url_shared

    def region_to_shard(self, region: str) -> str:
        """Convert region to shard if necessary"""
        region_shard_map = {
            'na': 'na',
            'latam': 'na',
            'br': 'na',
            'pbe': 'pbe',
            'eu': 'eu',
            'ap': 'ap',
            'kr': 'kr'
        }
        return region_shard_map.get(region, 'na')

    def _parse_lockfile(self, lockfile_content: str) -> t.Dict[str, str]:
        """Parse the lockfile content and return a dictionary."""
        data = lockfile_content.split(':')
        keys = ["name", "PID", "port", "password", "protocol"]
        if len(data) != len(keys):
            raise ValueError('Lockfile format is incorrect')
        return dict(zip(keys, data))

    def set_session(self, session_data: t.Dict[str, t.Any]) -> None:
        """Set the session data."""
        self.session = session_data

    def activate(self) -> None:
        print("activating")
        """Activate the client and get authorization using the custom lockfile."""
        try:
            if self.lockfile:
                print("lockfile found")
                # Normally here you would set up headers or other client state based on self.lockfile
                self.puuid, self.headers, self.local_headers = self.__get_headers()
                print("1")
                # Instead of fetching the session, use the provided session data
                self.player_name = self.session.get("game_name", "")
                print(self.player_name)
                self.player_tag = self.session.get("game_tag", "")
                print(self.player_tag)

            else:
                print("hi")
                self.puuid, self.headers, self.local_headers = self.auth.authenticate()
        except Exception as e:
            print(f"Unable to activate; {str(e)}")
    def __verify_status_code(self, status_code, exceptions={}):
        """Verify that the request was successful according to exceptions"""
        if status_code in exceptions.keys():
            response_exception = exceptions[status_code]
            raise response_exception[0](response_exception[1])

    def __get_headers(self) -> t.Tuple[t.Text, t.Mapping[t.Text, t.Any]]:
        """Get authorization headers to make requests"""
        try:
            if self.auth is None:
                return self.__get_auth_headers()
            puuid, headers, _ = self.auth.authenticate()
            headers["X-Riot-ClientPlatform"] = (self.client_platform,)
            headers["X-Riot-ClientVersion"] = self.__get_current_version()
            return puuid, headers, None

        except Exception as e:
            print(e)
            raise ("Unable to get headers; is VALORANT running?")
    def __get_auth_headers(self) -> t.Tuple[t.Text, t.Mapping[t.Text, t.Any]]: 
        # headers for pd/glz endpoints
        local_headers = {
            "Authorization": (
                "Basic "
                + base64.b64encode(
                    ("riot:" + self.lockfile["password"]).encode()
                ).decode()
            )
        }
        response = requests.get(
            "https://127.0.0.1:{port}/entitlements/v1/token".format(
                port=self.lockfile["port"]
            ),
            headers=local_headers,
            verify=False,
        )
        entitlements = response.json()
        puuid = self.entitlements["subject"]
        headers = {
            "Authorization": f"Bearer {entitlements['accessToken']}",
            "X-Riot-Entitlements-JWT": entitlements["token"],
            "X-Riot-ClientPlatform": self.client_platform,
            "X-Riot-ClientVersion": self.__get_current_version(),
        }
        return puuid, headers, local_headers
    def fetch(
        self, endpoint="/", endpoint_type="pd", exceptions={}
    ) -> dict:  # exception: code: {Exception, Message}
        """Get data from a pd/glz/local endpoint"""
        data = None
        if endpoint_type in ["pd", "glz", "shared"]:
            response = requests.get(
                f'{self.base_url_glz if endpoint_type == "glz" else self.base_url if endpoint_type == "pd" else self.base_url_shared if endpoint_type == "shared" else self.base_url}{endpoint}',
                headers=self.headers,
            )

            # custom exceptions for http status codes
            self.__verify_status_code(response.status_code, exceptions)

            try:
                data = json.loads(response.text)
            except:  # as no data is set, an exception will be raised later in the method
                pass

        elif endpoint_type == "local":
            response = requests.get(
                "https://127.0.0.1:{port}{endpoint}".format(
                    port=self.lockfile["port"], endpoint=endpoint
                ),
                headers=self.local_headers,
                verify=False,
            )

            # custom exceptions for http status codes
            self.__verify_status_code(response.status_code, exceptions)

            try:
                data = response.json()
            except:  # as no data is set, an exception will be raised later in the method
                pass

        if data is None:
            raise ResponseError("Request returned NoneType")

        if "httpStatus" not in data:
            return data
        if data["httpStatus"] == 400:
            # if headers expire (i dont think they ever do but jic), refresh em!
            if self.auth is None:
                self.puuid, self.headers, self.local_headers = self.__get_headers()
            else:
                self.puuid, self.headers, self.local_headers = self.auth.authenticate()
            return self.fetch(endpoint=endpoint, endpoint_type=endpoint_type)
        

@app.route('/activate', methods=['POST'])
def activate_client():
    data = request.json
    lockfile_content = data.get('lockfileContent')
    session_data = data.get('sessionData')  # Receive session data from the frontend

    print(f"Received lockfile content: {lockfile_content}")
    print(f"Received session data: {session_data}")

    if not lockfile_content:
        return jsonify({"error": "Lockfile content is required"}), 400

    if not session_data:
        return jsonify({"error": "Session data is required"}), 400

    try:
        # Initialize CustomClient with the lockfile details
        client = CustomClient(lockfile_content=lockfile_content)
        print("Client initialized successfully")

        # Set the session data
        client.set_session(session_data)
        print("Session data set successfully")

        # Activate the client
        client.activate()
        print("Client activated successfully")

        # Fetch account XP or any other information as needed
        response = client.fetch_account_xp()
        print(f"Fetched response: {response}")

        return jsonify(response)
    except Exception as e:
        print(f"Error in /activate route: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # Ensure it's accessible externally

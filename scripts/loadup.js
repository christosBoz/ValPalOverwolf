let puuid = '';
document.addEventListener('DOMContentLoaded', async () => {
    const activationStatusPre = document.getElementById('activation-status');
    const loadingBar = document.getElementById('loading-bar');
    
    try {

        //update progress bar to 10% when script starts
        updateProgressBar(10);

        // Adjust the path to your actual lockfile path
        const lockfilePath = overwolf.io.paths.localAppData + '/Riot Games/Riot Client/Config/lockfile'; // Change this to the actual path
        const shooterGameLog = overwolf.io.paths.localAppData + '/VALORANT/Saved/Logs/ShooterGame.log';

        // Read the lockfile content
        const lockfileContent = await new Promise((resolve, reject) => {
            overwolf.io.readTextFile(lockfilePath, { encoding: 'utf8' }, (result) => {
                if (result.success) {
                    resolve(result.content);
                } else {
                    reject(new Error('Failed to read lockfile: ' + result.error));
                }
            });
        });

        const shooterGameLogContent = await new Promise((resolve, reject) => {
            overwolf.io.readTextFile(shooterGameLog, { encoding: 'utf8' }, (result) => {
                if (result.success) {
                    resolve(result.content);
                    updateProgressBar(20); // update progress bar to 20% after lockfile read
                } else {
                    reject(new Error('Failed to read shootergame: ' + result.error));
                }
            });
        });
        // console.log(shooterGameLogContent)
        console.log(shooterGameLogContent.match("https://glz-(.+/?)-1.(.+?).a.pvp.net")[1])
        const shard = shooterGameLogContent.match("https://glz-(.+/?)-1.(.+?).a.pvp.net")[1]

        const [name, pid, port, password, protocol] = lockfileContent.split(':');

        // Base64 encode the credentials as required
        const base64Credentials = btoa(`riot:${password}`);

        // Setup the headers using the extracted password
        const localHeaders = {
            'Authorization': `Basic ${base64Credentials}`
        };

        // Fetch chat session data from the local endpoint using the extracted port
        const sessionResponse = await fetch(`https://127.0.0.1:${port}/chat/v1/session`, {
            method: 'GET',
            headers: localHeaders
        });

        if (!sessionResponse.ok) {
            throw new Error('Failed to fetch chat session data');
        }

        const sessionData = await sessionResponse.json();
        updateProgressBar(50); // update progress bar to 50% after fetching session data

        // Fetch entitlements token from the local endpoint
        const entitlementsResponse = await fetch(`https://127.0.0.1:${port}/entitlements/v1/token`, {
            method: 'GET',
            headers: localHeaders
        });

        if (!entitlementsResponse.ok) {
            throw new Error('Failed to fetch entitlements token');
        }

        const entitlementsData = await entitlementsResponse.json();
        updateProgressBar(60); // update progress bar to 60% after fetching entitlements
        console.log(entitlementsData);

        // Send the lockfile content, session data, and entitlements token to the Python server
        const response = await fetch('http://ec2-3-18-187-99.us-east-2.compute.amazonaws.com:5000/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lockfileContent,
                sessionData,
                entitlementsData,// Include the fetched entitlements data
                shard
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        //activationStatusPre.textContent = `Success: ${JSON.stringify(result, null, 2)}`;

        puuid = result.puuid;
        localStorage.setItem('puuid', puuid);

        updateProgressBar(80); // Update progress to 80% after server response

        // Refresh inventory if not already available in localStorage
        const userInventory = localStorage.getItem(`${puuid}_inventory`);
        if (userInventory === null) {
            try {
                const refreshResponse = await fetch(`http://ec2-3-18-187-99.us-east-2.compute.amazonaws.com:5000/refresh-inventory?puuid=${puuid}`);
                if (!refreshResponse.ok) {
                    throw new Error('Failed to refresh inventory');
                }
                const refreshData = await refreshResponse.json();
                localStorage.setItem(`${puuid}_inventory`, JSON.stringify(refreshData));

                // Redirect to index.html after inventory is successfully loaded
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error refreshing inventory:', error);
                activationStatusPre.textContent += `\nError refreshing inventory: ${error.message}`;
            }
        } else {
            // Redirect if inventory is already present
            window.location.href = 'index.html';
        }

        //updateProgressBar(100); // Update progress to 100% when everything is done
    } catch (error) {
        console.log(error);
        activationStatusPre.textContent = `Error: ${error.message}`;
    }
});

// function to update loading bar progress
function updateProgressBar(value) {
    const loadingBar = document.getElementById('loading-bar');
    loadingBar.value = value;
}

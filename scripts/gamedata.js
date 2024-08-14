let user_id = '';
let playerLocked = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch user ID and agents data in parallel
        const [useridResponse] = await Promise.all([
            fetch('http://127.0.0.1:5000/get-userid'),

        ]);

        if (!useridResponse.ok) {
            throw new Error('Network response was not ok');
        }
        user_id = await useridResponse.text();
        console.log('UserID:', user_id);
    } catch (error) {
        console.error('Error fetching and processing data:', error);
    }
});



// Log when the Overwolf API is available
if (typeof overwolf !== 'undefined') {
    console.log("Overwolf API is available!");
} else {
    console.error("Overwolf API is not available.");
}


// Check if Valorant is running when the app starts
overwolf.games.getRunningGameInfo(function(gameInfo) {
    if (gameInfo && gameInfo.isRunning) {
        console.log("Valorant is running: ", gameInfo);
        initializeGameEventListeners()
    } else {
        console.log("No game is currently running.");
    }
});

// Function to initialize game event listeners
function initializeGameEventListeners() {
    console.log("Initializing game event listeners...");
    // Set the required features for tracking kills and deaths
    overwolf.games.events.setRequiredFeatures(["match_info", "kill", "death"], function(info) {
        if (info.status === "error") {
            console.error("Could not set required features:", info.reason);
        } else {
            console.log("Required features set successfully:", info);
        }
    });

    // Listen for new game events
    overwolf.games.events.onNewEvents.addListener(function(event) {
        //console.log("New event received:", event);
        event.events.forEach(function(e) {
            if (e.name === "kill") {
                console.log("Kill event detected:", e);

                // Example: Play a specific sound based on the weapon used
                let soundFileName = "among-us-roundstart.mp3";  // Default sound

                // Play the specific sound by its name
                playSoundByName(soundFileName);

                // headshot sound if it cant find headshot, play kill audio

            } else if (e.name === "death") {
                console.log("Death event detected:", e);

                soundFileName = "Nyaa - Sound Effect (HD).mp3";

                playSoundByName(soundFileName);
            }
                // round win 

        });
    });
}


overwolf.games.events.onInfoUpdates2.addListener(function(info) {
    if (info.info && info.feature === "match_info" && info.info.match_info) {
        for (let key in info.info.match_info) {
            if (key.startsWith("roster_")) {
                let playerInfo = info.info.match_info[key];

                // Parse the roster data (stringified JSON)
                let parsedPlayerInfo = JSON.parse(playerInfo);

                // Check if the player is the local player by matching the player_id with userId
                if (parsedPlayerInfo.player_id === user_id) {
                    console.log("has local player");
                    if (parsedPlayerInfo.locked) {
                        console.log(`You have locked in: ${playerInfo.character}`);

                        // Retrieve the saved loadout from localStorage
                        const loadoutKey = `${user_id}_jett_loadout`;
                        const savedLoadout = localStorage.getItem(loadoutKey);

                        if (savedLoadout) {
                            // Parse the saved loadout as it is stored as a JSON string
                            const loadoutData = JSON.parse(savedLoadout);

                            // Send the loadout data to the backend to update
                            sendLoadoutUpdate(loadoutData);
                        } else {
                            console.error("No saved loadout found for this agent.");
                        }
                    }
                }
            }
        }
    }
});

// Function to send loadout update to the backend
async function sendLoadoutUpdate(loadoutData) {
    try {
        const response = await fetch('http://127.0.0.1:5000/update_loadout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loadoutData)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const updatedLoadout = await response.json();
        console.log('Loadout updated:', updatedLoadout);
    } catch (error) {
        console.error('Failed to update loadout:', error);
    }
}

// Listen for changes in running game status
overwolf.games.onGameInfoUpdated.addListener(function(info) {
    if (info && info.gameInfo && info.gameInfo.isRunning) {
        //console.log("A new game has started: ", info.gameInfo);
        if (info.gameInfo.id === 21640) { // 21640 is the game_id for Valorant
            initializeGameEventListeners();
        }
    } else {
        console.log("Game has stopped or switched.");
    }
});


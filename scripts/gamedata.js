let user_id = '';
let playerLocked = false;
let lastWonRounds = 0;
let currentloadout = ''

document.addEventListener('DOMContentLoaded', async () => {
    try {
        
        user_id = localStorage.getItem(`puuid`) 
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
    } else {        console.log("No game is currently running.");
    }
});

// Function to initialize game event listeners
async function initializeGameEventListeners() {
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

            let soundFileName = "fortnite hs.mp3";

            if (e.data && e.data.headshots && parseInt(e.data.final_headshot) > 0) {
                console.log("Headshot detected!");
                soundFileName = "fortnite hs.mp3";  // Replace with your actual headshot sound file name
            }

            playSoundByName(soundFileName);

            } else if (e.name === "death") {
                console.log("Death event detected:", e);

                soundFileName = "Nyaa - Sound Effect (HD).mp3";

                playSoundByName(soundFileName);
            }
        });
    });
}
const agentNameMapping = {
    "Clay": "Raze",
    "Pandemic": "Viper",
    "Wraith": "Omen",
    "Hunter": "Sova",
    "Thorne": "Sage",
    "Phoenix": "Phoenix",
    "Wushu": "Jett",
    "Gumshoe": "Cypher",
    "Sarge": "Brimstone",
    "Breach": "Breach",
    "Vampire": "Reyna",
    "Killjoy": "Killjoy",
    "Guide": "Skye",
    "Stealth": "Yoru",
    "Rift": "Astra",
    "Grenadier": "KAY/O",
    "Deadeye": "Chamber",
    "Sprinter": "Neon",
    "BountyHunter": "Fade",
    "Mage": "Harbor",
    "AggroBot": "Gekko",
    "Cable": "Deadlock",
    "Sequoia": "Iso",
    "Smonk": "Clove"
}


function getInGameAgentName(character) {
    return agentNameMapping[character] || null; // Returns the in-game name or null if not found
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
                        // Get the in-game name using the mapping function
                        const inGameAgentName = getInGameAgentName(parsedPlayerInfo.character);

                        if (inGameAgentName) {
                            console.log(`You have locked in: ${inGameAgentName}`);

                            // Retrieve the saved loadout from localStorage
                            const loadoutKey = `${user_id}_${inGameAgentName}_loadout`;
                            const savedLoadout = localStorage.getItem(loadoutKey);

                            if (savedLoadout) {
                                // Parse the saved loadout as it is stored as a JSON string
                                const loadoutData = JSON.parse(savedLoadout);

                                // Send the loadout data to the backend to update
                                sendLoadoutUpdate(loadoutData);
                            } else {
                                console.error("No saved loadout found for this agent.");
                            }
                        } else {
                            console.error("No matching in-game name found for the character.");
                        }
                    }
                }
            }
        }
    }
    // ------------------------------------------------------------------------------------------------
    if (info.info && info.feature === "match_info" && info.info.match_info.round_phase) {
        let roundPhase = info.info.match_info.round_phase;

        if (roundPhase === "combat") {
            console.log("Combat round phase has begun.");
            soundFileName = "among-us-roundstart.mp3";
            playSoundByName(soundFileName);
        }
    }

    if (info.info && info.feature === "match_info" && info.info.match_info.score) {
        let scoreData = JSON.parse(info.info.match_info.score);
        let currentWonRounds = scoreData.won;

        // Check if a round was won
        if (currentWonRounds > lastWonRounds) {
            console.log("Round won!");
            soundFileName = "ara.mp3";
            playSoundByName(soundFileName, 0.4
            );
            lastWonRounds = currentWonRounds; // Update the won rounds tracker
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

overwolf.games.events.onNewEvents.addListener(function(event) {
    console.log("Raw event data:", event);
});

overwolf.games.events.onInfoUpdates2.addListener(async function(info) {
    if (info.info && info.info.match_info) {
        console.log("Map detected:", info.info.match_info.map);

        let map = info.info.match_info.map;

        if (map === null) {
            console.log("Game has been dodged or ended");
            sendLoadoutUpdate(currentloadout);
        }else if (map === undefined) {
            console.log("Game is ongoing");
        }else{
            console.log("Game has started");
            try {
                const loadoutResponse = await fetch(`http://ec2-52-14-242-49.us-east-2.compute.amazonaws.com:5000/update_loadout?puuid=${user_id}`);
                currentloadout = await loadoutResponse.json();
                console.log(currentloadout);
            } catch (error) {
                console.error('Error fetching loadout:', error);
            }
        }
    }
});
/*overwolf.games.events.onInfoUpdates2.addListener(function(info) {
    console.log("Raw info update received:", JSON.stringify(info, null, 2));
});*/
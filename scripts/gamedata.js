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
        initializeGameEventListeners();
    } else {
        console.log("No game is currently running.");
    }
});

// Function to initialize game event listeners
function initializeGameEventListeners() {
    // Set the required features for tracking kills and deaths
    overwolf.games.events.setRequiredFeatures(["kill", "death", "match_info"], function(info) {
        if (info.status === "error") {
            console.error("Could not set required features:", info.reason);
        } else {
            console.log("Required features set successfully:", info);
        }
    });

    // Listen for new game events
    overwolf.games.events.onNewEvents.addListener(function(event) {
        console.log("New event received:", event);
        event.events.forEach(function(e) {
            if (e.name === "kill") {
                console.log("Kill event detected:", e);
            } else if (e.name === "death") {
                console.log("Death event detected:", e);
            }
        });
    });

    overwolf.games.events.onNewEvents.addListener(function(event) {
        //console.log("Raw event data:", event);
        event.events.forEach(function(e) {
            //console.log("Event name:", e.name);
            // Handle specific event types here
        });
    });
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

// Debugging: log any errors from the Overwolf API
overwolf.extensions.onAppLaunchTriggered.addListener(function(event) {
    console.log("App launched: ", event);
});

overwolf.extensions.onAppLaunchError.addListener(function(event) {
    console.error("App launch error: ", event);
});

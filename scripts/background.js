console.log("Background loaded")
// Subscribe to Valorant game events
function subscribeToGameEvents() {
    overwolf.games.events.setRequiredFeatures(["match_start"], (response) => {
      if (response.success) {
        console.log("Subscribed to match_start event successfully.");
        overwolf.games.events.onNewEvents.addListener((event) => {
          if (event.name === "match_start") {
            logMatchId(event.data);
          }
        });
      } else {
        console.error("Failed to subscribe to game events:", response);
      }
    });
  }
  
  // Log the match ID
  function logMatchId(data) {
    if (data && data.match_id) {
      console.log("Match started with ID:", data.match_id);
    } else {
      console.log("Match started, but no match ID was found in data:", data);
    }
  }
// Listen for the hotkey press event
overwolf.settings.hotkeys.onPressed.addListener((event) => {
  if (event.name === "toggle_app") {
      // Get the declared window
      overwolf.windows.obtainDeclaredWindow("MainWindow", (result) => {
          if (result.success) {
              // Check the window's current state
              overwolf.windows.getWindowState(result.window.id, (stateResult) => {
                  if (stateResult.success) {
                      if (stateResult.window_state === "normal" || stateResult.window_state === "maximized") {
                          // If the window is visible, hide it
                          overwolf.windows.hide(result.window.id);
                      } else {
                          // If the window is hidden, restore it
                          overwolf.windows.restore(result.window.id);
                      }
                  }
              });
          } else {
              console.error("Failed to obtain window:", result);
          }
      });
  }
});



  
  // Detect when Valorant is running
  function checkForValorant(gameInfo) {
    // const VALORANT_GAME_ID = 21626;
    const VALORANT_GAME_ID = 21640;
  
    if (gameInfo && gameInfo.id === VALORANT_GAME_ID && gameInfo.isRunning) {
      console.log("Valorant detected. Subscribing to game events...");
      subscribeToGameEvents();
    }
  }
  
  // Listen for game launch events
  overwolf.games.onGameInfoUpdated.addListener((info) => {
    if (info.gameChanged && info.runningChanged) {
      checkForValorant(info.gameInfo);
    }
  });
  
  // Initial check for running game
  overwolf.games.getRunningGameInfo((gameInfo) => {
    if (gameInfo && gameInfo.isRunning) {
      checkForValorant(gameInfo);
    }
  });
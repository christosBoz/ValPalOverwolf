console.log("✅ Background script loaded!");

// Function to launch the main window
function launchMainWindow() {
    overwolf.windows.obtainDeclaredWindow("MainWindow", (result) => {
        if (result.success) {
            console.log("🔹 Launching MainWindow...");
            overwolf.windows.restore(result.window.id);
        } else {
            console.error("❌ Failed to obtain MainWindow:", result);
        }
    });
}

// Open the main window on startup
overwolf.extensions.onAppLaunchTriggered.addListener(() => {
    console.log("🔄 App launched! Opening MainWindow...");
    launchMainWindow();
});

// Ensure the main window opens when Overwolf starts the app
launchMainWindow();

// Function to toggle MainWindow visibility
function toggleMainWindow() {
    overwolf.windows.obtainDeclaredWindow("MainWindow", (result) => {
        if (result.success) {
            const windowId = result.window.id;

            overwolf.windows.getWindowState(windowId, (stateResult) => {
                if (stateResult.success) {
                    console.log(`🔹 Current window state: ${stateResult.window_state}`);

                    if (stateResult.window_state === "normal" || stateResult.window_state === "maximized") {
                        console.log("🔻 Hiding MainWindow...");
                        overwolf.windows.hide(windowId);
                    } else {
                        console.log("🔺 Restoring MainWindow...");
                        overwolf.windows.restore(windowId, (restoreResult) => {
                            if (!restoreResult.success) {
                                console.error("❌ Failed to restore, trying bringToFront...");
                                overwolf.windows.bringToFront(windowId);
                            }
                        });
                    }
                } else {
                    console.error("❌ Failed to get window state:", stateResult);
                }
            });
        } else {
            console.error("❌ Failed to obtain MainWindow:", result);
        }
    });
}

// Use Overwolf to listen for global Alt+V keypress
let isAltPressed = false;

// Track Alt key press
overwolf.games.inputTracking.onKeyDown.addListener((info) => {
    if (info.key === "164") { // 18 is the key code for Alt
        isAltPressed = true;
    }
    if (info.key === "86" && isAltPressed) { // 86 is 'V'
        console.log("🔹 Alt+V pressed! Toggling MainWindow...");
        toggleMainWindow();
    }
});

// Track Alt key release
overwolf.games.inputTracking.onKeyUp.addListener((info) => {
    if (info.key === "164") {
        isAltPressed = false;
    }
});

// Enable input tracking


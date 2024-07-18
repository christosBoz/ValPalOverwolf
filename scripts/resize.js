// Function to resize the current window considering monitor scaling
function resizeToScreenWithScaling() {
  // Function to get the current screen dimensions and resize the window
  function getCurrentScreenAndResize() {
    const screenWidth = screen.width;
    const screenHeight = screen.height;
    const scaleFactor = window.devicePixelRatio;

    console.log("Screen width:", screenWidth, "Screen height:", screenHeight);
    console.log("Scaling factor:", scaleFactor);

    const scaledScreenWidth = Math.round(screenWidth / scaleFactor);
    const scaledScreenHeight = Math.round(screenHeight / scaleFactor);

    console.log("Scaled screen width:", scaledScreenWidth, "Scaled screen height:", scaledScreenHeight);

    const windowWidth = Math.round(scaledScreenWidth * 0.7);
    const windowHeight = Math.round(scaledScreenHeight * 0.7);

    console.log("Window width:", windowWidth, "Window height:", windowHeight);

    overwolf.windows.getCurrentWindow(function(result) {
      if (result.status === "success") {
        const window = result.window;

        overwolf.windows.changeSize(window.id, windowWidth, windowHeight, function(sizeResult) {
          if (sizeResult.status === "success") {
            console.log('Window resized to ${windowWidth}x${windowHeight}');
          } else {
            console.error("Failed to resize window:", sizeResult);
          }
        });
      } else {
        console.error("Failed to get current window:", result);
      }
    });
  }

  // Resize window when the monitor configuration changes


  // Initial resize on script start
  getCurrentScreenAndResize();
}

// Call the function to resize the window considering monitor scaling
resizeToScreenWithScaling();
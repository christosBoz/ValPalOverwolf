overwolf.windows.getCurrentWindow(function(result) {
    if (result.status === "success") {
      const window = result.window;
      const screenWidth = screen.width;
      const screenHeight = screen.height;
      const windowWidth = Math.round(screenWidth * 0.7);
      const windowHeight = Math.round(screenWidth * 0.4);
  
      overwolf.windows.changeSize(window.id, windowWidth, windowHeight, function(result) {
        if (result.status === "success") {
          console.log(`Window resized to ${windowWidth}x${windowHeight}`);         
        } else {
          console.error("Failed to resize window:", result);
        }
      });
    } else {
      console.error("Failed to get current window:", result);
    }
  });



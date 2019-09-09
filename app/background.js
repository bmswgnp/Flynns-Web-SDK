chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
      'outerBounds': {
        'width': 782,
        'height': 419,
        'left' : 0,
        'top' : 0,
      },
    });
  });
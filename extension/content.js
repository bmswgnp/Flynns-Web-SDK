// popup.js => injection.js
chrome.runtime.onMessage.addListener((message, sender, response) => {
    window.postMessage(message);
});

// popup.js <= injection.js
window.addEventListener("message", (event) => {
    if(event.data.type == "missions") {
        chrome.runtime.sendMessage(event.data);
    }
});

const injectScript = (filename) => {
    const path = chrome.extension.getURL(filename)
    const script = document.createElement("script");
    script.setAttribute("src", path);
    document.body.appendChild(script);
}

injectScript("/Missions.js");
injectScript("/injection.js");
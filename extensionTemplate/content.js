// from popup.js
chrome.runtime.onMessage.addListener((request, sender, response) => {
    switch(request.message) {
        case "connectInsole":
            window.postMessage({message: request.message, isLeft: request.isLeft});
            break;
        case "isInsoleConnected":
            window.postMessage({message: request.message, isLeft: request.isLeft});
            break;
        default:
            console.log("unknown message " + request.message);
            break;
    }
})

// from injection.js
window.addEventListener("message", (event) => {
    switch(event.data.message) {
        case "insoleConnectionStatus":
            chrome.runtime.sendMessage({message: event.data.message, isLeft: event.data.isLeft, isConnected: event.data.isConnected})
            break;
        default:
            break;
    }
})

const injectionScript = document.createElement('script');
    injectionScript.type = "text/javascript";
    injectionScript.src = chrome.extension.getURL("/injection.js");
document.body.appendChild(injectionScript);
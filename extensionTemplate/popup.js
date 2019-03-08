const connectLeftInsole = document.createElement("button");
    connectLeftInsole.innerText = "Connect Left Insole";
    connectLeftInsole.addEventListener("click", (event) => {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {message: "connectInsole", isLeft: true});
        });
    })

const connectRightInsole = document.createElement("button");
    connectRightInsole.innerText = "Connect Right Insole";
    connectRightInsole.addEventListener("click", (event) => {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {message: "connectInsole", isLeft: false});
        });
    })


chrome.runtime.onMessage.addListener((request, sender, response) => {
    switch(request.message) {
        case "insoleConnectionStatus":
            if(!request.isConnected)
                document.body.appendChild(request.isLeft? connectLeftInsole : connectRightInsole);
            break;
        default:
            break;
    }
})

chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {message: "isInsoleConnected", isLeft: true});
    chrome.tabs.sendMessage(activeTab.id, {message: "isInsoleConnected", isLeft: false});
});
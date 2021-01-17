chrome.runtime.onMessage.addListener(function(request) {
    console.log("Called");
    if (request.scheme == "dark") {
        chrome.browserAction.setIcon({
            path: {
                "32": "icon32_light.png",
                "16": "icon16_light.png"
            }
        });
    }
});
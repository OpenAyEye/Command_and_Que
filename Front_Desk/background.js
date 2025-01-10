chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
});

chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        url: chrome.runtime.getURL("panel.html"), // Path to panel.html
        type: "popup",
        width: 300, // Adjust width as needed
        height: 600 // Adjust height for usability
    }, (window) => {
        console.log("Popup window created:", window);
    });
});

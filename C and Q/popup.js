// popup.js
// Register Extension - Persistent Queue Display

// Request the current queue state from the background service
function requestQueueState() {
    chrome.runtime.sendMessage({ type: 'getQueueState' }, (response) => {
        if (response && response.queueData) {
            updateQueueDisplay(response.queueData);
        }
    });
}

// Send ready signal to the background service
function sendReadySignal() {
    chrome.runtime.sendMessage({ type: 'sendReadySignal' });
}

// Update the queue display to show only the first three in the queue
function updateQueueDisplay(queueData) {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = ''; // Clear the list

    const visibleQueue = queueData.slice(0, 3); // Show only the first 3 in the queue
    for (const item of visibleQueue) {
        const li = document.createElement('li');
        li.textContent = `${item.register} (${item.color.toUpperCase()})`;
        li.style.color = item.color;
        queueList.appendChild(li);
    }
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
    requestQueueState();

    document.getElementById('readyButton').addEventListener('click', () => {
        sendReadySignal();
    });
});

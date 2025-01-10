// background.js
// Maintain persistent WebSocket connection for Register Extension

let ws;
let queueData = []; // Store the current queue state
let registerId = null; // Store the current register ID

function connectToServer() {
    try {
        ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            console.log('Connected to server');

            // Check for existing registerId
            chrome.storage.local.get('registerId', (result) => {
                registerId = result.registerId || null;

                if (!registerId) {
                    ws.send(JSON.stringify({ type: 'requestRegisterId' }));
                } else {
                    ws.send(JSON.stringify({ type: 'requestQueueState' }));
                }
            });
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'registerAssigned') {
                registerId = message.registerId;
                chrome.storage.local.set({ registerId });
                console.log(`Assigned new register ID: ${registerId}`);
            } else if (message.type === 'queueUpdate') {
                queueData = message.data;
            } else if (message.type === 'queueState') {
                queueData = message.data;
            }
        };

        ws.onclose = () => {
            console.error('Connection to server lost. Retrying...');
            retryConnection();
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            retryConnection();
        };
    } catch (err) {
        console.error('WebSocket connection failed:', err.message);
        retryConnection();
    }
}

// Retry the connection after a delay
function retryConnection() {
    setTimeout(connectToServer, 5000); // Retry every 5 seconds
}

// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getQueueState') {
        sendResponse({ queueData });
    } else if (request.type === 'sendReadySignal') {
        if (registerId && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'registerReady', registerId }));
        }
    }
});

// Start the WebSocket connection
connectToServer();

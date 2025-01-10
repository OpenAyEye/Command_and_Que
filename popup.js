// popup.js
// Front Desk Extension - Display Registers and Their Status

let ws;

// Connect to the server
function connectToServer() {
    ws = new WebSocket('ws://10.1.10.94:8080');

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'queueUpdate') {
            updateRegisterDisplay(message.data);
        }
    };

    ws.onopen = () => {
        console.log('Connected to server');
    };

    ws.onclose = () => {
        console.error('Connection to server lost. Retrying...');
        setTimeout(connectToServer, 3000); // Retry connection after 3 seconds
    };
}

// Update the register status display
function updateRegisterDisplay(queueData) {
    const registerContainer = document.getElementById('registerContainer');
    registerContainer.innerHTML = ''; // Clear existing display

    // Get the number of registers from the config file (default to 10)
    const numberOfRegisters = localStorage.getItem('numberOfRegisters') || 10;

    for (let i = 1; i <= numberOfRegisters; i++) {
        const registerId = `Register${i}`;
        const registerStatus = queueData.find(item => item.register === registerId);

        const color = registerStatus ? registerStatus.color : 'gray';

        const registerDiv = document.createElement('div');
        registerDiv.classList.add('register');
        registerDiv.style.backgroundColor = color;
        registerDiv.textContent = registerId;

        registerContainer.appendChild(registerDiv);
    }
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
    connectToServer();
});

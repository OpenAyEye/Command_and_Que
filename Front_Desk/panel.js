let ws;

// Default configuration
const defaultConfig = {
    numberOfRegisters: 10, // Default number of registers
};

// Connect to the server
function connectToServer() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'queueUpdate') {
            updateRegisterDisplay(message.data);
        } else if (message.type === 'queueState') {
            updateRegisterDisplay(message.data);
        }
    };

    ws.onopen = () => {
        console.log('Connected to server');
        ws.send(JSON.stringify({ type: 'requestQueueState' }));
    };

    ws.onclose = () => {
        console.error('Connection to server lost. Retrying...');
        setTimeout(connectToServer, 3000);
    };
}

// Update the register display
function updateRegisterDisplay(queueData) {
    const registerContainer = document.getElementById('registerContainer');
    registerContainer.innerHTML = ''; // Clear the container

    const numberOfRegisters = defaultConfig.numberOfRegisters;
    for (let i = 1; i <= numberOfRegisters; i++) {
        const currentRegisterId = `Register${i}`;
        const registerStatus = queueData.find(item => item.register === currentRegisterId);

        const color = registerStatus ? registerStatus.color : 'gray';

        const registerDiv = document.createElement('div');
        registerDiv.classList.add('register');
        registerDiv.style.backgroundColor = color;
        registerDiv.textContent = currentRegisterId;

        registerContainer.appendChild(registerDiv);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    connectToServer();
});

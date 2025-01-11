// server.js
// Retail Queue Management System - Server Code

const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();

const config = {
    numberOfRegisters: 10, // Default number of registers
    serverPort: 8080,
};

// Set up SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE registers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registerId TEXT UNIQUE
    )`);
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let queue = []; // Array to manage register queue
const clients = {}; // Store client connections

// Broadcast updates to all clients
function broadcastQueue() {
    const queueData = queue.map((register, index) => {
        let color;
        if (index === 0) color = 'green';
        else if (index === 1) color = 'yellow';
        else if (index === 2) color = 'red';
        else color = 'blue';
        return { register, color };
    });

    Object.values(clients).forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'queueUpdate', data: queueData }));
        }
    });
}

// Assign a new register ID
function assignRegisterId(ws) {
    db.get(`SELECT COUNT(*) AS count FROM registers`, [], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Database error while assigning register ID.' }));
            return;
        }

        const newId = `Register${row.count + 1}`;
        db.run(`INSERT INTO registers (registerId) VALUES (?)`, [newId], (err) => {
            if (err) {
                console.error('Database insert error:', err);
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to assign register ID.' }));
                return;
            }
            try {
                ws.send(JSON.stringify({ type: 'registerAssigned', registerId: newId }));
                console.log(`Assigned new register ID: ${newId}`);
            } catch (sendError) {
                console.error('Error sending registerAssigned message:', sendError);
            }
        });
    });
}

wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).substr(2, 9);
    clients[clientId] = ws;
    console.log(`New client connected: ${clientId}`);

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (parseError) {
            console.error('Invalid message received:', message);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
            return;
        }

        if (data.type === 'registerReady') {
            if (!queue.includes(data.registerId)) {
                queue.push(data.registerId);
                console.log(`Register ready: ${data.registerId}`);
                broadcastQueue();
            }
        } else if (data.type === 'assignCustomer') {
            if (queue.length > 0) {
                const assignedRegister = queue.shift();
                console.log(`Customer assigned to: ${assignedRegister}`);
                broadcastQueue();
                ws.send(JSON.stringify({ type: 'customerAssigned', register: assignedRegister }));
            } else {
                console.log('No registers available to assign a customer.');
            }
        } else if (data.type === 'requestRegisterId') {
            assignRegisterId(ws);
        } else {
            console.error('Unknown message type:', data.type);
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type.' }));
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        delete clients[clientId];
    });

    ws.on('error', (err) => {
        console.error(`Error on connection with client ${clientId}:`, err.message);
    });
});

server.listen(config.serverPort, () => {
    console.log(`Server running on port ${config.serverPort}`);
});

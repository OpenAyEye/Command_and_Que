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
            return;
        }

        const newId = `Register${row.count + 1}`;
        db.run(`INSERT INTO registers (registerId) VALUES (?)`, [newId], (err) => {
            if (err) {
                console.error('Database insert error:', err);
                return;
            }
            ws.send(JSON.stringify({ type: 'registerAssigned', registerId: newId }));
            console.log(`Assigned new register ID: ${newId}`);
        });
    });
}

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'registerReady') {
            if (!queue.includes(data.registerId)) {
                queue.push(data.registerId);
                broadcastQueue();
            }
        } else if (data.type === 'assignCustomer') {
            if (queue.length > 0) {
                const assignedRegister = queue.shift();
                broadcastQueue();
                ws.send(JSON.stringify({ type: 'customerAssigned', register: assignedRegister }));
            }
        } else if (data.type === 'requestRegisterId') {
            assignRegisterId(ws);
        }
    });

    const clientId = Math.random().toString(36).substr(2, 9);
    clients[clientId] = ws;

    ws.on('close', () => {
        delete clients[clientId];
    });
});

server.listen(config.serverPort, () => {
    console.log(`Server running on port ${config.serverPort}`);
});

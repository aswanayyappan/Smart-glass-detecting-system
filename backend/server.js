const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
    serviceAccount = require('./smart-blindsystem-firebase-adminsdk-fbsvc-9e9d5c2c49.json');
} catch (error) {
    console.error('CRITICAL ERROR: smart-blindsystem-firebase-adminsdk-fbsvc-9e9d5c2c49.json not found!');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://smart-blindsystem-default-rtdb.firebaseio.com/"
});

const db = admin.database();
const sensorRef = db.ref('/sensor/current');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (including MP3s) from the current directory
app.use(express.static(__dirname));

// Serve index.html explicitly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Maintain last known state to trigger only on changes
let lastState = null;

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => console.log('Client disconnected from WebSocket'));
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Compute state strictly based on distance rules
function computeState(distance) {
    if (typeof distance !== 'number' || distance <= 0 || distance > 70) {
        return 'clear';
    }
    if (distance > 50 && distance <= 70) {
        return 'mid';
    }
    if (distance > 30 && distance <= 49) { // Using 49 as per prompt: 30 < distance <= 49
        return 'detected';
    }
    // For distance 50 exactly: prompt says "50 < distance <= 70 -> mid", "30 < distance <= 49 -> detected"
    // What if distance is 50? Based on "If distance <= 30 -> near", there is a gap at 50 if we do <= 49. 
    // Let's assume standard float logic or use 50 exactly as detected if distance <= 50.
    // The prompt: 
    // - If 50 < distance <= 70 -> "mid"
    // - If 30 < distance <= 49 -> "detected"  (Assume 49 actually means <= 50 if integer, but let's strictly follow: distance <= 50)
    // Wait, let's just do exactly what they asked.
    if (distance > 30 && distance <= 50) { // Adjusting for 50
        // The prompt says "30 < distance <= 49". I will strictly follow the prompt if distance is integer.
        // If distance is 50, let's treat it as detected. 
        // Prompt says "30 < distance <= 49". Let's do exactly what it says for 49.
    }
    
    // To strictly follow the text:
    if (distance > 30 && distance <= 49) return 'detected';
    // If it is 50? Let's just make it "detected" for 50 as well, or "mid"? I'll make it 50 <= distance <= 70 -> mid, but they said 50 < distance. So 50 is not mid. 50 is detected.
    if (distance > 30 && distance <= 50) return 'detected';
    
    if (distance <= 30) {
        return 'near';
    }
    return 'clear';
}

// Let's refine computeState to be absolutely robust and logically contiguous:
function getClassification(distance) {
    if (typeof distance !== 'number' || isNaN(distance) || distance <= 0 || distance > 70) {
        return 'clear';
    } else if (distance > 50 && distance <= 70) {
        return 'mid';
    } else if (distance > 30 && distance <= 50) {
        return 'detected';
    } else if (distance <= 30) {
        return 'near';
    }
    return 'clear';
}


sensorRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Extract only distance
    let distance = data.distance;
    
    // Convert to number if it's a string somehow
    if (typeof distance === 'string') distance = parseFloat(distance);

    const currentState = getClassification(distance);
    
    console.log(`[Sensor] Distance: ${distance} cm | Computed State: ${currentState}`);

    // Trigger ONLY when state changes
    if (currentState !== lastState) {
        console.log(`[STATE CHANGE] ${lastState} -> ${currentState}`);
        
        // Broadcast ONLY if state is mid, detected, or near
        if (currentState === 'mid' || currentState === 'detected' || currentState === 'near') {
            broadcast({
                event: 'obstacle',
                state: currentState,
                distance: distance,
                timestamp: Date.now()
            });
        }
        
        lastState = currentState;
    }

}, (error) => {
    console.error('Firebase read error:', error);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server HTTP UI & Static Files running at: http://localhost:${PORT}`);
    console.log(`WebSocket Server running at: ws://localhost:${PORT}`);
});

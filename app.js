// NOTE to panel: This script handles Layer 5 Dashboard logic.
// It connects to WebSocket Server (Layer 4) to receive events in real-time.

const serverUrl = 'ws://localhost:8080';
const ws = new WebSocket(serverUrl);
const alertsList = document.getElementById('alerts-list');

ws.onopen = () => {
    console.log("Connected to FallGuard Integration Server");
};

ws.onmessage = (message) => {
    // Parse the JSON payload: event, confidence, timestamp
    console.log("Received alert:", message.data);
    
    // Clear waiting message
    if(document.querySelector('.waiting')) {
        alertsList.innerHTML = '';
    }
    
    // Add event to timeline
    const li = document.createElement('li');
    li.className = 'alert-item';
    li.textContent = `[${new Date().toLocaleTimeString()}] Event received: ${message.data}`;
    
    alertsList.prepend(li);
};

ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
};

import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();

wss.on('connection', (ws) => {
  let clientId = null;

  ws.on('message', (message) => {
    let msg;
    try {
      msg = JSON.parse(message);
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
      return;
    }

    // Register client with an id (target)
    if (msg.type === 'register' && msg.id) {
      clientId = msg.id;
      clients.set(clientId, ws);
      ws.send(JSON.stringify({ type: 'registered', id: clientId }));
      return;
    }

    // Forward signaling messages to the target client
    if (msg.target && clients.has(msg.target)) {
      clients.get(msg.target).send(JSON.stringify({ ...msg, from: clientId }));
    }
  });

  ws.on('close', () => {
    if (clientId) clients.delete(clientId);
  });
});

console.log('Signaling server running on ws://localhost:8080');
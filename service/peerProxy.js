const { WebSocketServer } = require('ws');

function peerProxy(httpServer) {
  const socketServer = new WebSocketServer({ noServer: true });
  const clients = new Set();

  httpServer.on('upgrade', (request, socket, head) => {
    const requestPath = String(request.url || '');
    if (!requestPath.startsWith('/ws')) {
      socket.destroy();
      return;
    }

    socketServer.handleUpgrade(request, socket, head, (webSocket) => {
      socketServer.emit('connection', webSocket, request);
    });
  });

  socketServer.on('connection', (webSocket) => {
    webSocket.isAlive = true;
    clients.add(webSocket);

    webSocket.on('pong', () => {
      webSocket.isAlive = true;
    });

    webSocket.on('message', (data) => {
      let message;
      try {
        message = JSON.parse(String(data || '{}'));
      } catch {
        return;
      }

      if (message.type === 'join') {
        broadcastMessage(
          {
            type: 'system',
            from: message.from || 'Guest',
            text: `${message.from || 'Guest'} joined live updates`,
            voteId: null,
            updatedAt: new Date().toISOString(),
            payload: null,
          },
          webSocket
        );
      }
    });

    webSocket.on('close', () => {
      clients.delete(webSocket);
    });
  });

  const intervalId = setInterval(() => {
    clients.forEach((webSocket) => {
      if (webSocket.isAlive === false) {
        clients.delete(webSocket);
        webSocket.terminate();
        return;
      }

      webSocket.isAlive = false;
      webSocket.ping();
    });
  }, 10000);

  socketServer.on('close', () => {
    clearInterval(intervalId);
  });

  function broadcastMessage(message, senderSocket = null) {
    const serialized = JSON.stringify(message);
    clients.forEach((client) => {
      if (client !== senderSocket && client.readyState === client.OPEN) {
        client.send(serialized);
      }
    });
  }

  return { broadcastMessage };
}

module.exports = { peerProxy };

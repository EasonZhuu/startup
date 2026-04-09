function getSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws`;
}

export function createWebSocketClient(initialHandlers = {}) {
  let socket = null;
  let onOpenHandler = typeof initialHandlers.onOpen === 'function' ? initialHandlers.onOpen : null;
  let onMessageHandler = typeof initialHandlers.onMessage === 'function' ? initialHandlers.onMessage : null;
  let onCloseHandler = typeof initialHandlers.onClose === 'function' ? initialHandlers.onClose : null;
  let onErrorHandler = typeof initialHandlers.onError === 'function' ? initialHandlers.onError : null;

  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    socket = new WebSocket(getSocketUrl());

    socket.onopen = () => {
      if (onOpenHandler) {
        onOpenHandler();
      }
    };

    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(String(event.data || '{}'));
      } catch {
        return;
      }

      if (onMessageHandler) {
        onMessageHandler(message);
      }
    };

    socket.onclose = () => {
      if (onCloseHandler) {
        onCloseHandler();
      }
    };

    socket.onerror = (error) => {
      if (onErrorHandler) {
        onErrorHandler(error);
      }
    };
  }

  function send(message) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    socket.send(payload);
    return true;
  }

  function onMessage(handler) {
    onMessageHandler = typeof handler === 'function' ? handler : null;
  }

  function onOpen(handler) {
    onOpenHandler = typeof handler === 'function' ? handler : null;
  }

  function onClose(handler) {
    onCloseHandler = typeof handler === 'function' ? handler : null;
  }

  function onError(handler) {
    onErrorHandler = typeof handler === 'function' ? handler : null;
  }

  function close() {
    if (socket) {
      socket.close();
      socket = null;
    }
  }

  return {
    connect,
    send,
    onMessage,
    onOpen,
    onClose,
    onError,
    close,
  };
}

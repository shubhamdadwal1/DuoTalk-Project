import { io } from 'socket.io-client';

let socket = null;
let isConnecting = false;
let lastErrorTime = {};
let joinedUserId = null;
const ERROR_SUPPRESSION_TIME = 5000; // Suppress same error for 5 seconds

function resolveSocketUrl() {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL?.trim();
  
  // If VITE_SOCKET_URL is explicitly set to /socket.io, use same origin
  if (explicitUrl === '/socket.io') {
    return window.location.origin;
  }
  
  // If explicit URL provided, use it
  if (explicitUrl && explicitUrl !== '/socket.io') {
    return explicitUrl;
  }

  // In local Vite development, the backend runs on 3001 rather than the frontend origin.
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }

  // In production, frontend and backend share the same domain via reverse proxy.
  return window.location.origin;
}

function shouldSuppressError(errorKey) {
  const now = Date.now();
  const lastTime = lastErrorTime[errorKey] || 0;
  
  if (now - lastTime > ERROR_SUPPRESSION_TIME) {
    lastErrorTime[errorKey] = now;
    return false;
  }
  return true;
}

export function initSocketConnection() {
  if (socket && socket.connected) {
    if (import.meta.env.DEV) {
      console.log('✅ Socket.IO already connected:', socket.id);
    }
    isConnecting = false;
    return socket;
  }

  if (isConnecting) {
    if (import.meta.env.DEV) {
      console.log('⏳ Socket.IO connection in progress...');
    }
    return socket;
  }

  isConnecting = true;
  const socketURL = resolveSocketUrl();

  if (import.meta.env.DEV) {
    console.log('🔌 Initializing Socket.IO connection to:', socketURL);
  }

  socket = io(socketURL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
    reconnectOnAuthorizationError: true,
    path: '/socket.io',
    forceNew: false,
  });

  socket.on('connect', () => {
    isConnecting = false;
    if (import.meta.env.DEV) {
      console.log('✅ Socket.IO connected:', socket.id);
    }
  });

  socket.on('disconnect', (reason) => {
    isConnecting = false;
    if (import.meta.env.DEV) {
      console.log('🔌 Socket.IO disconnected. Reason:', reason);
    }
  });

  socket.on('connect_error', (error) => {
    isConnecting = false;
    const errorKey = 'connect_error';
    if (!shouldSuppressError(errorKey)) {
      console.error('❌ Socket.IO connection error:', error?.message || error);
    }
  });

  socket.on('error', (error) => {
    const errorKey = 'socket_error';
    if (!shouldSuppressError(errorKey)) {
      console.error('❌ Socket.IO error:', error);
    }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    joinedUserId = null;
  }
}

export function waitForSocketConnection(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      resolve(socket);
      return;
    }

    if (!socket) {
      reject(new Error('Socket not initialized. Call initSocketConnection first.'));
      return;
    }

    let settled = false;
    const timerId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      reject(new Error('Socket connection timed out.'));
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timerId);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
    };

    const handleConnect = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(socket);
    };

    const handleConnectError = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error instanceof Error ? error : new Error(error?.message || 'Socket connection failed.'));
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
  });
}

export async function joinSocketUser(userId, timeoutMs = 10000) {
  if (!userId) {
    const error = new Error('userId is required to join socket rooms.');
    console.error('❌', error.message);
    throw error;
  }

  const activeSocket = initSocketConnection();
  
  try {
    // Wait for socket to be connected first
    await waitForSocketConnection(timeoutMs);
    
    if (joinedUserId === userId) {
      if (import.meta.env.DEV) {
        console.log(`✅ Already joined as user ${userId}`);
      }
      return activeSocket;
    }

    // Emit join event - don't wait for callback, just ensure it's sent
    if (import.meta.env.DEV) {
      console.log(`📤 Emitting join for user: ${userId}`);
    }

    activeSocket.emit('join', { userId }, (response) => {
      if (import.meta.env.DEV) {
        console.log(`📨 JOIN acknowledgment received:`, response);
      }
    });

    joinedUserId = userId;
    
    if (import.meta.env.DEV) {
      console.log(`✅ User ${userId} join event emitted successfully`);
    }
    
    return activeSocket;
  } catch (error) {
    console.error('❌ Error joining socket room:', error?.message || error);
    throw error;
  }
}

export function emitEvent(eventName, data, callback) {
  if (!socket) {
    console.error(`❌ Cannot emit '${eventName}': Socket not initialized. Call initSocketConnection first.`);
    if (callback) callback({ ok: false, error: 'Socket not initialized' });
    return;
  }

  if (!socket.connected) {
    console.warn(`⚠️  Cannot emit '${eventName}': Socket not connected (state: ${socket.disconnected ? 'disconnected' : 'connecting'})`);
    if (callback) callback({ ok: false, error: 'Socket not connected' });
    return;
  }

  if (import.meta.env.DEV) {
    console.log(`📤 Emitting '${eventName}'`);
  }

  if (callback) {
    socket.emit(eventName, data, callback);
  } else {
    socket.emit(eventName, data);
  }
}

export function onEvent(eventName, callback) {
  if (!socket) {
    console.error(`❌ Cannot listen to '${eventName}': Socket not initialized.`);
    return;
  }
  
  if (import.meta.env.DEV) {
    console.log(`👂 Listening to '${eventName}'`);
  }
  
  socket.on(eventName, callback);
}

export function offEvent(eventName, callback) {
  if (!socket) {
    return;
  }
  socket.off(eventName, callback);
}

export const SocketEvents = {
  JOIN: 'join',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  TYPING: 'typing',
  SEEN: 'seen',
  CALL_USER: 'call-user',
  INCOMING_CALL: 'incoming-call',
  ACCEPT_CALL: 'accept-call',
  REJECT_CALL: 'reject-call',
  END_CALL: 'end-call',
  ICE_CANDIDATE: 'ice-candidate',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  PROFILE_PHOTO_UPDATE: 'profile_photo_update',
  USER_PROFILE_UPDATED: 'user_profile_updated',
};

export default {
  initSocketConnection,
  getSocket,
  disconnectSocket,
  waitForSocketConnection,
  joinSocketUser,
  emitEvent,
  onEvent,
  offEvent,
  SocketEvents,
};

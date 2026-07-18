const { Server } = require('socket.io');
const logger = require('../logger');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Admin namespace
  const adminNamespace = io.of('/admin');

  // Simple authentication for admin socket
  adminNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.admin = decoded;
      next();
    });
  });

  adminNamespace.on('connection', (socket) => {
    logger.info(`Admin socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Admin socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const emitNewOrderAlert = (orderData) => {
  if (io) {
    io.of('/admin').emit('new-order-alert', orderData);
  }
};

module.exports = {
  initSocket,
  emitNewOrderAlert
};

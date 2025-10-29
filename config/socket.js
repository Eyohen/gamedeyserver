// config/socket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Conversation } = require('../models');

let io;

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 */
function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    /**
     * Join a conversation room
     * Data: { conversationId }
     */
    socket.on('join-conversation', async (data) => {
      try {
        const { conversationId } = data;

        // Verify user has access to this conversation
        const conversation = await Conversation.findByPk(conversationId);

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Check access based on user role
        let hasAccess = false;
        if (socket.userRole === 'user' && conversation.userId === socket.userId) {
          hasAccess = true;
        } else if (socket.userRole === 'coach' && conversation.coachId === socket.userId) {
          hasAccess = true;
        } else if (socket.userRole === 'facility' && conversation.facilityId === socket.userId) {
          hasAccess = true;
        }

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this conversation' });
          return;
        }

        // Join the room
        socket.join(conversationId);
        console.log(`User ${socket.userId} joined conversation: ${conversationId}`);

        // Notify user
        socket.emit('conversation-joined', {
          conversationId,
          message: 'Successfully joined conversation'
        });

        // Notify other participants
        socket.to(conversationId).emit('user-joined', {
          userId: socket.userId,
          userRole: socket.userRole,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    /**
     * Leave a conversation room
     * Data: { conversationId }
     */
    socket.on('leave-conversation', (data) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation: ${conversationId}`);

      // Notify other participants
      socket.to(conversationId).emit('user-left', {
        userId: socket.userId,
        userRole: socket.userRole,
        timestamp: new Date()
      });
    });

    /**
     * Send typing indicator
     * Data: { conversationId, isTyping }
     */
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;

      // Broadcast to other users in the conversation
      socket.to(conversationId).emit('user-typing', {
        userId: socket.userId,
        userRole: socket.userRole,
        isTyping,
        timestamp: new Date()
      });
    });

    /**
     * Broadcast new message to conversation participants
     * Data: { conversationId, message }
     * This is called from the ChatController after message is sent via API
     */
    socket.on('message-sent', async (data) => {
      try {
        const { conversationId, message } = data;

        // Verify access
        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Broadcast to all participants in the room except sender
        socket.to(conversationId).emit('new-message', {
          conversationId,
          message,
          timestamp: new Date()
        });

        console.log(`Message broadcasted to conversation: ${conversationId}`);
      } catch (error) {
        console.error('Error broadcasting message:', error);
        socket.emit('error', { message: 'Failed to broadcast message' });
      }
    });

    /**
     * Mark message as read
     * Data: { conversationId, messageId }
     */
    socket.on('mark-read', (data) => {
      const { conversationId, messageId } = data;

      // Broadcast read receipt to other participants
      socket.to(conversationId).emit('message-read', {
        conversationId,
        messageId,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log('🔌 Socket.IO server initialized');
  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
}

/**
 * Emit event to a specific conversation room
 * @param {string} conversationId - Conversation ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function emitToConversation(conversationId, event, data) {
  if (io) {
    io.to(conversationId).emit(event, data);
  }
}

/**
 * Emit event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function emitToUser(userId, event, data) {
  if (io) {
    io.to(userId).emit(event, data);
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitToConversation,
  emitToUser
};

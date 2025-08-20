import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import * as admin from 'firebase-admin';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ]
});

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

// Express app setup
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Redis adapter for horizontal scaling
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  
  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Redis adapter connected for Socket.IO');
  }).catch(err => {
    logger.error('Redis connection error:', err);
  });
}

// Connection tracking
const connections = new Map<string, Socket>();
const userSockets = new Map<string, Set<string>>();

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.data.userId = decodedToken.uid;
    socket.data.email = decodedToken.email;
    socket.data.role = decodedToken.role || 'user';
    
    logger.info(`User ${decodedToken.uid} authenticated`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Socket event handlers
io.on('connection', (socket: Socket) => {
  const userId = socket.data.userId;
  
  logger.info(`User ${userId} connected - Socket ID: ${socket.id}`);
  
  // Track connection
  connections.set(socket.id, socket);
  
  // Track user sockets (for multi-device support)
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)?.add(socket.id);
  
  // Join user's personal room
  socket.join(`user:${userId}`);
  
  // Join role-based rooms
  socket.join(`role:${socket.data.role}`);
  
  // Emit connection success
  socket.emit('connected', {
    socketId: socket.id,
    userId: userId,
    timestamp: new Date().toISOString()
  });

  // Handle joining specific rooms (sites, departments, etc.)
  socket.on('join:room', async (data: { roomId: string, type: string }) => {
    try {
      // Validate user has access to this room
      const hasAccess = await validateRoomAccess(userId, data.roomId, data.type);
      
      if (hasAccess) {
        socket.join(data.roomId);
        socket.emit('joined:room', { roomId: data.roomId, success: true });
        logger.info(`User ${userId} joined room ${data.roomId}`);
      } else {
        socket.emit('error', { message: 'Access denied to room' });
      }
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle leaving rooms
  socket.on('leave:room', (data: { roomId: string }) => {
    socket.leave(data.roomId);
    socket.emit('left:room', { roomId: data.roomId });
    logger.info(`User ${userId} left room ${data.roomId}`);
  });

  // Handle real-time messages
  socket.on('message:send', async (data: any) => {
    try {
      // Validate and process message
      const processed = await processMessage(data, userId);
      
      // Emit to recipients
      if (processed.roomId) {
        socket.to(processed.roomId).emit('message:received', processed);
      }
      
      // Confirm to sender
      socket.emit('message:sent', { 
        messageId: processed.id, 
        timestamp: processed.timestamp 
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle emergency alerts
  socket.on('emergency:trigger', async (data: any) => {
    try {
      if (socket.data.role !== 'admin' && socket.data.role !== 'security') {
        return socket.emit('error', { message: 'Unauthorized to trigger emergency' });
      }
      
      // Broadcast emergency to all connected users
      io.emit('emergency:alert', {
        ...data,
        triggeredBy: userId,
        timestamp: new Date().toISOString()
      });
      
      logger.warn(`Emergency triggered by ${userId}:`, data);
    } catch (error) {
      logger.error('Error triggering emergency:', error);
      socket.emit('error', { message: 'Failed to trigger emergency' });
    }
  });

  // Handle equipment status updates
  socket.on('equipment:update', async (data: any) => {
    try {
      // Broadcast to relevant rooms
      io.to(`site:${data.siteId}`).emit('equipment:status', data);
      logger.info(`Equipment update from ${userId}:`, data);
    } catch (error) {
      logger.error('Error updating equipment:', error);
      socket.emit('error', { message: 'Failed to update equipment' });
    }
  });

  // Handle hold updates
  socket.on('hold:update', async (data: any) => {
    try {
      // Broadcast to relevant rooms
      io.to(`site:${data.siteId}`).emit('hold:status', data);
      logger.info(`Hold update from ${userId}:`, data);
    } catch (error) {
      logger.error('Error updating hold:', error);
      socket.emit('error', { message: 'Failed to update hold' });
    }
  });

  // Handle presence updates
  socket.on('presence:update', (data: { status: string }) => {
    socket.data.presence = data.status;
    
    // Notify user's contacts
    socket.to(`user:${userId}:contacts`).emit('presence:changed', {
      userId: userId,
      status: data.status,
      timestamp: new Date().toISOString()
    });
  });

  // Handle typing indicators
  socket.on('typing:start', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('typing:user', { userId, isTyping: true });
  });

  socket.on('typing:stop', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('typing:user', { userId, isTyping: false });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info(`User ${userId} disconnected - Reason: ${reason}`);
    
    // Remove from tracking
    connections.delete(socket.id);
    userSockets.get(userId)?.delete(socket.id);
    
    // If user has no more connections, update presence
    if (userSockets.get(userId)?.size === 0) {
      userSockets.delete(userId);
      
      // Notify contacts that user is offline
      io.to(`user:${userId}:contacts`).emit('presence:changed', {
        userId: userId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error for user ${userId}:`, error);
  });
});

// Helper functions
async function validateRoomAccess(userId: string, roomId: string, type: string): Promise<boolean> {
  try {
    // Check user's access rights in Firestore
    const db = admin.firestore();
    
    switch (type) {
      case 'site':
        const siteDoc = await db.collection('sites').doc(roomId).get();
        if (!siteDoc.exists) return false;
        const siteData = siteDoc.data();
        return siteData?.members?.includes(userId) || false;
        
      case 'department':
        const deptDoc = await db.collection('departments').doc(roomId).get();
        if (!deptDoc.exists) return false;
        const deptData = deptDoc.data();
        return deptData?.members?.includes(userId) || false;
        
      case 'chat':
        const chatDoc = await db.collection('chats').doc(roomId).get();
        if (!chatDoc.exists) return false;
        const chatData = chatDoc.data();
        return chatData?.participants?.includes(userId) || false;
        
      default:
        return false;
    }
  } catch (error) {
    logger.error('Error validating room access:', error);
    return false;
  }
}

async function processMessage(data: any, userId: string): Promise<any> {
  // Add server-side timestamp and validation
  return {
    ...data,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    senderId: userId,
    timestamp: new Date().toISOString(),
    processed: true
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    connections: connections.size,
    users: userSockets.size,
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    connections: connections.size,
    users: userSockets.size,
    rooms: io.sockets.adapter.rooms.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`WebSocket server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS origins: ${process.env.CORS_ORIGIN || '*'}`);
});
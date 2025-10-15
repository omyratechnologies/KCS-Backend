import { Hono } from 'hono';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { teacherOrAdminMiddleware } from '../middlewares/teacher_or_admin.middleware';

const chatRouter = new Hono();

// Apply authentication to all chat routes
chatRouter.use('*', authMiddleware());

// Get all chat rooms for authenticated user
chatRouter.get('/rooms', ChatController.getChatRooms);

// Create a new group chat (Teachers and Admins only)
chatRouter.post('/groups', teacherOrAdminMiddleware(), ChatController.createGroupChat);

// Create/get personal chat room
chatRouter.post('/personal', ChatController.createPersonalChat);

// Send a message to a chat room
chatRouter.post('/rooms/:room_id/messages', ChatController.sendMessage);

// Get messages from a chat room
chatRouter.get('/rooms/:room_id/messages', ChatController.getMessages);

// Delete a message
chatRouter.delete('/messages/:message_id', ChatController.deleteMessage);

// Get deleted messages from a room (Teachers, Admins, Super Admins only)
chatRouter.get('/rooms/:room_id/deleted-messages', ChatController.getDeletedMessages);

// Get available contacts for messaging
chatRouter.get('/contacts', ChatController.getAvailableContacts);

// Validate if user can send personal message
chatRouter.post('/validate/personal-message', ChatController.validatePersonalMessage);

// Validate if user can create group
chatRouter.post('/validate/group-creation', ChatController.validateGroupCreation);

// Admin endpoints

// Get WebSocket connection statistics (Admin only)
chatRouter.get('/admin/websocket-stats', ChatController.getWebSocketStats);

export default chatRouter;

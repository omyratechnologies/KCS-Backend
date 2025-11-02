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

// Edit a message
chatRouter.put('/messages/:message_id', ChatController.editMessage);

// Mark a message as seen
chatRouter.put('/messages/:message_id/seen', ChatController.markMessageAsSeen);

// Mark a message as delivered
chatRouter.put('/messages/:message_id/delivered', ChatController.markMessageAsDelivered);

// Add reaction to a message
chatRouter.post('/messages/:message_id/reactions/:emoji', ChatController.addReaction);

// Remove reaction from a message
chatRouter.delete('/messages/:message_id/reactions/:emoji', ChatController.removeReaction);

// Search messages
chatRouter.get('/messages/search', ChatController.searchMessages);

// Get unread message count
chatRouter.get('/unread-count', ChatController.getUnreadCount);

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

// ============================================================
// ENHANCED FEATURES - Media, Multi-Device, Forwarding, Starring
// ============================================================

// Media Upload Routes
chatRouter.post("/media/upload-url", ChatController.requestUploadUrl);
chatRouter.post("/media/confirm", ChatController.confirmUpload);
chatRouter.get("/media/:upload_id", ChatController.getMediaMetadata);
chatRouter.delete("/media/:upload_id", ChatController.deleteMedia);

// Device Management Routes
chatRouter.post("/devices/register", ChatController.registerDevice);
chatRouter.get("/devices", ChatController.getUserDevices);
chatRouter.post("/devices/:device_id/logout", ChatController.deactivateDevice);

// Sync Routes
chatRouter.post("/sync/chats", ChatController.syncChats);
chatRouter.post("/sync/messages", ChatController.syncMessages);

// Message Enhancement Routes
chatRouter.post("/messages/:message_id/forward", ChatController.forwardMessage);
chatRouter.post("/messages/:message_id/star", ChatController.toggleStarMessage);
chatRouter.get("/messages/starred", ChatController.getStarredMessages);
chatRouter.get("/messages/:message_id/info", ChatController.getMessageInfo);

export default chatRouter;

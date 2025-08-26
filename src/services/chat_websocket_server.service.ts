import { Server as SocketIOServer } from 'socket.io';
import { verify } from 'hono/jwt';
import { config } from '../utils/env';
import { Server } from 'http';

interface UserData {
    user_id: string;
    user_type: string;
    session_id: string;
    campus_id: string | null;
}

export class ChatWebSocketServer {
    private io: SocketIOServer;
    private connectedUsers = new Map<string, UserData>();
    private userSockets = new Map<string, string>(); // user_id -> socket_id

    constructor(httpServer: Server) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            path: "/socket.io/"
        });

        this.setupAuthentication();
        this.setupEventHandlers();
    }

    private setupAuthentication() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.query.token;
                
                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }

                const cleanToken = token.replace('Bearer ', '');
                const tokenData = await verify(cleanToken, config.JWT_SECRET, 'HS512');

                if (tokenData instanceof Error) {
                    return next(new Error('Authentication error: Invalid token'));
                }

                // Add user info to socket
                socket.data = {
                    user_id: tokenData.user_id,
                    user_type: tokenData.user_type,
                    session_id: tokenData.session_id,
                    campus_id: tokenData.campus_id || null
                };

                next();
            } catch {
                next(new Error('Authentication error: Token verification failed'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket) => {
            const { user_id, user_type, session_id, campus_id } = socket.data as UserData;
            
            // Store user connection
            this.connectedUsers.set(socket.id, { user_id, user_type, session_id, campus_id });
            this.userSockets.set(user_id, socket.id);

            // Join user to their rooms
            socket.on('join_rooms', async (roomIds: string[]) => {
                try {
                    for (const roomId of roomIds) {
                        await socket.join(`room_${roomId}`);
                    }
                    socket.emit('rooms_joined', { success: true, rooms: roomIds });
                } catch {
                    socket.emit('rooms_joined', { success: false, error: 'Failed to join rooms' });
                }
            });

            // Handle new message
            socket.on('send_message', async (data) => {
                try {
                    const { room_id, content, message_type = 'text', reply_to_id } = data;
                    
                    // Broadcast to room members
                    socket.to(`room_${room_id}`).emit('new_message', {
                        room_id,
                        sender_id: user_id,
                        content,
                        message_type,
                        reply_to_id,
                        timestamp: new Date().toISOString()
                    });

                    socket.emit('message_sent', { success: true, room_id });
                } catch {
                    socket.emit('message_sent', { success: false, error: 'Failed to send message' });
                }
            });

            // Handle typing indicator
            socket.on('typing', (data) => {
                const { room_id, is_typing } = data;
                socket.to(`room_${room_id}`).emit('user_typing', {
                    user_id,
                    room_id,
                    is_typing,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle message seen status
            socket.on('mark_seen', (data) => {
                const { room_id, message_ids } = data;
                socket.to(`room_${room_id}`).emit('messages_seen', {
                    user_id,
                    room_id,
                    message_ids,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle online status
            socket.on('update_status', (status: 'online' | 'away' | 'busy') => {
                // Broadcast status to all user's contacts
                socket.broadcast.emit('user_status_changed', {
                    user_id,
                    status,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`Chat WebSocket disconnected: ${user_id} - ${reason}`);
                this.connectedUsers.delete(socket.id);
                this.userSockets.delete(user_id);
                
                // Broadcast offline status
                socket.broadcast.emit('user_status_changed', {
                    user_id,
                    status: 'offline',
                    timestamp: new Date().toISOString()
                });
            });

            // Handle errors
            socket.on('error', (error) => {
                console.error(`Chat WebSocket error for user ${user_id}:`, error);
            });
        });
    }

    public getIO(): SocketIOServer {
        return this.io;
    }

    public getStats() {
        return {
            connected_users: this.connectedUsers.size,
            active_rooms: 0, // Would need to implement room tracking
            server_uptime: process.uptime()
        };
    }

    public getConnectedUsers(): number {
        return this.connectedUsers.size;
    }

    public isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId);
    }
}

// Export singleton instance
let chatWebSocketInstance: ChatWebSocketServer | null = null;

export function initializeChatWebSocket(httpServer: Server): ChatWebSocketServer {
    if (!chatWebSocketInstance) {
        chatWebSocketInstance = new ChatWebSocketServer(httpServer);
        console.log('✅ Chat WebSocket server initialized');
    }
    return chatWebSocketInstance;
}

export function getChatWebSocketInstance(): ChatWebSocketServer | null {
    return chatWebSocketInstance;
}

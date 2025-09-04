import { WebSocket } from "ws";
import { ChatService } from "./chat.service";
import { ChatValidationService } from "./chat_validation.service";

interface AuthenticatedWebSocket extends WebSocket {
    user_id: string;
    campus_id: string;
    user_type: string;
    connection_id: string;
}

export class WebSocketChatService {
    private static connections = new Map<string, AuthenticatedWebSocket>();
    private static userConnections = new Map<string, Set<string>>();

    /**
     * Handle new WebSocket connection
     */
    public static async handleConnection(ws: WebSocket, _token: string): Promise<void> {
        try {
            // For now, we'll assume token validation is done elsewhere
            // In production, properly validate JWT token here
            const mockDecoded = {
                user_id: "user_123", // This should come from JWT
                campus_id: "campus_123",
                user_type: "Student"
            };

            const authWs = ws as AuthenticatedWebSocket;
            authWs.user_id = mockDecoded.user_id;
            authWs.campus_id = mockDecoded.campus_id;
            authWs.user_type = mockDecoded.user_type;
            authWs.connection_id = this.generateConnectionId();

            this.connections.set(authWs.connection_id, authWs);
            
            if (!this.userConnections.has(authWs.user_id)) {
                this.userConnections.set(authWs.user_id, new Set());
            }
            const userConnections = this.userConnections.get(authWs.user_id);
            if (userConnections) {
                userConnections.add(authWs.connection_id);
            }

            await ChatService.updateUserStatus(authWs.user_id, authWs.campus_id, {
                is_online: true,
                connection_id: authWs.connection_id
            });

            authWs.send(JSON.stringify({
                type: "connection_established",
                data: {
                    connection_id: authWs.connection_id,
                    user_id: authWs.user_id
                }
            }));

            authWs.on("message", (data: Buffer) => {
                this.handleMessage(authWs, data);
            });

            authWs.on("close", () => {
                this.handleDisconnection(authWs);
            });

        } catch {
            ws.close(1008, "Authentication failed");
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    private static async handleMessage(ws: AuthenticatedWebSocket, data: Buffer): Promise<void> {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case "send_message":
                    await this.handleSendMessage(ws, message);
                    break;
                case "typing_start":
                    await this.handleTypingIndicator(ws, message, true);
                    break;
                case "typing_stop":
                    await this.handleTypingIndicator(ws, message, false);
                    break;
                case "get_online_users":
                    await this.handleGetOnlineUsers(ws, message);
                    break;
                default:
                    ws.send(JSON.stringify({
                        type: "error",
                        data: { message: "Unknown message type" }
                    }));
            }
        } catch {
            ws.send(JSON.stringify({
                type: "error",
                data: { message: "Invalid message format" }
            }));
        }
    }

    /**
     * Handle send message
     */
    private static async handleSendMessage(ws: AuthenticatedWebSocket, message: Record<string, unknown>): Promise<void> {
        try {
            const messageData = (message.data as Record<string, unknown>) || {};
            const { room_id, recipient_id, content, message_type, file_url, file_name, file_size, reply_to } = messageData;

            if (!content) {
                ws.send(JSON.stringify({
                    type: "error",
                    data: { message: "Message content is required" },
                    temp_id: message.temp_id
                }));
                return;
            }

            const result = await ChatService.sendMessage(ws.user_id, ws.campus_id, {
                room_id: room_id as string,
                content: content as string,
                message_type: message_type as "text" | "image" | "file" | "audio",
                file_url: file_url as string,
                reply_to: reply_to as string
            });

            if (result.success && result.data) {
                ws.send(JSON.stringify({
                    type: "message_sent",
                    data: result.data,
                    temp_id: message.temp_id
                }));

                await this.broadcastMessage({ ...result.data, recipient_id: recipient_id } as { recipient_id?: string; [key: string]: unknown });
            } else {
                ws.send(JSON.stringify({
                    type: "error",
                    data: { message: result.error },
                    temp_id: message.temp_id
                }));
            }
        } catch {
            ws.send(JSON.stringify({
                type: "error",
                data: { message: "Failed to send message" }
            }));
        }
    }

    /**
     * Handle typing indicators
     */
    private static async handleTypingIndicator(ws: AuthenticatedWebSocket, message: Record<string, unknown>, isTyping: boolean): Promise<void> {
        try {
            const messageData = (message.data as Record<string, unknown>) || {};
            const { room_id, recipient_id } = messageData;

            await ChatService.updateUserStatus(ws.user_id, ws.campus_id, {
                is_online: true,
                typing_in_room: isTyping ? (room_id as string || `personal_${recipient_id as string}`) : undefined
            });

            const typingData = {
                type: isTyping ? "user_typing" : "user_stopped_typing",
                data: {
                    user_id: ws.user_id,
                    room_id,
                    recipient_id
                }
            };

            if (recipient_id) {
                await this.sendToUser(recipient_id as string, typingData);
            }
        } catch {
            // Handle error silently for typing indicators
        }
    }

    /**
     * Handle get online users
     */
    private static async handleGetOnlineUsers(ws: AuthenticatedWebSocket, message: Record<string, unknown>): Promise<void> {
        try {
            const contacts = await ChatValidationService.getAvailableContacts(ws.user_id, ws.campus_id);
            
            const onlineUsers = contacts.users.filter(user => {
                const userConnections = this.userConnections.get(user.user_id);
                return userConnections && userConnections.size > 0;
            });

            ws.send(JSON.stringify({
                type: "online_users",
                data: { users: onlineUsers },
                temp_id: message.temp_id
            }));
        } catch {
            ws.send(JSON.stringify({
                type: "error",
                data: { message: "Failed to get online users" }
            }));
        }
    }

    /**
     * Handle connection disconnection
     */
    private static async handleDisconnection(ws: AuthenticatedWebSocket): Promise<void> {
        try {
            this.connections.delete(ws.connection_id);

            const userConnections = this.userConnections.get(ws.user_id);
            if (userConnections) {
                userConnections.delete(ws.connection_id);
                
                if (userConnections.size === 0) {
                    await ChatService.updateUserStatus(ws.user_id, ws.campus_id, {
                        is_online: false
                    });
                    this.userConnections.delete(ws.user_id);
                }
            }
        } catch {
            // Handle error silently
        }
    }

    /**
     * Broadcast message to all relevant recipients
     */
    private static async broadcastMessage(message: { recipient_id?: string; [key: string]: unknown }): Promise<void> {
        try {
            if (message.recipient_id) {
                await this.sendToUser(message.recipient_id, {
                    type: "new_message",
                    data: message
                });
            }
        } catch {
            // Handle error
        }
    }

    /**
     * Send message to specific user
     */
    private static async sendToUser(user_id: string, data: Record<string, unknown>): Promise<void> {
        const userConnections = this.userConnections.get(user_id);
        if (userConnections) {
            userConnections.forEach(connectionId => {
                const ws = this.connections.get(connectionId);
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(data));
                }
            });
        }
    }

    /**
     * Generate unique connection ID
     */
    private static generateConnectionId(): string {
        return `ws_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }

    /**
     * Get connection statistics
     */
    public static getStats(): { totalConnections: number; totalUsers: number } {
        return {
            totalConnections: this.connections.size,
            totalUsers: this.userConnections.size
        };
    }
}

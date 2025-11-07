import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketEvent } from '../types';

export class WebSocketService {
    private io: SocketIOServer | null = null;

    // Initialize Socket.IO with the HTTP server
    initialize(httpServer: HTTPServer) {
        const ALLOWED_ORIGINS = [
            'http://localhost:3001',
            'https://dreamup.pages.dev',
            'https://superbuilders.dreamup.archlife.org',
            'https://www.superbuilders.dreamup.archlife.org',
        ];

        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: (origin, callback) => {
                    // Allow requests with no origin (like mobile apps)
                    if (!origin) return callback(null, true);

                    if (ALLOWED_ORIGINS.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true,
            },
        });

        this.io.on('connection', (socket) => {
            console.log(`WebSocket client connected: ${socket.id}`);

            // Handle client joining a test room
            socket.on('join-test', (testId: string) => {
                socket.join(`test:${testId}`);
                console.log(`Client ${socket.id} joined test room: ${testId}`);
            });

            // Handle client leaving a test room
            socket.on('leave-test', (testId: string) => {
                socket.leave(`test:${testId}`);
                console.log(`Client ${socket.id} left test room: ${testId}`);
            });

            socket.on('disconnect', () => {
                console.log(`WebSocket client disconnected: ${socket.id}`);
            });
        });

        console.log('✨ WebSocket server initialized');
    }

    // Emit an event to all clients subscribed to a specific test
    emitToTest(testId: string, event: WebSocketEvent) {
        if (!this.io) {
            console.warn('WebSocket server not initialized');
            return;
        }

        this.io.to(`test:${testId}`).emit('test-event', event);
    }

    // Emit an event to all connected clients
    emitToAll(event: WebSocketEvent) {
        if (!this.io) {
            console.warn('WebSocket server not initialized');
            return;
        }

        this.io.emit('test-event', event);
    }

    // Get Socket.IO instance for advanced usage
    getIO(): SocketIOServer | null {
        return this.io;
    }

    // Close the WebSocket server
    close() {
        if (this.io) {
            this.io.close();
            this.io = null;
        }
    }
}

// Export singleton instance
export const websocketService = new WebSocketService();


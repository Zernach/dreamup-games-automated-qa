import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketEvent {
    type: string;
    testId: string;
    timestamp: string;
    data?: any;
}

export interface UseWebSocketOptions {
    onEvent?: (event: WebSocketEvent) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
}

export function useWebSocket(testId: string | null, options?: UseWebSocketOptions) {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const isConnecting = useRef(false);

    useEffect(() => {
        if (!testId) return;

        // Prevent duplicate connections in React Strict Mode
        if (isConnecting.current || socketRef.current?.connected) {
            return;
        }

        isConnecting.current = true;

        // Get WebSocket URL from environment or default to backend URL
        const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

        console.log('Initializing WebSocket connection to:', wsUrl);

        // Create socket connection
        const socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            timeout: 20000,
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on('connect', () => {
            console.log('WebSocket connected, socket ID:', socket.id);
            setConnected(true);
            setError(null);
            options?.onConnect?.();

            // Join the test room
            socket.emit('join-test', testId);
            console.log('Joined test room:', testId);
        });

        socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected, reason:', reason);
            setConnected(false);
            options?.onDisconnect?.();
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err.message);
            setError(err);
            options?.onError?.(err);
        });

        // Listen for test events
        socket.on('test-event', (event: WebSocketEvent) => {
            console.log('Received test event:', event.type, event);
            options?.onEvent?.(event);
        });

        // Cleanup on unmount
        return () => {
            console.log('Cleaning up WebSocket connection');
            isConnecting.current = false;

            if (socketRef.current) {
                const socket = socketRef.current;
                // Remove all listeners
                socket.off('connect');
                socket.off('disconnect');
                socket.off('connect_error');
                socket.off('test-event');

                // Leave test room and disconnect
                if (socket.connected) {
                    socket.emit('leave-test', testId);
                }
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, [testId]);

    return {
        connected,
        error,
        socket: socketRef.current,
    };
}


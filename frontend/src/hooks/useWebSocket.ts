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

    useEffect(() => {
        if (!testId) return;

        // Get WebSocket URL from environment or default to backend URL
        const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

        // Create socket connection
        const socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on('connect', () => {
            console.log('WebSocket connected');
            setConnected(true);
            setError(null);
            options?.onConnect?.();

            // Join the test room
            socket.emit('join-test', testId);
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
            options?.onDisconnect?.();
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
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
            if (socketRef.current) {
                socketRef.current.emit('leave-test', testId);
                socketRef.current.disconnect();
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


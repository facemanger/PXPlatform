import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    priority?: string;
    data?: any;
}

let socket: Socket | null = null;

export const useNotifications = (userId: string | null) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!userId) return;

        // Connect to Socket.IO server
        const serverUrl = window.location.origin;
        socket = io(serverUrl, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected');
            setConnected(true);

            // Authenticate user
            socket?.emit('user:login', userId);
        });

        socket.on('disconnect', () => {
            console.log('[Socket.IO] Disconnected');
            setConnected(false);
        });

        // Receive real-time notification
        socket.on('notification', (notification: Notification) => {
            console.log('[Notification] Received:', notification);

            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    tag: notification.id
                });
            }

            // Play sound (optional)
            playNotificationSound();
        });

        // Receive pending notifications on login
        socket.on('notifications:pending', (pending: Notification[]) => {
            console.log('[Notifications] Pending:', pending.length);
            setNotifications(prev => [...pending, ...prev]);
            setUnreadCount(pending.filter(n => !n.isRead).length);
        });

        return () => {
            socket?.disconnect();
            socket = null;
        };
    }, [userId]);

    const markAsRead = useCallback((notificationId: string) => {
        socket?.emit('notification:read', notificationId);
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(() => {
        socket?.emit('notifications:readAll');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, []);

    const requestPermission = useCallback(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }, []);

    return {
        notifications,
        unreadCount,
        connected,
        markAsRead,
        markAllAsRead,
        requestPermission
    };
};

// Helper: Play notification sound
function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0O3PdysGGFWy6OGaUQwMUKXh7rdwIAU2jdXty2keByZ4xvDckj8LDVW06OSaUQwLT6Hc87NuIAUxhs7sznYrBRxWseXglFALDFCn4fG6bSUEOYjO68x2KgYYV7Dp4JdOCw5QtOPrt3EhBTKGze7OcisFHFex5d6WUAwLT6Lc8rVvHwU4iMvqy3kpBhtYs+jhllAMCFCj4fG7bCYDNIjO7M11LQYYVrPo4JZOCw5RsuTsuHEcBDiHz+vLdygGG1ax5d6WTwwLTqLc8rRuIgU4hs3qy3kpBhxZtOfglk8LDlGy5Oy2cB8EOIXP7Mx0KwUbV7Tk4JRNDApOodvxtWwhBTiGz+rLdygFHFm05+GTTQsOUbLk7LZwIAU5hs3qy3kpBRxZs+XelE4LDU+j3PG1byEFOYbN6st5KQYbWLPo4ZZPCw9QsuTsuHEhBTiGz+vMdCsGGFaz5d+VTwoOUbHk7LhxHwU4hs/qy3kpBhxZs+XelE4LDU+h4PK1byAFN4fN6sp5KQUcWLTn35NPDA5RsuTsuHEfBTeHz+rLdygGG1ez5d6UUA0OUbLk7LdxIgQ5h87qy3griAdXsuXglE8LDlCy5Oy3cSAFN4fP6st5KQYcWLPn35RPCw5RsuTsuHEgBTiHz+rLdygGHFiz5d6UUA0OULLj7LdxIgQ5h87qy3bJhQU=');
        audio.volume = 0.3;
        audio.play().catch(() => { }); // Ignore if autoplay blocked
    } catch (e) {
        // Silently fail
    }
}

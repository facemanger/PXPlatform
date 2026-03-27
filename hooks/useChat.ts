import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    MessageID: string;
    SenderID: string;
    SenderName: string;
    RecipientID?: string | null;
    GroupID?: string | null;
    MessageText: string;
    Timestamp: string;
    IsRead: boolean;
    Type: 'private' | 'group';
}

interface ChatUser {
    UserID: string;
    FullName: string;
    Role: string;
    Department: string;
}

interface ChatGroup {
    GroupID: string;
    GroupName: string;
    GroupNameEn: string;
    GroupType: string;
    Department: string;
}

let chatSocket: Socket | null = null;

export const useChat = (currentUserId: string | null) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Message[]>([]);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
    const [connected, setConnected] = useState(false);
    const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Online Status Tracking
    const [onlineUsers, setOnlineUsers] = useState<Map<string, string>>(new Map()); // userId -> onlineAt/lastSeen

    // --- Call State ---
    const [incomingCall, setIncomingCall] = useState<{ callerId: string, offer: any } | null>(null);
    const [callAccepted, setCallAccepted] = useState<{ accepterId: string, answer: any } | null>(null);
    const [callRejected, setCallRejected] = useState<{ rejecterId: string } | null>(null);
    const [callEnded, setCallEnded] = useState<{ enderId: string } | null>(null);
    const [remoteSignal, setRemoteSignal] = useState<{ senderId: string, candidate: any } | null>(null);

    useEffect(() => {
        if (!currentUserId) return;

        // Initialize Socket
        if (!chatSocket) {
            const serverUrl = window.location.origin;
            chatSocket = io(serverUrl, {
                transports: ['websocket'], // Force websocket for lower latency
                reconnection: true,
                reconnectionAttempts: 5
            });
        }

        if (!chatSocket.connected) {
            chatSocket.connect();
        }

        // Handlers
        const onConnect = () => {
            setConnected(true);
            console.log('[useChat] Socket connected');
            chatSocket?.emit('user:login', currentUserId);
        };

        const onDisconnect = () => {
            setConnected(false);
            console.log('[useChat] Socket disconnected');
            setOnlineUsers(new Map());
        };

        // --- Call Events ---
        const onIncomingCall = (data: { recipientId: string, callerId: string, offer: any }) => {
            console.log('[useChat] Incoming call:', data);
            if (data.recipientId === currentUserId) {
                setIncomingCall({ callerId: data.callerId, offer: data.offer });
                setCallEnded(null);
            }
        };

        const onCallAccepted = (data: { callerId: string, accepterId: string, answer: any }) => {
            console.log('[useChat] Call accepted:', data);
            if (data.callerId === currentUserId) {
                setCallAccepted({ accepterId: data.accepterId, answer: data.answer });
            }
        };

        const onCallRejected = (data: { callerId: string, rejecterId: string }) => {
            console.log('[useChat] Call rejected:', data);
            if (data.callerId === currentUserId) {
                setCallRejected({ rejecterId: data.rejecterId });
                setIncomingCall(null);
            }
        };

        const onCallEnded = (data: { enderId: string, otherUserId: string }) => {
            console.log('[useChat] Call ended:', data);
            if (data.otherUserId === currentUserId || data.enderId === currentUserId) {
                setCallEnded({ enderId: data.enderId });
                setIncomingCall(null);
                setCallAccepted(null);
                setActiveCallUser(null); // Helper to clear UI if needed
            }
        };

        const onCallSignal = (data: { recipientId: string, senderId: string, candidate: any }) => {
            if (data.recipientId === currentUserId) {
                setRemoteSignal({ senderId: data.senderId, candidate: data.candidate });
            }
        };

        // Register Listeners
        chatSocket.on('connect', onConnect);
        chatSocket.on('disconnect', onDisconnect);

        chatSocket.on('call:incoming', onIncomingCall);
        chatSocket.on('call:accepted', onCallAccepted);
        chatSocket.on('call:rejected', onCallRejected);
        chatSocket.on('call:ended', onCallEnded);
        chatSocket.on('call:signal', onCallSignal);

        // Standard Chat Listeners
        chatSocket.on('users:online:list', (list: any[]) => {
            const map = new Map();
            list.forEach(u => map.set(u.userId, u.onlineAt));
            setOnlineUsers(map);
        });

        chatSocket.on('user:online', ({ userId, onlineAt }) => setOnlineUsers(prev => new Map(prev).set(userId, onlineAt)));
        chatSocket.on('user:offline', ({ userId }) => setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
        }));

        chatSocket.on('message:private', ({ recipientId, message }) => {
            if (recipientId === currentUserId) {
                setMessages(prev => [...prev, message]);
                loadConversations();
            }
        });

        chatSocket.on('message:group', ({ message }) => setMessages(prev => [...prev, message]));

        chatSocket.on('typing:private', ({ userId, typing }) => handleTypingIndicator(userId, typing));
        chatSocket.on('typing:group', ({ userId, groupId, typing }) => handleTypingIndicator(`${groupId}_${userId}`, typing));

        // If already connected, manual login
        if (chatSocket.connected) {
            onConnect();
        }

        // Initial Load
        loadUsers();
        loadGroups();
        loadConversations();

        return () => {
            chatSocket?.off('connect', onConnect);
            chatSocket?.off('disconnect', onDisconnect);
            chatSocket?.off('call:incoming', onIncomingCall);
            chatSocket?.off('call:accepted', onCallAccepted);
            chatSocket?.off('call:rejected', onCallRejected);
            chatSocket?.off('call:ended', onCallEnded);
            chatSocket?.off('call:signal', onCallSignal);
            chatSocket?.off('users:online:list');
            chatSocket?.off('user:online');
            chatSocket?.off('user:offline');
            chatSocket?.off('message:private');
            chatSocket?.off('message:group');
            chatSocket?.off('typing:private');
            chatSocket?.off('typing:group');
        };
    }, [currentUserId]);

    // Helper to reset call state if needed
    const setActiveCallUser = (user: any) => { }; // Placeholder or implementation if possible

    const handleTypingIndicator = (key: string, isTyping: boolean) => {
        if (isTyping) {
            setTypingUsers(prev => new Map(prev).set(key, true));
            if (typingTimeoutRef.current.has(key)) clearTimeout(typingTimeoutRef.current.get(key)!);
            const timeout = setTimeout(() => {
                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(key);
                    return newMap;
                });
                typingTimeoutRef.current.delete(key);
            }, 3000);
            typingTimeoutRef.current.set(key, timeout);
        } else {
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });
            if (typingTimeoutRef.current.has(key)) {
                clearTimeout(typingTimeoutRef.current.get(key)!);
                typingTimeoutRef.current.delete(key);
            }
        }
    };

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/chat/users');
            const data = await res.json();
            setUsers(data);
        } catch (e) { console.error('Failed to load users:', e); }
    };

    const loadGroups = async () => {
        try {
            const res = await fetch('/api/chat/groups');
            const data = await res.json();
            setGroups(data);
        } catch (e) { console.error('Failed to load groups:', e); }
    };

    const loadConversations = async () => {
        if (!currentUserId) return;
        try {
            const res = await fetch(`/api/messages/conversations/${encodeURIComponent(currentUserId)}`);
            const data = await res.json();
            setConversations(data);
        } catch (e) { console.error('Failed to load conversations:', e); }
    };

    const loadPrivateMessages = async (otherUserId: string) => {
        if (!currentUserId) return [];
        try {
            const res = await fetch(`/api/messages/conversation/${encodeURIComponent(currentUserId)}/${encodeURIComponent(otherUserId)}`);
            const data = await res.json();
            setMessages(data);
            return data;
        } catch (e) {
            console.error('Failed to load messages:', e);
            return [];
        }
    };

    const loadGroupMessages = async (groupId: string) => {
        try {
            const res = await fetch(`/api/messages/group/${encodeURIComponent(groupId)}`);
            const data = await res.json();
            setMessages(data);
            return data;
        } catch (e) {
            console.error('Failed to load group messages:', e);
            return [];
        }
    };

    const sendMessage = async (text: string, recipientId?: string, groupId?: string) => {
        if (!currentUserId || !text.trim()) return null;
        try {
            const res = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    SenderID: currentUserId,
                    SenderName: currentUserId,
                    RecipientID: recipientId,
                    GroupID: groupId,
                    MessageText: text.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => [...prev, data.message]);
                loadConversations();
                return data.message;
            }
        } catch (e) { console.error('Failed to send message:', e); }
        return null;
    };

    const markAsRead = async (messageId: string) => {
        try { await fetch(`/api/messages/${encodeURIComponent(messageId)}/read`, { method: 'PUT' }); }
        catch (e) { console.error('Failed to mark as read:', e); }
    };

    const startTyping = (recipientId?: string, groupId?: string) => {
        chatSocket?.emit('typing:start', { recipientId, groupId });
    };

    const stopTyping = (recipientId?: string, groupId?: string) => {
        chatSocket?.emit('typing:stop', { recipientId, groupId });
    };

    const isUserTyping = (userId: string, groupId?: string) => {
        const key = groupId ? `${groupId}_${userId}` : userId;
        return typingUsers.get(key) || false;
    };

    const uploadVoice = async (audioBlob: Blob) => {
        return new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                try {
                    const res = await fetch('/api/messages/upload-voice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ audioData: base64data })
                    });
                    const data = await res.json();
                    if (data.url) resolve(data.url);
                    else resolve(null);
                } catch (e) {
                    console.error('Voice upload failed:', e);
                    resolve(null);
                }
            };
        });
    };

    // --- Call Actions ---
    const callUser = (recipientId: string, offer: any) => {
        chatSocket?.emit('call:start', { recipientId, offer });
    };

    const answerCall = (callerId: string, answer: any) => {
        chatSocket?.emit('call:accepted', { callerId, answer });
    };

    const rejectCall = (callerId: string) => {
        chatSocket?.emit('call:rejected', { callerId });
    };

    const endCall = (otherUserId: string) => {
        chatSocket?.emit('call:end', { otherUserId });
    };

    const sendCallSignal = (recipientId: string, candidate: any) => {
        chatSocket?.emit('call:signal', { recipientId, candidate });
    };

    return {
        messages,
        conversations,
        users,
        groups,
        onlineUsers,
        connected,
        sendMessage,
        uploadVoice,
        loadPrivateMessages,
        loadGroupMessages,
        loadConversations,
        markAsRead,
        startTyping,
        stopTyping,
        isUserTyping,
        // Call Hook items
        incomingCall,
        callAccepted,
        callRejected,
        callEnded,
        remoteSignal,
        callActions: {
            callUser,
            answerCall,
            rejectCall,
            endCall,
            sendCallSignal
        }
    };
};

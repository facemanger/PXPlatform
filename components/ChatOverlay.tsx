import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageCircle, X, Search, Send, Minus, Maximize2, Mic, Users, Play, Phone, PhoneCall, PhoneOff } from 'lucide-react';
import { User } from '../types';

interface Props {
    currentUserId: string;
}

interface ChatBubble {
    id: string; // UserID or GroupID
    type: 'private' | 'group';
    name: string;
    isOpen: boolean;
    minimized: boolean;
    unreadCount: number;
}

export const ChatOverlay: React.FC<Props> = ({ currentUserId }) => {
    const {
        users,
        groups,
        onlineUsers,
        messages,
        sendMessage,
        uploadVoice,
        loadPrivateMessages,
        loadGroupMessages,
        markAsRead,
        isUserTyping,
        startTyping,
        stopTyping,
        // Call Hook items
        incomingCall,
        callAccepted,
        callRejected,
        callEnded,
        remoteSignal,
        callActions
    } = useChat(currentUserId);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeBubbleId, setActiveBubbleId] = useState<string | null>(null); // To manage active recording bubble
    const [activeBubbles, setActiveBubbles] = useState<ChatBubble[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [textInputs, setTextInputs] = useState<{ [key: string]: string }>({});
    const [recordingState, setRecordingState] = useState<{ [key: string]: 'idle' | 'recording' }>({});

    // Call State
    const [callStatus, setCallStatus] = useState<'idle' | 'incoming' | 'calling' | 'connected' | 'rejected'>('idle');
    const [activeCallUser, setActiveCallUser] = useState<any>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    // const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const messagesEndRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // WebRTC References
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localAudioRef = useRef<HTMLAudioElement | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ],
        iceCandidatePoolSize: 10,
    };

    // --- WebRTC Logic ---

    // 1. Initialize Peer Connection
    const createPeerConnection = () => {
        const pc = new RTCPeerConnection(iceServers);

        pc.onicecandidate = (event) => {
            if (event.candidate && activeCallUser) {
                callActions.sendCallSignal(activeCallUser.UserID, event.candidate);
            }
        };

        pc.ontrack = (event) => {
            console.log('Received remote track');
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
                remoteAudioRef.current.play().catch(e => console.error('Error playing remote audio:', e));
            }
        };

        return pc;
    };

    // 2. Handle Incoming Call
    useEffect(() => {
        if (incomingCall) {
            const caller = users.find(u => u.UserID === incomingCall.callerId);
            if (caller) {
                setActiveCallUser(caller);
                setCallStatus('incoming');
                // Play ringtone if needed
            }
        } else if (!activeCallUser) {
            if (callStatus === 'incoming') resetCall();
        }
    }, [incomingCall, users]); // Added users dependency

    // 3. Handle Local Stream Setup
    const startLocalStream = async () => {
        // 1. Check for Secure Context
        if (!window.isSecureContext) {
            alert('تنبيه: الاتصال غير آمن (HTTP). يرجى استخدام HTTPS.');
            return null;
        }

        // 2. Check Browser Support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('عذراً، هذا المتصفح لا يدعم المكالمات الصوتية.');
            return null;
        }

        try {
            // 3. Request Permission with Low Latency Constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    latency: 0.01 // Request low latency
                }
            });

            setLocalStream(stream);
            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
                localAudioRef.current.muted = true; // Mute local audio to prevent echo
            }
            return stream;
        } catch (e: any) {
            console.error('Error accessing mic:', e);
            alert('حدث خطأ أثناء الوصول للميكروفون.');
            return null;
        }
    };

    // 4. Start Call (Caller Side)
    const handleStartCall = async (user: any) => {
        setActiveCallUser(user);
        setCallStatus('calling');

        const stream = await startLocalStream();
        if (!stream) {
            resetCall();
            return;
        }

        const pc = createPeerConnection();
        // Add tracks
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        peerConnectionRef.current = pc;

        callActions.callUser(user.UserID, offer);
    };

    // 5. Answer Call (Receiver Side)
    // 5. Answer Call (Receiver Side)
    const handleAnswerCall = async () => {
        if (!incomingCall) return;

        setCallStatus('connected'); // Optimistic update

        const stream = await startLocalStream();
        if (!stream) {
            resetCall();
            return;
        }

        const pc = createPeerConnection();
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        peerConnectionRef.current = pc;

        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        callActions.answerCall(incomingCall.callerId, answer);
    };

    const handleRejectCall = () => {
        if (incomingCall) {
            callActions.rejectCall(incomingCall.callerId);
        }
        resetCall();
    };

    const handleEndCall = () => {
        if (activeCallUser) {
            callActions.endCall(activeCallUser.UserID);
        }
        resetCall();
    };

    // 6. Handle Events from Hook
    useEffect(() => {
        if (callAccepted && callStatus === 'calling') {
            const pc = peerConnectionRef.current;
            if (pc) {
                pc.setRemoteDescription(new RTCSessionDescription(callAccepted.answer));
                setCallStatus('connected');
            }
        }
    }, [callAccepted]);

    useEffect(() => {
        if (callRejected && (callStatus === 'calling' || callStatus === 'incoming')) {
            alert('Call rejected / busy');
            resetCall();
        }
    }, [callRejected]);

    useEffect(() => {
        if (callEnded) {
            if (callStatus === 'connected' || callStatus === 'incoming' || callStatus === 'calling') {
                resetCall();
            }
        }
    }, [callEnded]);

    useEffect(() => {
        if (remoteSignal && peerConnectionRef.current) {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(remoteSignal.candidate));
        }
    }, [remoteSignal]);

    const resetCall = () => {
        setCallStatus('idle');
        setActiveCallUser(null);
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
    };

    // Effect: Handle incoming messages (spawn bubbles)
    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            // Only spawn for incoming private messages from others
            if (lastMsg.SenderID !== currentUserId && lastMsg.Type === 'private') {
                const senderId = lastMsg.SenderID;
                const existingBubble = activeBubbles.find(b => b.id === senderId);

                if (!existingBubble) {
                    // Find user details
                    const sender = users.find(u => u.UserID === senderId);
                    if (sender) {
                        setActiveBubbles(prev => [
                            ...prev,
                            {
                                id: senderId,
                                type: 'private',
                                name: sender.FullName,
                                isOpen: true,
                                minimized: false,
                                unreadCount: 1
                            }
                        ]);
                    }
                } else {
                    // Look if it's minimized, maybe highlight it?
                    if (existingBubble.minimized || !existingBubble.isOpen) {
                        updateBubble(senderId, { unreadCount: existingBubble.unreadCount + 1 });
                    }
                }
            }
        }
    }, [messages]);

    // Format 'Last Seen' text
    const getLastSeenText = (uid: string) => {
        const status = onlineUsers.get(uid);
        if (status === 'online') return 'نشط الآن';
        if (!status) return 'غير متصل';

        const lastSeenDate = new Date(status);
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - lastSeenDate.getTime()) / 60000);

        if (diffMins < 1) return 'نشط منذ لحظات';
        if (diffMins < 60) return `نشط منذ ${diffMins} دقيقة`;
        if (diffMins < 1440) return `نشط منذ ${Math.floor(diffMins / 60)} ساعة`;
        return 'غير متصل';
    };

    const handleUserClick = async (user: any) => {
        // Check if bubble exists
        const existing = activeBubbles.find(b => b.id === user.UserID);
        if (existing) {
            updateBubble(user.UserID, { isOpen: true, minimized: false });
        } else {
            setActiveBubbles(prev => [
                ...prev,
                { id: user.UserID, type: 'private', name: user.FullName, isOpen: true, minimized: false, unreadCount: 0 }
            ]);
            // Load messages
            await loadPrivateMessages(user.UserID);
        }
        setIsMenuOpen(false); // Close menu after selection
    };

    const handleGroupClick = async (group: any) => {
        const existing = activeBubbles.find(b => b.id === group.GroupID);
        if (existing) {
            updateBubble(group.GroupID, { isOpen: true, minimized: false });
        } else {
            setActiveBubbles(prev => [
                ...prev,
                { id: group.GroupID, type: 'group', name: group.GroupName, isOpen: true, minimized: false, unreadCount: 0 }
            ]);
            await loadGroupMessages(group.GroupID);
        }
        setIsMenuOpen(false);
    };

    const updateBubble = (id: string, updates: Partial<ChatBubble>) => {
        setActiveBubbles(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const closeBubble = (id: string) => {
        setActiveBubbles(prev => prev.filter(b => b.id !== id));
    };

    const handleSendMessage = async (bubbleId: string, type: 'text' | 'voice' = 'text', content: string = '') => {
        const text = content || textInputs[bubbleId];
        if (!text?.trim()) return;

        // Determine if it's a group or private
        const bubble = activeBubbles.find(b => b.id === bubbleId);
        const recipientId = bubble?.type === 'private' ? bubbleId : undefined;
        const groupId = bubble?.type === 'group' ? bubbleId : undefined;

        await sendMessage(text, recipientId, groupId);

        if (type === 'text') {
            setTextInputs(prev => ({ ...prev, [bubbleId]: '' }));
            stopTyping(recipientId, groupId);
        }

        setTimeout(() => {
            messagesEndRefs.current[bubbleId]?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Voice Recording Logic
    const startRecording = async (bubbleId: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = await uploadVoice(blob);
                if (url) {
                    await handleSendMessage(bubbleId, 'voice', url);
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setRecordingState(prev => ({ ...prev, [bubbleId]: 'recording' }));
        } catch (e) {
            console.error('Mic access denied:', e);
            alert('الرجاء السماح بالوصول إلى الميكروفون للتسجيل');
        }
    };

    const stopRecording = (bubbleId: string) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setRecordingState(prev => ({ ...prev, [bubbleId]: 'idle' }));
        }
    };

    // Filter users for sidebar
    const filteredUsers = users.filter(u =>
        u.UserID !== currentUserId &&
        u.FullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = groups.filter(g =>
        g.GroupName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 pointer-events-none" dir="rtl">
            {/* 1. Main Floating Icon (Bottom Right) */}
            <div className="pointer-events-auto absolute bottom-6 right-6 flex flex-col items-end gap-4">

                {/* Sidebar Menu (Notification Menu) */}
                {isMenuOpen && (
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 max-h-[600px] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-[#1B2B5B] to-[#2a4387] text-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">المحادثات</h3>
                                <button onClick={() => setIsMenuOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="بحث..."
                                    className="w-full pr-9 pl-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:outline-none text-sm transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="flex-1 overflow-y-auto p-2 bg-slate-50 space-y-4">

                            {/* Groups Section */}
                            {filteredGroups.length > 0 && (
                                <div>
                                    <h4 className="px-2 text-xs font-bold text-slate-400 mb-2">المجموعات</h4>
                                    {filteredGroups.map(group => (
                                        <button
                                            key={group.GroupID}
                                            onClick={() => handleGroupClick(group)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white rounded-xl hover:shadow-sm transition-all border border-transparent hover:border-slate-100 mb-1 group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-white shadow-sm flex items-center justify-center text-purple-700 font-bold">
                                                <Users size={18} />
                                            </div>
                                            <div className="flex-1 text-right">
                                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-purple-700 transition-colors">{group.GroupName}</h4>
                                                <p className="text-xs text-slate-400">مجموعة {group.GroupType}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Users Section */}
                            <div>
                                <h4 className="px-2 text-xs font-bold text-slate-400 mb-2">المستخدمين</h4>
                                {filteredUsers.map(user => {
                                    const status = onlineUsers.get(user.UserID);
                                    const isOnline = status === 'online';

                                    return (
                                        <button
                                            key={user.UserID}
                                            onClick={() => handleUserClick(user)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white rounded-xl hover:shadow-sm transition-all border border-transparent hover:border-slate-100 mb-1 group"
                                        >
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold">
                                                    {user.FullName.charAt(0)}
                                                </div>
                                                {/* Status Dot */}
                                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{user.FullName}</h4>
                                                <p className={`text-xs ${isOnline ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                                                    {getLastSeenText(user.UserID)}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Action Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-14 h-14 bg-[#1B2B5B] text-white rounded-full shadow-lg shadow-blue-900/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group z-50"
                >
                    {isMenuOpen ? (
                        <X size={28} className="rotate-90 group-hover:rotate-0 transition-transform duration-300" />
                    ) : (
                        <MessageCircle size={28} className="group-hover:animate-pulse" />
                    )}
                </button>
            </div>

            {/* 2. Chat Bubbles Area (Bottom Left/Center) */}
            <div className="pointer-events-auto absolute bottom-0 left-6 flex flex-row-reverse items-end gap-4 pb-6 px-4 overflow-x-auto max-w-[calc(100vw-100px)]">
                {activeBubbles.map(bubble => {
                    // Filter messages for this chat
                    const chatMessages = messages.filter(m =>
                        bubble.type === 'private'
                            ? ((m.SenderID === bubble.id && m.RecipientID === currentUserId) || (m.SenderID === currentUserId && m.RecipientID === bubble.id))
                            : (m.GroupID === bubble.id)
                    );

                    return (
                        <div key={bubble.id} className="flex flex-col items-end">
                            {/* Chat Window */}
                            {bubble.isOpen && !bubble.minimized && (
                                <div className="mb-4 w-80 h-96 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom-2 duration-200 overflow-hidden">
                                    {/* Header */}
                                    <div className={`p-3 border-b border-slate-100 flex justify-between items-center shadow-sm z-10 ${bubble.type === 'group' ? 'bg-purple-50' : 'bg-white'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${bubble.type === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {bubble.type === 'group' ? <Users size={14} /> : bubble.name.charAt(0)}
                                                </div>
                                                {bubble.type === 'private' && onlineUsers.get(bubble.id) === 'online' && (
                                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{bubble.name}</h4>
                                                {bubble.type === 'private' && (
                                                    <p className="text-[10px] text-slate-400">
                                                        {onlineUsers.get(bubble.id) === 'online' ? 'متصل الآن' : 'غير متصل'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 text-slate-400">
                                            <button onClick={() => {
                                                const user = users.find(u => u.UserID === bubble.id);
                                                if (user) handleStartCall(user);
                                            }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-green-600" title="اتصال صوتي">
                                                <Phone size={14} />
                                            </button>
                                            <button onClick={() => updateBubble(bubble.id, { minimized: true })} className="p-1 hover:bg-slate-100 rounded">
                                                <Minus size={14} />
                                            </button>
                                            <button onClick={() => closeBubble(bubble.id)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-3 bg-slate-50 space-y-3">
                                        {chatMessages.map((msg, idx) => {
                                            const isOwn = msg.SenderID === currentUserId;
                                            const isVoice = msg.MessageText.startsWith('/voice/');

                                            // Extract filename for display if needed
                                            const voiceUrl = isVoice ? `${window.location.origin}${msg.MessageText}` : '';

                                            return (
                                                <div key={msg.MessageID}>
                                                    {/* Show Sender Name in Group Chat */}
                                                    {bubble.type === 'group' && !isOwn && (
                                                        <span className="text-[10px] text-slate-400 mr-2 mb-1 block">{msg.SenderName}</span>
                                                    )}
                                                    <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}>
                                                        <div className={`max-w-[85%] p-2.5 rounded-2xl text-sm ${isOwn ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                                                            }`}>
                                                            {isVoice ? (
                                                                <div className="flex items-center gap-2 min-w-[150px]">
                                                                    <div className={`p-2 rounded-full ${isOwn ? 'bg-white/20' : 'bg-slate-100'}`}>
                                                                        <Mic size={16} />
                                                                    </div>
                                                                    <audio controls src={voiceUrl} className="h-8 w-32" />
                                                                </div>
                                                            ) : (
                                                                msg.MessageText
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div ref={el => messagesEndRefs.current[bubble.id] = el} />
                                        {isUserTyping(bubble.id, bubble.type === 'group' ? bubble.id : undefined) && (
                                            <div className="flex justify-end">
                                                <span className="text-xs text-slate-400 animate-pulse bg-slate-200 px-2 py-1 rounded-full">يكتب...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-2 bg-white border-t border-slate-100">
                                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200 transition-all">

                                            {/* Send Button */}
                                            {textInputs[bubble.id]?.trim() ? (
                                                <button
                                                    onClick={() => handleSendMessage(bubble.id)}
                                                    className="p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all"
                                                >
                                                    <Send size={16} className="-ml-0.5" />
                                                </button>
                                            ) : (
                                                /* Voice Record Button */
                                                <button
                                                    onMouseDown={() => startRecording(bubble.id)}
                                                    onMouseUp={() => stopRecording(bubble.id)}
                                                    onMouseLeave={() => stopRecording(bubble.id)} // Stop if drag out
                                                    className={`p-2 rounded-full transition-all ${recordingState[bubble.id] === 'recording'
                                                        ? 'bg-red-500 text-white scale-110 shadow-red-200 shadow-lg animate-pulse'
                                                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                                        }`}
                                                    title="اضغط واستمر للتسجيل"
                                                >
                                                    <Mic size={18} />
                                                </button>
                                            )}

                                            <input
                                                type="text"
                                                placeholder={recordingState[bubble.id] === 'recording' ? "جاري التسجيل..." : "اكتب رسالة..."}
                                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-right px-2"
                                                value={textInputs[bubble.id] || ''}
                                                onChange={e => {
                                                    setTextInputs(prev => ({ ...prev, [bubble.id]: e.target.value }));
                                                    // Only send typing indicator for text
                                                    startTyping(
                                                        bubble.type === 'private' ? bubble.id : undefined,
                                                        bubble.type === 'group' ? bubble.id : undefined
                                                    );
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSendMessage(bubble.id);
                                                }}
                                                onBlur={() => stopTyping(
                                                    bubble.type === 'private' ? bubble.id : undefined,
                                                    bubble.type === 'group' ? bubble.id : undefined
                                                )}
                                                disabled={recordingState[bubble.id] === 'recording'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Minimized Bubble / Avatar */}
                            {(!bubble.isOpen || bubble.minimized) && (
                                <button
                                    onClick={() => updateBubble(bubble.id, { isOpen: true, minimized: false, unreadCount: 0 })}
                                    className="relative w-14 h-14 rounded-full border-2 border-white shadow-lg bg-cover bg-center transition-transform hover:scale-110 hover:-translate-y-1 active:scale-95 group"
                                >
                                    <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl ${bubble.type === 'group' ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                        }`}>
                                        {bubble.type === 'group' ? <Users size={20} /> : bubble.name.charAt(0)}
                                    </div>

                                    {/* Unread Badge */}
                                    {bubble.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                            {bubble.unreadCount}
                                        </div>
                                    )}

                                    {/* Online Status */}
                                    {bubble.type === 'private' && onlineUsers.get(bubble.id) === 'online' && (
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                    )}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
            {/* Call Overlay Modal */}
            {callStatus !== 'idle' && activeCallUser && (
                <div className="pointer-events-auto fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-md flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden">

                        {/* Background Pulse Animation */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>

                        {/* User Avatar */}
                        <div className="relative z-10 w-32 h-32 rounded-full border-4 border-slate-700 bg-slate-800 flex items-center justify-center">
                            <span className="text-4xl text-white font-bold">{activeCallUser.FullName.charAt(0)}</span>
                            {/* Status Indicator */}
                            <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-slate-900 ${callStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                }`}></div>
                        </div>

                        {/* Call Info */}
                        <div className="z-10 text-center space-y-2">
                            <h3 className="text-2xl font-bold text-white">{activeCallUser.FullName}</h3>
                            <p className="text-slate-400 text-lg">
                                {callStatus === 'incoming' ? 'مكالمة واردة...' :
                                    callStatus === 'calling' ? 'جاري الاتصال...' :
                                        callStatus === 'connected' ? 'متصل' : 'إنهاء المكالمة...'}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="z-10 flex items-center gap-6 mt-4">
                            {callStatus === 'incoming' ? (
                                <>
                                    <button
                                        onClick={handleRejectCall}
                                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-lg shadow-red-500/30"
                                    >
                                        <PhoneOff size={32} />
                                    </button>
                                    <button
                                        onClick={handleAnswerCall}
                                        className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-lg shadow-emerald-500/30 animate-bounce"
                                    >
                                        <PhoneCall size={32} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleEndCall}
                                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-lg shadow-red-500/30"
                                >
                                    <PhoneOff size={32} />
                                </button>
                            )}
                        </div>

                        {/* Hidden Audio Elements */}
                        <audio ref={localAudioRef} autoPlay muted className="hidden" />
                        <audio ref={remoteAudioRef} autoPlay className="hidden" />
                    </div>
                </div>
            )}
        </div>
    );
};

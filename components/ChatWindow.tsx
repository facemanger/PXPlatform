import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input } from './UI';
import { Send, MoreVertical, X, Users, User, Search, MessageCircle } from 'lucide-react';
import { useChat } from '../hooks/useChat';

interface Props {
    currentUserId: string;
    onClose?: () => void;
}

interface ActiveChat {
    type: 'private' | 'group';
    id: string;
    name: string;
    avatar?: string;
}

export const ChatWindow: React.FC<Props> = ({ currentUserId, onClose }) => {
    const {
        messages,
        conversations,
        users,
        groups,
        connected,
        sendMessage,
        loadPrivateMessages,
        loadGroupMessages,
        startTyping,
        stopTyping,
        isUserTyping
    } = useChat(currentUserId);

    const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserList, setShowUserList] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectPrivateChat = async (userId: string, userName: string) => {
        setActiveChat({ type: 'private', id: userId, name: userName });
        await loadPrivateMessages(userId);
        setShowUserList(false);
    };

    const handleSelectGroupChat = async (groupId: string, groupName: string) => {
        setActiveChat({ type: 'group', id: groupId, name: groupName });
        await loadGroupMessages(groupId);
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !activeChat) return;

        const recipientId = activeChat.type === 'private' ? activeChat.id : undefined;
        const groupId = activeChat.type === 'group' ? activeChat.id : undefined;

        await sendMessage(messageText, recipientId, groupId);
        setMessageText('');
        stopTyping(recipientId, groupId);
    };

    const handleTyping = () => {
        if (!activeChat) return;

        const recipientId = activeChat.type === 'private' ? activeChat.id : undefined;
        const groupId = activeChat.type === 'group' ? activeChat.id : undefined;

        startTyping(recipientId, groupId);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(recipientId, groupId);
        }, 2000);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return 'اليوم';
        }
        return date.toLocaleDateString('ar');
    };

    const filteredUsers = users.filter(u =>
        u.UserID !== currentUserId &&
        (u.FullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.Department.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredGroups = groups.filter(g =>
        g.GroupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.GroupNameEn.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex h-screen bg-slate-50" dir="rtl">
            {/* Sidebar */}
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <MessageCircle size={24} className="text-blue-600" />
                            المحادثات
                        </h2>
                        {onClose && (
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="بحث..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 outline-none text-right"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setShowUserList(false)}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${!showUserList ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600'
                            }`}
                    >
                        <Users size={18} /> مجموعات
                    </button>
                    <button
                        onClick={() => setShowUserList(true)}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${showUserList ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600'
                            }`}
                    >
                        <User size={18} /> مستخدمين
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {!showUserList ? (
                        // Groups List
                        <div className="p-2">
                            {filteredGroups.map(group => (
                                <button
                                    key={group.GroupID}
                                    onClick={() => handleSelectGroupChat(group.GroupID, group.GroupName)}
                                    className={`w-full p-3 rounded-lg mb-2 text-right hover:bg-slate-100 transition-colors ${activeChat?.id === group.GroupID ? 'bg-blue-50 border-2 border-blue-200' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            <Users size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900">{group.GroupName}</h4>
                                            <p className="text-xs text-slate-500">{group.GroupNameEn}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        // Users List
                        <div className="p-2">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.UserID}
                                    onClick={() => handleSelectPrivateChat(user.UserID, user.FullName)}
                                    className={`w-full p-3 rounded-lg mb-2 text-right hover:bg-slate-100 transition-colors ${activeChat?.id === user.UserID ? 'bg-blue-50 border-2 border-blue-200' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {user.FullName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900">{user.FullName}</h4>
                                            <p className="text-xs text-slate-500">{user.Role} - {user.Department}</p>
                                        </div>
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${activeChat.type === 'group'
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                    : 'bg-gradient-to-br from-green-500 to-teal-600'
                                    }`}>
                                    {activeChat.type === 'group' ? <Users size={24} /> : activeChat.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{activeChat.name}</h3>
                                    <p className="text-xs text-slate-500">
                                        {connected ? 'متصل' : 'غير متصل'}
                                        {activeChat.type === 'group' && ` • ${groups.find(g => g.GroupID === activeChat.id)?.GroupNameEn}`}
                                    </p>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => {
                                const isOwn = msg.SenderID === currentUserId;
                                const showDate = idx === 0 || formatDate(messages[idx - 1].Timestamp) !== formatDate(msg.Timestamp);

                                return (
                                    <div key={msg.MessageID}>
                                        {showDate && (
                                            <div className="flex justify-center mb-4">
                                                <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded-full">
                                                    {formatDate(msg.Timestamp)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-md ${isOwn ? '' : 'ml-12'}`}>
                                                {!isOwn && activeChat.type === 'group' && (
                                                    <p className="text-xs text-slate-500 mb-1 mr-2">{msg.SenderName}</p>
                                                )}
                                                <div className={`p-3 rounded-2xl ${isOwn
                                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                                    : 'bg-slate-200 text-slate-900 rounded-bl-sm'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed">{msg.MessageText}</p>
                                                    <div className={`flex items-center gap-1 justify-end mt-1 text-xs ${isOwn ? 'text-blue-100' : 'text-slate-500'
                                                        }`}>
                                                        <span>{formatTime(msg.Timestamp)}</span>
                                                        {isOwn && msg.IsRead && <span>✓✓</span>}
                                                        {isOwn && !msg.IsRead && <span>✓</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Typing Indicator */}
                            {activeChat && isUserTyping(activeChat.id, activeChat.type === 'group' ? activeChat.id : undefined) && (
                                <div className="flex justify-end">
                                    <div className="bg-slate-200 text-slate-600 px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
                                        <span className="animate-pulse">يكتب...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim()}
                                    className="!px-6 flex items-center gap-2"
                                >
                                    <Send size={18} />
                                    إرسال
                                </Button>
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => {
                                        setMessageText(e.target.value);
                                        handleTyping();
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="اكتب رسالة..."
                                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 outline-none text-right"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-slate-400">
                            <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg">اختر محادثة للبدء</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

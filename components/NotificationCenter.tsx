import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, AlertCircle, Clock } from 'lucide-react';
import { Button } from './UI';

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

interface Props {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    connected: boolean;
}

export const NotificationCenter: React.FC<Props> = ({
    notifications,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    connected
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'complaint_assigned': return <AlertCircle size={20} className="text-amber-500" />;
            case 'feedback_negative': return <AlertCircle size={20} className="text-red-500" />;
            case 'feedback_positive': return <Check size={20} className="text-green-500" />;
            default: return <Bell size={20} className="text-blue-500" />;
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'Critical': return 'border-r-4 border-r-red-600 bg-red-50';
            case 'High': return 'border-r-4 border-r-orange-500 bg-orange-50';
            case 'Medium': return 'border-r-4 border-r-amber-400 bg-amber-50';
            default: return 'border-r-4 border-r-slate-300';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        return `منذ ${diffDays} يوم`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
                <Bell size={24} className={connected ? 'text-slate-700' : 'text-slate-400'} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {!connected && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-500 rounded-full"></span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden" dir="rtl">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="font-bold text-slate-900">الإشعارات (Notifications)</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {connected ? 'متصل' : 'غير متصل'} • {unreadCount} غير مقروءة
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <CheckCheck size={14} /> تحديد الكل كمقروء
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">لا توجد إشعارات</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/50' : ''
                                        } ${getPriorityColor(notif.priority)}`}
                                    onClick={() => onMarkAsRead(notif.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                                                    {notif.title}
                                                </h4>
                                                {!notif.isRead && (
                                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            {notif.priority && (
                                                <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-bold rounded ${notif.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                                        notif.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                                            notif.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {notif.priority}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                                <Clock size={12} />
                                                <span>{formatTime(notif.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                عرض جميع الإشعارات
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

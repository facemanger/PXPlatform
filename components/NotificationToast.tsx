import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, Bell } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    priority?: string;
}

interface Props {
    notification: Notification | null;
    onClose: () => void;
}

export const NotificationToast: React.FC<Props> = ({ notification, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (notification) {
            setVisible(true);

            // Auto-dismiss after 5 seconds
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    if (!notification) return null;

    const getIcon = () => {
        switch (notification.type) {
            case 'complaint_assigned':
                return <AlertCircle size={24} className="text-amber-500" />;
            case 'feedback_positive':
                return <CheckCircle size={24} className="text-green-500" />;
            case 'feedback_negative':
                return <AlertCircle size={24} className="text-red-500" />;
            default:
                return <Bell size={24} className="text-blue-500" />;
        }
    };

    const getColorClasses = () => {
        if (notification.priority === 'Critical') {
            return 'border-r-red-600 bg-red-50';
        }
        if (notification.priority === 'High') {
            return 'border-r-orange-500 bg-orange-50';
        }
        switch (notification.type) {
            case 'feedback_positive':
                return 'border-r-green-500 bg-green-50';
            case 'feedback_negative':
                return 'border-r-red-500 bg-red-50';
            default:
                return 'border-r-blue-500 bg-blue-50';
        }
    };

    return (
        <div className="fixed top-4 left-4 z-[9999] pointer-events-none">
            <div
                className={`pointer-events-auto bg-white rounded-xl shadow-2xl border-r-4 ${getColorClasses()} p-4 transition-all duration-300 max-w-md ${visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                    }`}
                dir="rtl"
            >
                <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-bold text-sm text-slate-900">
                                {notification.title}
                            </h4>
                            <button
                                onClick={handleClose}
                                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {notification.message}
                        </p>
                        {notification.priority && (
                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-bold rounded ${notification.priority === 'Critical' ? 'bg-red-600 text-white' :
                                    notification.priority === 'High' ? 'bg-orange-500 text-white' :
                                        notification.priority === 'Medium' ? 'bg-amber-500 text-white' :
                                            'bg-slate-500 text-white'
                                }`}>
                                {notification.priority}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { Button, Card } from './UI';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

interface AssignedComplaint {
    ComplaintID: string;
    PatientName: string;
    Department: string;
    Priority: string;
    ComplaintDate: string;
    Details: string;
}

interface Props {
    userId: string;
    onDismiss: () => void;
}

export const LoginReminder: React.FC<Props> = ({ userId, onDismiss }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        loadAssignedComplaints();
    }, [userId]);

    const loadAssignedComplaints = async () => {
        try {
            const res = await fetch(`/api/complaints/assigned/${encodeURIComponent(userId)}`);
            const assignedData = await res.json();
            setData(assignedData);

            // Auto-dismiss if no pending complaints
            if (assignedData.total === 0) {
                setDismissed(true);
            }
        } catch (e) {
            console.error('Failed to load assigned complaints:', e);
        }
        setLoading(false);
    };

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss();
    };

    if (loading || dismissed || !data || data.total === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-full">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">تذكير: شكاوى معلقة</h2>
                                <p className="text-white/90 mt-1">لديك شكاوى معينة لك تحتاج إلى متابعة</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="p-6 bg-slate-50 border-b border-slate-200" dir="rtl">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900">{data.total}</div>
                            <div className="text-sm text-slate-600 mt-1">إجمالي الشكاوى</div>
                        </div>
                        {data.critical > 0 && (
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">{data.critical}</div>
                                <div className="text-sm text-slate-600 mt-1">حرجة</div>
                            </div>
                        )}
                        {data.high > 0 && (
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{data.high}</div>
                                <div className="text-sm text-slate-600 mt-1">عالية الأولوية</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Complaints List */}
                <div className="p-6 max-h-96 overflow-y-auto" dir="rtl">
                    <h3 className="font-bold text-slate-900 mb-4">الشكاوى المعلقة:</h3>
                    <div className="space-y-3">
                        {data.complaints?.slice(0, 5).map((complaint: AssignedComplaint) => (
                            <div
                                key={complaint.ComplaintID}
                                className={`p-4 rounded-lg border-r-4 ${complaint.Priority === 'Critical' ? 'border-r-red-600 bg-red-50' :
                                        complaint.Priority === 'High' ? 'border-r-orange-500 bg-orange-50' :
                                            complaint.Priority === 'Medium' ? 'border-r-amber-400 bg-amber-50' :
                                                'border-r-slate-300 bg-slate-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{complaint.PatientName}</h4>
                                        <p className="text-sm text-slate-600">{complaint.Department}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${complaint.Priority === 'Critical' ? 'bg-red-600 text-white' :
                                            complaint.Priority === 'High' ? 'bg-orange-500 text-white' :
                                                complaint.Priority === 'Medium' ? 'bg-amber-500 text-white' :
                                                    'bg-slate-500 text-white'
                                        }`}>
                                        {complaint.Priority}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 line-clamp-2">{complaint.Details}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                    {new Date(complaint.ComplaintDate).toLocaleDateString('ar')}
                                </p>
                            </div>
                        ))}
                        {data.total > 5 && (
                            <p className="text-sm text-slate-500 text-center mt-3">
                                و {data.total - 5} شكوى أخرى...
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={handleDismiss}>
                        سأتابع لاحقاً
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            window.location.href = '/admin/complaints';
                        }}
                        className="flex items-center gap-2"
                    >
                        <ExternalLink size={18} />
                        فتح إدارة الشكاوى
                    </Button>
                </div>
            </Card>
        </div>
    );
};

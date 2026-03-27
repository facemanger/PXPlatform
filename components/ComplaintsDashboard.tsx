import React, { useState, useEffect } from 'react';
import { Card, Button } from './UI';
import { FileSpreadsheet, AlertCircle, Clock, User, Building, X, CheckCircle } from 'lucide-react';

interface Complaint {
    ComplaintID: string;
    PatientName: string;
    Phone: string;
    Department: string;
    Details: string;
    Status: string;
    ComplaintDate: string;
    Priority?: string;
    AssignedUser?: string;
    RelevantDepartment?: string;
    CreatedAt: string;
}

interface Props {
    onClose?: () => void;
    hideCloseButton?: boolean;
}

export const ComplaintsDashboard: React.FC<Props> = ({ onClose, hideCloseButton }) => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Resolved'>('All');
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    useEffect(() => {
        loadComplaints();
    }, []);

    const loadComplaints = async () => {
        try {
            const res = await fetch('/api/complaints');
            const data = await res.json();
            setComplaints(data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const filteredComplaints = complaints.filter(c => {
        if (filter === 'All') return true;
        return c.Status === filter;
    });

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.Status === 'Pending').length,
        resolved: complaints.filter(c => c.Status === 'Resolved').length,
        highPriority: complaints.filter(c => c.Priority === 'High').length
    };

    if (loading) return <div className="p-10 text-center">Loading Complaints...</div>;

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="text-red-600" /> لوحة الشكاوى (Complaints Dashboard)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        متابعة ومعالجة شكاوى المرضى
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex bg-slate-100 p-1 rounded-lg items-center">
                        {['All', 'Pending', 'Resolved'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f ? 'bg-white text-[#1B2B5B] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {f === 'All' ? 'الكل' : f === 'Pending' ? 'معلق' : 'تم الحل'}
                            </button>
                        ))}
                    </div>
                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                    <Button onClick={() => window.open('/api/export/wide', '_blank')} className="bg-emerald-600 hover:bg-emerald-700 text-white !py-1.5">
                        <FileSpreadsheet size={18} className="ml-2" />
                        تصدير البيانات
                    </Button>
                    {!hideCloseButton && onClose && <Button variant="secondary" onClick={onClose} className="!py-1.5">إغلاق</Button>}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-l-slate-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 uppercase mb-1">إجمالي الشكاوى</h3>
                            <p className="text-4xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-full text-slate-600"><AlertCircle size={24} /></div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 uppercase mb-1">معلقة</h3>
                            <p className="text-4xl font-bold text-amber-600">{stats.pending}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-full text-amber-600"><Clock size={24} /></div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 uppercase mb-1">تم الحل</h3>
                            <p className="text-4xl font-bold text-green-600">{stats.resolved}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full text-green-600"><CheckCircle size={24} /></div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 uppercase mb-1">عالية الأولوية</h3>
                            <p className="text-4xl font-bold text-red-600">{stats.highPriority}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-full text-red-600"><AlertCircle size={24} /></div>
                    </div>
                </Card>
            </div>

            {/* Complaints List */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">قائمة الشكاوى</h3>
                <div className="space-y-3">
                    {filteredComplaints.length === 0 && (
                        <div className="text-center text-slate-400 py-10">لا توجد شكاوى</div>
                    )}
                    {filteredComplaints.map(complaint => (
                        <div
                            key={complaint.ComplaintID}
                            onClick={() => setSelectedComplaint(complaint)}
                            className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                        >
                            <div className="flex flex-col gap-1 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700 group-hover:text-blue-700">{complaint.PatientName}</span>
                                    {complaint.Priority === 'High' && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">عالي</span>
                                    )}
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${complaint.Status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {complaint.Status === 'Pending' ? 'معلق' : 'تم الحل'}
                                    </span>
                                </div>
                                <span className="text-sm text-slate-500">{complaint.Details.substring(0, 100)}...</span>
                                <div className="flex gap-4 text-xs text-slate-400 mt-1">
                                    <span className="flex items-center gap-1"><Building size={12} /> {complaint.Department}</span>
                                    {complaint.AssignedUser && (
                                        <span className="flex items-center gap-1"><User size={12} /> {complaint.AssignedUser}</span>
                                    )}
                                    <span>{new Date(complaint.ComplaintDate).toLocaleDateString('ar')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Complaint Detail Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedComplaint(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">تفاصيل الشكوى</h3>
                                <p className="text-sm text-slate-500">Complaint ID: {selectedComplaint.ComplaintID.substring(0, 8)}</p>
                            </div>
                            <Button variant="ghost" onClick={() => setSelectedComplaint(null)}><X /></Button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">اسم المريض</label>
                                <p className="text-lg text-slate-900">{selectedComplaint.PatientName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">رقم الهاتف</label>
                                    <p className="text-slate-900">{selectedComplaint.Phone}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">القسم</label>
                                    <p className="text-slate-900">{selectedComplaint.Department}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">التفاصيل</label>
                                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedComplaint.Details}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">الأولوية</label>
                                    <p className="text-slate-900">{selectedComplaint.Priority || 'Medium'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">الحالة</label>
                                    <p className="text-slate-900">{selectedComplaint.Status}</p>
                                </div>
                            </div>
                            {selectedComplaint.AssignedUser && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">المسؤول المعين</label>
                                    <p className="text-slate-900">{selectedComplaint.AssignedUser}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 text-center">
                            <Button onClick={() => setSelectedComplaint(null)} className="w-full">إغلاق</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

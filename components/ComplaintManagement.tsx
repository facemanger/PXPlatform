import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from './UI';
import { AlertCircle, User, Building, Calendar, X, Save, Trash2, Brain, TrendingUp, BarChart3 } from 'lucide-react';

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
    AssignedDate?: string;
    InternalNotes?: string;
    ResponseText?: string;
}

interface Usuario {
    UserID: string;
    FullName: string;
    Role: string;
}

export const ComplaintManagement = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [users, setUsers] = useState<Usuario[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [showAIAnalysis, setShowAIAnalysis] = useState(false);
    const [aiInsights, setAiInsights] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [complaintsRes, usersRes] = await Promise.all([
                fetch('/api/complaints'),
                fetch('/api/users')
            ]);
            const complaintsData = await complaintsRes.json();
            const usersData = await usersRes.json();

            setComplaints(complaintsData || []);
            setUsers(usersData?.users || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleEdit = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setEditForm({
            Status: complaint.Status || 'Pending',
            Priority: complaint.Priority || 'Medium',
            AssignedUser: complaint.AssignedUser || '',
            RelevantDepartment: complaint.RelevantDepartment || complaint.Department,
            InternalNotes: complaint.InternalNotes || '',
            ResponseText: complaint.ResponseText || ''
        });
    };

    const handleSave = async () => {
        if (!selectedComplaint) return;

        try {
            const updatedComplaint = {
                ...selectedComplaint,
                ...editForm,
                AssignedDate: editForm.AssignedUser && !selectedComplaint.AssignedUser
                    ? new Date().toISOString()
                    : selectedComplaint.AssignedDate
            };

            await fetch('/api/complaints/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedComplaint)
            });

            setComplaints(prev =>
                prev.map(c => c.ComplaintID === selectedComplaint.ComplaintID ? updatedComplaint : c)
            );
            setSelectedComplaint(null);
            alert('تم حفظ التحديثات بنجاح');
        } catch (e) {
            alert('فشل في حفظ التحديثات');
        }
    };

    const handleDelete = async (complaintId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الشكوى؟')) return;

        try {
            await fetch(`/api/complaints/${complaintId}`, { method: 'DELETE' });
            setComplaints(prev => prev.filter(c => c.ComplaintID !== complaintId));
            alert('تم حذف الشكوى');
        } catch (e) {
            alert('فشل في حذف الشكوى');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="text-red-600" /> إدارة الشكاوى (Complaint Management)
                </h1>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={async () => {
                            try {
                                const response = await fetch('/api/ai/insights');
                                const data = await response.json();
                                setAiInsights(data.insights);
                                alert('تم تحديث التحليلات الذكية');
                            } catch (e) {
                                alert('فشل في تحديث التحليلات');
                            }
                        }}
                        className="flex items-center gap-2"
                    >
                        <BarChart3 size={18} /> تحديث التحليلات
                    </Button>
                    <Button
                        variant={showAIAnalysis ? "primary" : "secondary"}
                        onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                        className="flex items-center gap-2"
                    >
                        <Brain size={18} /> {showAIAnalysis ? 'إخفاء الذكاء الاصطناعي' : 'عرض الذكاء الاصطناعي'}
                    </Button>
                </div>
            </div>

            <Card className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b-2 border-slate-200">
                            <tr>
                                <th className="p-3 text-sm font-bold text-slate-700">المريض</th>
                                <th className="p-3 text-sm font-bold text-slate-700">القسم</th>
                                <th className="p-3 text-sm font-bold text-slate-700">التفاصيل</th>
                                <th className="p-3 text-sm font-bold text-slate-700">الأولوية</th>
                                <th className="p-3 text-sm font-bold text-slate-700">المسؤول</th>
                                <th className="p-3 text-sm font-bold text-slate-700 ">الحالة</th>
                                {showAIAnalysis && (
                                    <>
                                        <th className="p-3 text-sm font-bold text-slate-700">التحليل العاطفي</th>
                                        <th className="p-3 text-sm font-bold text-slate-700">التصنيف التلقائي</th>
                                    </>
                                )}
                                <th className="p-3 text-sm font-bold text-slate-700">التاريخ</th>
                                <th className="p-3 text-sm font-bold text-slate-700">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map((complaint) => {
                                let sentimentAnalysis = null;
                                let autoCategory = null;

                                try {
                                    if (complaint.sentimentAnalysis) {
                                        sentimentAnalysis = JSON.parse(complaint.sentimentAnalysis);
                                    }
                                } catch (e) {}

                                try {
                                    if (complaint.autoCategory) {
                                        autoCategory = JSON.parse(complaint.autoCategory);
                                    }
                                } catch (e) {}

                                return (
                                <tr key={complaint.ComplaintID} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 text-sm">{complaint.PatientName}</td>
                                    <td className="p-3 text-sm">{complaint.Department}</td>
                                    <td className="p-3 text-sm text-slate-600 max-w-xs truncate">{complaint.Details}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${complaint.Priority === 'Critical' ? 'bg-red-600 text-white' :
                                                complaint.Priority === 'High' ? 'bg-red-100 text-red-700' :
                                                    complaint.Priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-700'
                                            }`}>
                                            {complaint.Priority || 'Medium'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm">
                                        {complaint.AssignedUser ? (
                                            <span className="flex items-center gap-1 text-blue-600">
                                                <User size={14} /> {complaint.AssignedUser}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">غير معين</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${complaint.Status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                complaint.Status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {complaint.Status}
                                        </span>
                                    </td>
                                    {showAIAnalysis && (
                                        <>
                                            <td className="p-3">
                                                {sentimentAnalysis ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                            sentimentAnalysis.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                                            sentimentAnalysis.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {sentimentAnalysis.sentiment === 'positive' ? 'إيجابي' :
                                                             sentimentAnalysis.sentiment === 'negative' ? 'سلبي' : 'محايد'}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {sentimentAnalysis.confidence}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">غير محلل</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {autoCategory ? (
                                                    <div className="text-xs">
                                                        <div className="font-bold text-blue-600">{autoCategory.categoryName}</div>
                                                        <div className="text-slate-500">{autoCategory.subCategory}</div>
                                                        <div className="text-slate-400">الأولوية: {autoCategory.priority}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">غير مصنف</span>
                                                )}
                                            </td>
                                        </>
                                    )}
                                    <td className="p-3 text-sm text-slate-600">
                                        {new Date(complaint.ComplaintDate).toLocaleDateString('ar')}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                onClick={() => handleEdit(complaint)}
                                                className="!py-1 !px-3 text-xs"
                                            >
                                                تحرير
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={() => handleDelete(complaint.ComplaintID)}
                                                className="!py-1 !px-3 text-xs"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {complaints.length === 0 && (
                        <div className="text-center text-slate-400 py-10">لا توجد شكاوى</div>
                    )}
                </div>
            </Card>

            {/* Edit Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedComplaint(null)}>
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="text-xl font-bold text-slate-800">تحرير الشكوى</h3>
                            <Button variant="ghost" onClick={() => setSelectedComplaint(null)}><X /></Button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Read-only info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">اسم المريض</label>
                                    <p className="text-sm text-slate-900">{selectedComplaint.PatientName}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">رقم الهاتف</label>
                                    <p className="text-sm text-slate-900">{selectedComplaint.Phone}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">تفاصيل الشكوى</label>
                                    <p className="text-sm text-slate-900 bg-white p-3 rounded border">{selectedComplaint.Details}</p>
                                </div>
                            </div>

                            {/* Editable fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الحالة (Status)</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-right"
                                        value={editForm.Status}
                                        onChange={(e) => setEditForm({ ...editForm, Status: e.target.value })}
                                    >
                                        <option value="Pending">معلقة (Pending)</option>
                                        <option value="In Progress">قيد المعالجة (In Progress)</option>
                                        <option value="Resolved">تم الحل (Resolved)</option>
                                        <option value="Closed">مغلقة (Closed)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الأولوية (Priority)</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-right"
                                        value={editForm.Priority}
                                        onChange={(e) => setEditForm({ ...editForm, Priority: e.target.value })}
                                    >
                                        <option value="Low">منخفضة (Low)</option>
                                        <option value="Medium">متوسطة (Medium)</option>
                                        <option value="High">عالية (High)</option>
                                        <option value="Critical">حرجة (Critical)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">تعيين إلى (Assign To)</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-right"
                                        value={editForm.AssignedUser}
                                        onChange={(e) => setEditForm({ ...editForm, AssignedUser: e.target.value })}
                                    >
                                        <option value="">لم يتم التعيين (Unassigned)</option>
                                        {users.map(user => (
                                            <option key={user.UserID} value={user.FullName}>
                                                {user.FullName} ({user.Role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">القسم المسؤول</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-right"
                                        value={editForm.RelevantDepartment}
                                        onChange={(e) => setEditForm({ ...editForm, RelevantDepartment: e.target.value })}
                                    >
                                        <option value="ER">الطوارئ (Emergency)</option>
                                        <option value="OPD">العيادات (OPD)</option>
                                        <option value="LAB">المختبر (Lab)</option>
                                        <option value="RAD">الأشعة (Radiology)</option>
                                        <option value="INP">الداخلي (Inpatient)</option>
                                        <option value="OTH">أخرى (Other)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات داخلية (Internal Notes)</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 outline-none text-right"
                                    placeholder="ملاحظات للموظفين فقط..."
                                    value={editForm.InternalNotes}
                                    onChange={(e) => setEditForm({ ...editForm, InternalNotes: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">الرد على الشكوى (Response)</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 outline-none text-right"
                                    placeholder="الرد الذي سيتم إرساله للمريض..."
                                    value={editForm.ResponseText}
                                    onChange={(e) => setEditForm({ ...editForm, ResponseText: e.target.value })}
                                />
                            </div>

                            {selectedComplaint.AssignedDate && (
                                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                    <strong>تاريخ التعيين:</strong> {new Date(selectedComplaint.AssignedDate).toLocaleString('ar')}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3 justify-end sticky bottom-0 bg-white">
                            <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>
                                إلغاء
                            </Button>
                            <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
                                <Save size={18} /> حفظ التحديثات
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

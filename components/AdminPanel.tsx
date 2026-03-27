
import React, { useState, useEffect } from 'react';
import { User, Complaint, UserGroup, Department, Question, QuestionTranslation, ComplaintUpdate } from '../types';
import { getUsers, addUser, updateUser, deleteUser, getComplaints, updateComplaint, deleteComplaint, fetchConfig, updateDepartments, updateQuestions } from '../services/db';
import { AdminDashboard } from './AdminDashboard';
import { ComplaintAnalytics } from './ComplaintAnalytics';
import AttendanceManagement from './AttendanceManagement';
import { Button, Input, Card, BrandLogo, Badge } from './UI';
import { IncidentDashboard } from './IncidentDashboard';
import { IncidentReportForm } from './IncidentReportForm';
import { Users, LayoutDashboard, AlertTriangle, Trash2, Plus, X, Search, CheckCircle, FileSpreadsheet, Lock, Settings, Edit3, AlertCircle } from 'lucide-react';
import { MainMenuItem, DEFAULT_MAIN_MENU_ITEMS, ICONS_MAP } from '../constants';
import { useTranslation } from 'react-i18next';

export const AdminPanel = ({ onClose, currentUser, mainMenuItems, setMainMenuItems }: { onClose: () => void, currentUser: User, mainMenuItems: MainMenuItem[], setMainMenuItems: React.Dispatch<React.SetStateAction<MainMenuItem[]>> }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'complaints' | 'settings' | 'attendance' | 'incidents'>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<'depts' | 'questions' | 'menu'>('depts');

  // RBAC: If Manager, they cannot access Users or Settings tab. Super Admin has all access.
  const isManager = currentUser.UserGroup === 'Manager';
  const isSuperAdmin = currentUser.UserGroup === 'Super Admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      {/* Top Bar */}
      <header className="bg-[#1B2B5B] text-white px-6 py-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" className="brightness-0 invert" />
            <div className="h-6 w-px bg-white/20"></div>
            <span className="font-bold text-lg">
              {isManager ? t('admin.managerView') : t('admin.adminPanel')}
            </span>
          </div>
          <Button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white border-0">
            {t('admin.exit')} <X size={18} className="mr-2" />
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 flex gap-8 items-start">

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-2 sticky top-24">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-[#1B2B5B] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            <LayoutDashboard size={20} />
            الرئيسية (Dashboard)
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'complaints' ? 'bg-[#1B2B5B] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            <AlertTriangle size={20} />
            إدارة الشكاوى (Complaints)
          </button>

          {!isManager && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'users' ? 'bg-[#1B2B5B] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
              >
                <Users size={20} />
                إدارة المستخدمين (Users)
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'attendance' ? 'bg-[#1B2B5B] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  <Settings size={20} />
                  إدارة الحضور والورديات (Attendance)
                </button>
              )}

              <button
                onClick={() => setActiveTab('incidents')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'incidents' ? 'bg-[#1B2B5B] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
              >
                <AlertCircle size={20} />
                بلاغات الحوادث (Incidents)
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'settings' ? 'bg-[#1B2B5B] text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
              >
                <Settings size={20} />
                الإعدادات (Settings)
              </button>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <AdminDashboard hideCloseButton />}
          {activeTab === 'users' && !isManager && <UserManagement />}
          {activeTab === 'complaints' && <ComplaintsManagement currentUser={currentUser} />}
          {activeTab === 'settings' && !isManager && <SettingsManagement mainMenuItems={mainMenuItems} setMainMenuItems={setMainMenuItems} currentUser={currentUser} />}
          {activeTab === 'attendance' && isSuperAdmin && <AttendanceManagement />}
          {activeTab === 'incidents' && <IncidentDashboard />}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    Name: '', Username: '', UserGroup: 'User', Department: '', CreatedAt: ''
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const generateId = () => {
    // Fallback for environments without crypto.randomUUID
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const storedMenu = localStorage.getItem('hospital_main_menu_items');
    if (storedMenu) {
      try {
        const parsed = JSON.parse(storedMenu);
        if (Array.isArray(parsed)) {
          setMainMenuItems(parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored main menu items', e);
      }
    }
  }, []);

  const handleSaveUser = async () => {
    if (!newUser.Name || !newUser.Username || !newUser.UserGroup) {
      setError('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    // Password required for new users only
    if (!editingId && !password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    try {
      if (editingId) {
        // UPDATE
        const payload: any = { ...newUser, UserID: editingId };
        if (password) payload.Password = password; // Only update pw if provided

        await updateUser(payload);
        setEditingId(null);
      } else {
        // CREATE
        const userPayload = { ...newUser, Password: password, UserID: generateId(), IsActive: true, CreatedAt: new Date().toISOString() };
        await addUser(userPayload as any);
      }

      await fetchUsers();
      // Reset Form
      setNewUser({ Name: '', Username: '', UserGroup: 'User', Department: '', CreatedAt: '' });
      setPassword('');
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = (u: User) => {
    setEditingId(u.UserID);
    setNewUser({
      Name: u.Name,
      Username: u.Username,
      UserGroup: u.UserGroup,
      Department: u.Department || ''
    });
    setPassword(u.Password || '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewUser({ Name: '', Username: '', UserGroup: 'User', Department: '', CreatedAt: '' });
    setPassword('');
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteUser(id);
        await fetchUsers();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">إدارة المستخدمين (Users.xlsx)</h2>
          <p className="text-slate-500">إدارة صلاحيات الوصول والمجموعات</p>
        </div>
      </div>

      <Card className={`p-6 border-slate-300 transition-colors ${editingId ? 'bg-blue-50 border-blue-200 shadow-md' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold text-lg ${editingId ? 'text-blue-800' : 'text-[#1B2B5B]'}`}>
            {editingId ? 'تعديل بيانات المستخدم' : 'تسجيل مستخدم جديد'}
          </h3>
          {editingId && <Button variant="ghost" onClick={cancelEdit} className="text-sm">إلغاء التعديل</Button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="الاسم الكامل (Name) *"
            value={newUser.Name}
            onChange={(e: any) => setNewUser({ ...newUser, Name: e.target.value })}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">المجموعة (User Group) *</label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white"
              value={newUser.UserGroup}
              onChange={(e) => setNewUser({ ...newUser, UserGroup: e.target.value as UserGroup })}
            >
              <option value="User">مستخدم (User) - استبيانات فقط</option>
              <option value="Manager">مشرف (Manager) - تقارير</option>
              <option value="Administrator">مسؤول (Administrator) - تحكم كامل</option>
            </select>
          </div>

          <Input
            label="اسم المستخدم (Username) *"
            value={newUser.Username}
            onChange={(e: any) => setNewUser({ ...newUser, Username: e.target.value })}
          />
          <Input
            label={editingId ? "كلمة المرور (اتركها فارغة للإبقاء)" : "كلمة المرور (Password) *"}
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />

          <Input
            label="القسم (Department)"
            value={newUser.Department}
            onChange={(e: any) => setNewUser({ ...newUser, Department: e.target.value })}
            placeholder="مثال: IT, HR, Nursing"
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex justify-end gap-2">
          {editingId && <Button variant="secondary" onClick={cancelEdit}>إلغاء</Button>}
          <Button onClick={handleSaveUser} className={editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-[#1B2B5B]"}>
            {editingId ? <Edit3 size={18} className="ml-2" /> : <Plus size={18} className="ml-2" />}
            {editingId ? 'حفظ التعديلات' : 'حفظ المستخدم'}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-slate-600 font-medium">الاسم</th>
                <th className="px-6 py-4 text-slate-600 font-medium">اسم الدخول</th>
                <th className="px-6 py-4 text-slate-600 font-medium">كلمة المرور</th>
                <th className="px-6 py-4 text-slate-600 font-medium">المجموعة</th>
                <th className="px-6 py-4 text-slate-600 font-medium">القسم</th>
                <th className="px-6 py-4 text-slate-600 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.UserID} className={`hover:bg-slate-50 transition-colors ${editingId === u.UserID ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-900">{u.Name}</td>
                  <td className="px-6 py-4 text-slate-500" dir="ltr">{u.Username}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono" dir="ltr">{u.Password}</td>
                  <td className="px-6 py-4">
                    <Badge color={
                      u.UserGroup === 'Administrator' ? 'bg-purple-100 text-purple-700' :
                        u.UserGroup === 'Manager' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                    }>
                      {u.UserGroup}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{u.Department || '-'}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                      title="تعديل"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.UserID)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2"
                      title="حذف"
                      disabled={u.UserGroup === 'Administrator' && users.filter(usr => usr.UserGroup === 'Administrator').length <= 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const ComplaintsManagement = ({ currentUser }: { currentUser: User }) => {
  const [view, setView] = useState<'list' | 'analytics'>('list');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Complaint>>({});

  // Timeline State
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');

  const fetchComplaints = async () => {
    try {
      const data = await getComplaints();
      setComplaints(data.reverse());
    } catch (e) { console.error(e) }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) { console.error(e) }
  };

  const fetchUpdates = async (id: string) => {
    try {
      const res = await fetch(`/api/complaints/${id}/updates`);
      const data = await res.json();
      setUpdates(data);
    } catch (e) { console.error(e); setUpdates([]); }
  };

  useEffect(() => {
    fetchComplaints();
    fetchUsers();
  }, []);

  const handleEditClick = async (c: Complaint) => {
    setEditingId(c.ComplaintID);
    setEditForm({
      Status: c.Status || 'Pending',
      Priority: c.Priority || 'Medium',
      AssignedUser: c.AssignedUser || '',
      AdminNotes: c.AdminNotes || ''
    });
    setActiveTab('details');
    await fetchUpdates(c.ComplaintID);
  };

  const handleSave = async () => {
    if (!editingId) return;
    const original = complaints.find(c => c.ComplaintID === editingId);
    if (!original) return;

    // Check if assignment changed to log it
    if (editForm.AssignedUser !== original.AssignedUser && editForm.AssignedUser) {
      await handleAddUpdate(editingId, `تم تعيين الشكوى إلى: ${editForm.AssignedUser}`, 'Assignment');
    }

    const updated: Complaint = {
      ...original,
      ...editForm,
    } as Complaint;

    await updateComplaint(updated);
    await fetchComplaints();
    setEditingId(null);
  };

  const handleAddUpdate = async (id: string, text: string, type: string = 'Response') => {
    if (!text) return;
    try {
      const payload = {
        UserID: currentUser.UserID,
        UserName: currentUser.Name,
        UpdateText: text,
        Type: type
      };

      await fetch(`/api/complaints/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setNewUpdateText('');
      await fetchUpdates(id);
    } catch (e) { alert('Failed to add update'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشكوى نهائياً؟')) return;
    try {
      await deleteComplaint(id);
      await fetchComplaints();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const filtered = complaints.filter(c => filter === 'all' || c.Status === filter);
  const getStatusLabel = (s: string) => s === 'Pending' ? 'جديد' : s === 'Resolved' ? 'مكتمل' : s === 'In Progress' ? 'قيد المعالجة' : s;
  const getStatusColor = (s: string) => s === 'Pending' ? 'bg-red-100 text-red-700' : s === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
  const getPriorityColor = (p?: string) => p === 'Critical' ? 'bg-red-600 text-white' : p === 'High' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700';

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">سجل الشكاوى</h2>
          <p className="text-slate-500">متابعة ومعالجة شكاوى المرضى وتعيين المسؤولين</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'list' ? 'bg-white shadow text-[#1B2B5B]' : 'text-slate-500'}`}
            >
              قائمة الشكاوى
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'analytics' ? 'bg-white shadow text-[#1B2B5B]' : 'text-slate-500'}`}
            >
              لوحة التحليلات
            </button>
          </div>

          {view === 'list' && (
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              {['all', 'Pending', 'In Progress', 'Resolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-[#1B2B5B] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {f === 'all' && 'الكل'}
                  {f === 'Pending' && 'جديد'}
                  {f === 'In Progress' && 'معالجة'}
                  {f === 'Resolved' && 'مكتمل'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === 'analytics' ? (
        <ComplaintAnalytics />
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <Card key={c.ComplaintID} className="p-0 overflow-hidden border-slate-200 transition-shadow hover:shadow-md">
              <div className={`h-1 w-full ${c.Status === 'Pending' ? 'bg-red-500' : c.Status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              <div className="p-6">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                      {c.PatientName || 'مجهول'}
                      <span className="text-slate-400 font-normal text-sm mx-2">| {c.Phone}</span>
                      {c.Priority && <span className={`px-2 py-0.5 rounded text-[10px] ${getPriorityColor(c.Priority)}`}>{c.Priority}</span>}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline">{c.Department}</Badge>
                      {c.AssignedUser && <span className="text-xs text-blue-600 font-bold flex items-center gap-1"><Users size={12} /> {c.AssignedUser}</span>}
                      <span className="text-xs text-slate-400" dir="ltr">{new Date(c.CreatedAt || c.ComplaintDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge color={getStatusColor(c.Status)}>{getStatusLabel(c.Status)}</Badge>
                </div>

                {/* Main Content */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                  <p className="text-slate-700 leading-relaxed text-sm">{c.Details || c.ComplaintText}</p>
                </div>

                {/* Editor / Actions */}
                {editingId === c.ComplaintID ? (
                  <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50">
                      <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'details' ? 'bg-white text-blue-700 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-white'}`}>البيانات الأساسية</button>
                      <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'timeline' ? 'bg-white text-blue-700 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-white'}`}>سجل المتابعة ({updates.length})</button>
                    </div>

                    <div className="p-5">
                      {activeTab === 'details' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">الحالة</label>
                            <select className="w-full p-2 rounded border border-slate-300 text-sm" value={editForm.Status} onChange={e => setEditForm({ ...editForm, Status: e.target.value })}>
                              <option value="Pending">جديد (Pending)</option>
                              <option value="In Progress">قيد المعالجة (In Progress)</option>
                              <option value="Resolved">تم الحل (Resolved)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">الأولوية</label>
                            <select className="w-full p-2 rounded border border-slate-300 text-sm" value={editForm.Priority} onChange={e => setEditForm({ ...editForm, Priority: e.target.value as any })}>
                              <option value="Low">منخفضة</option>
                              <option value="Medium">متوسطة</option>
                              <option value="High">عالية</option>
                              <option value="Critical">حرجة جداً</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">تعيين إلى موظف (Assign To)</label>
                            <select className="w-full p-2 rounded border border-slate-300 text-sm" value={editForm.AssignedUser} onChange={e => setEditForm({ ...editForm, AssignedUser: e.target.value })}>
                              <option value="">-- غير معين --</option>
                              {users.map(u => (
                                <option key={u.UserID} value={u.Name}>{u.Name} ({u.UserGroup}) - {u.Department}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">ملاحظات إدارية</label>
                            <textarea className="w-full p-2 rounded border border-slate-300 text-sm" rows={2} value={editForm.AdminNotes} onChange={e => setEditForm({ ...editForm, AdminNotes: e.target.value })} />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Updates List */}
                          <div className="max-h-60 overflow-y-auto space-y-3 p-1 custom-scrollbar">
                            {updates.length === 0 && <p className="text-center text-slate-400 text-sm py-4">لا توجد تحديثات سابقة</p>}
                            {updates.map(u => (
                              <div key={u.UpdateID} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="font-bold text-slate-700">{u.UserName}</span>
                                  <span className="text-xs text-slate-400" dir="ltr">{new Date(u.Timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-600">{u.UpdateText}</p>
                                {u.Type === 'Assignment' && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded ml-2">تعيين</span>}
                              </div>
                            ))}
                          </div>
                          {/* Add Update */}
                          <div className="flex gap-2 items-start border-t pt-3">
                            <textarea
                              className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                              placeholder="اكتب ردك أو تحديثك هنا..."
                              rows={2}
                              value={newUpdateText}
                              onChange={e => setNewUpdateText(e.target.value)}
                            />
                            <Button onClick={() => handleAddUpdate(c.ComplaintID, newUpdateText)} disabled={!newUpdateText.trim()} className="h-10 px-4 text-sm scale-90">إرسال</Button>
                          </div>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                        <Button variant="ghost" onClick={() => setEditingId(null)} className="text-sm">إلغاء</Button>
                        <Button onClick={handleSave} className="bg-[#1B2B5B] text-sm">حفظ وإغلاق</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                    <div className="text-sm text-slate-500">
                      {c.AdminNotes && <span className="flex items-center gap-1 text-xs"><CheckCircle size={12} className="text-green-500" /> {c.AdminNotes}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => handleDelete(c.ComplaintID)} className="text-red-400 hover:text-red-600 hover:bg-red-50 !p-2">
                        <Trash2 size={16} />
                      </Button>
                      <Button variant="secondary" onClick={() => handleEditClick(c)} className="!py-1.5 !px-4 text-sm font-bold text-[#1B2B5B]">
                        متابعة / تحديث
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400">لا توجد شكاوى</div>}
        </div>
      )}
    </div>
  );
};

const SettingsManagement = ({ mainMenuItems, setMainMenuItems, currentUser }: { mainMenuItems: MainMenuItem[], setMainMenuItems: React.Dispatch<React.SetStateAction<MainMenuItem[]>>, currentUser: User }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [translations, setTranslations] = useState<QuestionTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'depts' | 'questions' | 'menu'>('depts');
  const [showIcons, setShowIcons] = useState(true);

  const loadConfig = async () => {
    setLoading(true);
    const data = await fetchConfig();
    if (data.departments) setDepartments(data.departments);
    if (data.questions) setQuestions(data.questions);
    if (data.translations) setTranslations(data.translations);
    
    // Load menu settings
    try {
      const res = await fetch('/api/config/menu-settings');
      const settings = await res.json();
      
      let visibility = true;
      if (settings && typeof settings.showIcons !== 'undefined') {
        // Handle boolean, string 'true'/'false', or number 1/0 from Excel
        const val = settings.showIcons;
        visibility = val === true || val === 'true' || val === 1 || val === '1';
      } else if (typeof settings === 'boolean') {
        visibility = settings;
      }
      
      setShowIcons(visibility);
    } catch (e) {
      console.error('Failed to load menu settings', e);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleToggleIcons = async (val: boolean) => {
    try {
      setShowIcons(val);
      const userSession = localStorage.getItem('hospital_user_session');
      const user = userSession ? JSON.parse(userSession) : { UserID: 'unknown' };
      
      await fetch('/api/config/menu-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showIcons: val, userId: user.UserID })
      });
      
      // Update local storage for immediate effect if needed, but the main dashboard 
      // will fetch from API on next load or we can use a broadcast channel if needed.
      localStorage.setItem('hospital_icon_visibility', JSON.stringify(val));
    } catch (e) {
      alert('Failed to update menu settings');
    }
  };

  const handleToggleMenuItem = (menuId: string) => {
    setMainMenuItems(prev => {
      const updated = prev.map(item => item.id === menuId ? { ...item, isActive: !item.isActive } : item);
      localStorage.setItem('hospital_main_menu_items', JSON.stringify(updated));
      fetch('/api/config/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItems: updated,
          userId: currentUser?.UserID || 'unknown'
        })
      }).catch(err => console.error('Failed to persist menu items', err));

      return updated;
    });
  };

  const handleSaveDepts = async () => {
    try {
      await updateDepartments(departments);
      alert('Departments saved successfully!');
    } catch (e) { alert('Failed to save'); }
  };

  const handleAddDept = () => {
    const newId = `D${departments.length + 1}_${Date.now().toString().slice(-4)}`;
    const newDept: Department = { DeptID: newId, NameEn: 'New Dept', NameAr: 'قسم جديد', Type: 'WARD', SurveyType: 'Inpatient', IsActive: true };
    setDepartments([...departments, newDept]);
  };

  const handleDeptChange = (id: string, field: keyof Department, val: any) => {
    setDepartments(prev => prev.map(d => d.DeptID === id ? { ...d, [field]: val } : d));
  };

  const handleDeleteDept = (id: string) => {
    if (confirm('Delete this department?')) {
      setDepartments(prev => prev.filter(d => d.DeptID !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">إعدادات النظام</h2>
          <p className="text-slate-500">إدارة الأقسام والاستبيانات</p>
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
          <button onClick={() => setActiveSubTab('depts')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeSubTab === 'depts' ? 'bg-[#1B2B5B] text-white' : 'text-slate-600'}`}>الأقسام (Departments)</button>
          <button onClick={() => setActiveSubTab('questions')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeSubTab === 'questions' ? 'bg-[#1B2B5B] text-white' : 'text-slate-600'}`}>الأسئلة (Questions)</button>
          <button onClick={() => setActiveSubTab('menu')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeSubTab === 'menu' ? 'bg-[#1B2B5B] text-white' : 'text-slate-600'}`}>القائمة الرئيسية (Menu)</button>
        </div>
      </div>

      {activeSubTab === 'menu' && (
        <Card className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">إعدادات الأيقونات</h3>
              <p className="text-slate-500">إظهار أو إخفاء الأيقونات من بطاقات الصفحة الرئيسية</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-bold ${showIcons ? 'text-green-600' : 'text-slate-400'}`}>
                {showIcons ? 'مفعلة' : 'معطلة'}
              </span>
              <button
                onClick={() => handleToggleIcons(!showIcons)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${showIcons ? 'bg-[#1B2B5B]' : 'bg-slate-200'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${showIcons ? '-translate-x-7' : '-translate-x-1'}`}
                />
              </button>
            </div>
          </div>
          <div className="mt-8">
            <h4 className="font-bold text-lg mb-3">عناصر القائمة الرئيسية</h4>

            {mainMenuItems.length === 0 && (
              <p className="text-sm text-slate-500">لا توجد عناصر في القائمة الرئيسية. الرجاء إعدادها في الصفحة الرئيسية.</p>
            )}

            <div className="grid gap-4">
              {mainMenuItems.map(item => {
                const IconComponent = ICONS_MAP[item.icon];
                return (
                  <div key={item.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {showIcons && IconComponent ? (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <IconComponent size={18} />
                        </div>
                      ) : null}
                      <div>
                        <div className="font-medium">{item.titleAr}</div>
                        <div className="text-slate-500 text-xs">{item.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleMenuItem(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-slate-500'}`}
                    >
                      {item.isActive ? 'مفعّل' : 'معطل'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {activeSubTab === 'depts' && (
        <Card className="p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-lg">قائمة الأقسام</h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleAddDept}><Plus size={16} className="ml-1" /> إضافة قسم</Button>
              <Button onClick={handleSaveDepts}>حفظ التغييرات</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">الاسم (EN)</th>
                  <th className="p-3">الاسم (AR)</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">التصنيف الرئيسي (Main)</th>
                  <th className="p-3">نوع الاستبيان</th>
                  <th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d.DeptID} className="border-b">
                    <td className="p-3 text-slate-500">{d.DeptID}</td>
                    <td className="p-3"><input className="border p-1 w-full rounded" value={d.NameEn} onChange={e => handleDeptChange(d.DeptID, 'NameEn', e.target.value)} /></td>
                    <td className="p-3"><input className="border p-1 w-full rounded" value={d.NameAr} onChange={e => handleDeptChange(d.DeptID, 'NameAr', e.target.value)} /></td>
                    <td className="p-3">
                      <select className="border p-1 rounded" value={d.Type} onChange={e => handleDeptChange(d.DeptID, 'Type', e.target.value)}>
                        <option value="WARD">WARD</option>
                        <option value="CLINIC">CLINIC</option>
                        <option value="ED">ED</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select className="border p-1 rounded" value={d.MainCategory || 'OPD'} onChange={e => handleDeptChange(d.DeptID, 'MainCategory', e.target.value)}>
                        <option value="OPD">OPD</option>
                        <option value="Inpatient">Inpatient</option>
                        <option value="Allied Health">Allied Health</option>
                        <option value="ED">ED</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select className="border p-1 rounded" value={d.SurveyType} onChange={e => handleDeptChange(d.DeptID, 'SurveyType', e.target.value)}>
                        <option value="Inpatient">Inpatient</option>
                        <option value="Outpatient">Outpatient</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Physiotherapy">Physiotherapy</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Pharmacy">Pharmacy</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleDeleteDept(d.DeptID)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'questions' && (
        <Card className="p-6">
          <QuestionsEditor
            questions={questions}
            translations={translations}
            onSave={async (qs, ts) => {
              try {
                await updateQuestions(qs, ts);
                alert('Questions saved successfully!');
                loadConfig();
              } catch (e) { alert('Failed to save'); }
            }}
          />
        </Card>
      )}
    </div>
  );
};

const QuestionsEditor = ({ questions, translations, onSave }: { questions: Question[], translations: QuestionTranslation[], onSave: (q: Question[], t: QuestionTranslation[]) => void }) => {
  const [selectedType, setSelectedType] = useState('Inpatient');
  // Combine data for editing
  const [editedQuestions, setEditedQuestions] = useState<any[]>([]);

  useEffect(() => {
    // Merge Question + Translations (AR & EN) into a single editable object
    const merged = questions.map(q => {
      const transAr = translations.find(t => t.QuestionID === q.QuestionID && t.Language === 'AR');
      const transEn = translations.find(t => t.QuestionID === q.QuestionID && t.Language === 'EN');
      return {
        ...q,
        TextAr: transAr?.QuestionText || '',
        TextEn: transEn?.QuestionText || '',
        OptionsAr: transAr?.Options || '',
        OptionsEn: transEn?.Options || '' // Usually options match but language differs
      };
    });
    setEditedQuestions(merged);
  }, [questions, translations]);

  const filtered = editedQuestions.filter(q => q.SurveyType === selectedType);

  const handleChange = (id: string, field: string, value: any) => {
    setEditedQuestions(prev => prev.map(q => q.QuestionID === id ? { ...q, [field]: value } : q));
  };

  const handleAdd = () => {
    const newId = `q_${selectedType.toLowerCase().substring(0, 2)}_${Date.now().toString().slice(-4)}`;
    const newQ = {
      QuestionID: newId,
      SurveyType: selectedType,
      Category: 'General',
      AnswerType: 'Scale',
      IsActive: true,
      TextAr: 'سؤال جديد',
      TextEn: 'New Question',
      OptionsAr: '',
      OptionsEn: ''
    };
    setEditedQuestions([...editedQuestions, newQ]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this question?')) {
      setEditedQuestions(prev => prev.filter(q => q.QuestionID !== id));
    }
  };

  const handleSaveClick = () => {
    // Split back into Question and QuestionTranslation
    const finalQuestions: Question[] = editedQuestions.map(eq => ({
      QuestionID: eq.QuestionID,
      SurveyType: eq.SurveyType,
      Category: eq.Category,
      AnswerType: eq.AnswerType,
      IsActive: eq.IsActive
    }));

    let finalTranslations: QuestionTranslation[] = [];
    editedQuestions.forEach(eq => {
      finalTranslations.push({
        QuestionID: eq.QuestionID,
        Language: 'AR',
        QuestionText: eq.TextAr,
        Options: eq.OptionsAr
      });
      finalTranslations.push({
        QuestionID: eq.QuestionID,
        Language: 'EN',
        QuestionText: eq.TextEn,
        Options: eq.OptionsEn // Fallback or distinct
      });
    });

    onSave(finalQuestions, finalTranslations);
  };

  const surveyTypes = ['Inpatient', 'Outpatient', 'Emergency', 'Physiotherapy', 'Laboratory', 'Radiology', 'Pharmacy'];

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-bold text-slate-700">نوع الاستبيان:</span>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="border p-2 rounded-lg bg-white"
          >
            {surveyTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleAdd}><Plus size={16} className="ml-1" /> إضافة سؤال</Button>
          <Button onClick={handleSaveClick} className="bg-emerald-600 hover:bg-emerald-700">حفظ الكل</Button>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((q, idx) => (
          <div key={q.QuestionID} className="bg-slate-50 border border-slate-200 rounded-lg p-4 transition-all hover:shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Meta */}
              <div className="md:col-span-1 text-center">
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">{idx + 1}</span>
                <div className="mt-2" title="Delete">
                  <button onClick={() => handleDelete(q.QuestionID)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Main Content */}
              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Arabic Section */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">نص السؤال (عربي)</label>
                  <input
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1B2B5B] outline-none"
                    dir="rtl"
                    value={q.TextAr}
                    onChange={(e) => handleChange(q.QuestionID, 'TextAr', e.target.value)}
                  />
                  {(q.AnswerType === 'Radio' || q.AnswerType === 'Boolean') && (
                    <input
                      className="w-full border p-2 rounded text-xs bg-white"
                      placeholder="الخيارات (مفصولة بفاصلة)"
                      value={q.OptionsAr}
                      onChange={(e) => handleChange(q.QuestionID, 'OptionsAr', e.target.value)}
                    />
                  )}
                </div>

                {/* English Section */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Question Text (English)</label>
                  <input
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1B2B5B] outline-none"
                    dir="ltr"
                    value={q.TextEn}
                    onChange={(e) => handleChange(q.QuestionID, 'TextEn', e.target.value)}
                  />
                  {(q.AnswerType === 'Radio' || q.AnswerType === 'Boolean') && (
                    <input
                      className="w-full border p-2 rounded text-xs bg-white"
                      placeholder="Options (Comma separated)"
                      value={q.OptionsEn}
                      onChange={(e) => handleChange(q.QuestionID, 'OptionsEn', e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Config Row */}
            <div className="flex gap-4 mt-4 pt-3 border-t border-slate-200">
              <div className="w-1/3">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Answer Type</label>
                <select
                  className="w-full border p-1 rounded text-sm bg-white"
                  value={q.AnswerType}
                  onChange={(e) => handleChange(q.QuestionID, 'AnswerType', e.target.value)}
                >
                  <option value="Scale">Scale (1-5)</option>
                  <option value="NPS">NPS (0-10)</option>
                  <option value="Text">Text Input</option>
                  <option value="Radio">Multiple Choice</option>
                  <option value="Boolean">Yes/No</option>
                </select>
              </div>
              <div className="w-1/3">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Category</label>
                <input
                  className="w-full border p-1 rounded text-sm"
                  value={q.Category}
                  onChange={(e) => handleChange(q.QuestionID, 'Category', e.target.value)}
                />
              </div>
              <div className="w-1/3 flex items-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.IsActive}
                    onChange={(e) => handleChange(q.QuestionID, 'IsActive', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Active (نشط)</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center p-8 text-slate-400 border-2 border-dashed rounded-xl">
            لا توجد أسئلة لهذا القسم حالياً.
          </div>
        )}
      </div>
    </div>
  );
};

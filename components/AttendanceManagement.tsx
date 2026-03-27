import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Shift } from '../types';
import { Button, Input, Card } from './UI';
import { Clock, Calendar, User, MapPin, FileText, Plus, Edit, Trash2, CheckCircle, XCircle, Users, Settings } from 'lucide-react';

interface AttendanceManagementProps {
  currentUser: any;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'shifts'>('attendance');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Check-in/Check-out state
  const [checkInData, setCheckInData] = useState({
    department: '',
    shiftId: '',
    notes: ''
  });

  // Shift form state
  const [shiftForm, setShiftForm] = useState({
    Name: '',
    StartTime: '',
    EndTime: '',
    Department: '',
    DaysOfWeek: [] as number[],
    IsActive: true
  });

  // Filters
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    department: '',
    userId: ''
  });

  // Current user status
  const [userStatus, setUserStatus] = useState({
    isCheckedIn: false,
    checkInTime: null as string | null,
    checkOutTime: null as string | null,
    record: null as AttendanceRecord | null
  });

  useEffect(() => {
    loadAttendanceRecords();
    loadShifts();
    loadUserStatus();
  }, [filters]);

  const loadAttendanceRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.department) params.append('department', filters.department);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await fetch(`/api/attendance?${params}`);
      const data = await response.json();
      setAttendanceRecords(data);
    } catch (error) {
      console.error('Failed to load attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    try {
      const response = await fetch('/api/shifts');
      const data = await response.json();
      setShifts(data);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    }
  };

  const loadUserStatus = async () => {
    try {
      const response = await fetch(`/api/attendance/status/${currentUser.UserID}`);
      const data = await response.json();
      setUserStatus(data);
    } catch (error) {
      console.error('Failed to load user status:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.UserID,
          ...checkInData
        })
      });

      if (response.ok) {
        alert('تم تسجيل الحضور بنجاح');
        setShowCheckInModal(false);
        loadUserStatus();
        loadAttendanceRecords();
        setCheckInData({ department: '', shiftId: '', notes: '' });
      } else {
        const error = await response.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('فشل في تسجيل الحضور');
    }
  };

  const handleCheckOut = async () => {
    const notes = prompt('أدخل ملاحظات الانصراف (اختياري):');
    try {
      const response = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.UserID,
          notes
        })
      });

      if (response.ok) {
        alert('تم تسجيل الانصراف بنجاح');
        loadUserStatus();
        loadAttendanceRecords();
      } else {
        const error = await response.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      alert('فشل في تسجيل الانصراف');
    }
  };

  const handleCreateShift = async () => {
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftForm)
      });

      if (response.ok) {
        alert('تم إنشاء الوردية بنجاح');
        setShowShiftModal(false);
        loadShifts();
        resetShiftForm();
      } else {
        const error = await response.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create shift:', error);
      alert('فشل في إنشاء الوردية');
    }
  };

  const handleUpdateShift = async () => {
    if (!editingShift) return;

    try {
      const response = await fetch(`/api/shifts/${editingShift.ShiftID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftForm)
      });

      if (response.ok) {
        alert('تم تحديث الوردية بنجاح');
        setShowShiftModal(false);
        setEditingShift(null);
        loadShifts();
        resetShiftForm();
      } else {
        const error = await response.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to update shift:', error);
      alert('فشل في تحديث الوردية');
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوردية؟')) return;

    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('تم حذف الوردية بنجاح');
        loadShifts();
      } else {
        const error = await response.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete shift:', error);
      alert('فشل في حذف الوردية');
    }
  };

  const resetShiftForm = () => {
    setShiftForm({
      Name: '',
      StartTime: '',
      EndTime: '',
      Department: '',
      DaysOfWeek: [],
      IsActive: true
    });
  };

  const openEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      Name: shift.Name,
      StartTime: shift.StartTime,
      EndTime: shift.EndTime,
      Department: shift.Department || '',
      DaysOfWeek: shift.DaysOfWeek || [],
      IsActive: shift.IsActive
    });
    setShowShiftModal(true);
  };

  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">إدارة الحضور والورديات</h2>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'attendance'
                ? 'bg-[#1B2B5B] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock size={18} className="inline ml-2" />
            الحضور
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'shifts'
                ? 'bg-[#1B2B5B] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Settings size={18} className="inline ml-2" />
            الورديات
          </button>
        </div>

        {/* Current User Status */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-2">حالة الحضور الحالية</h3>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              userStatus.isCheckedIn
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {userStatus.isCheckedIn ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {userStatus.isCheckedIn ? 'مسجل حضور' : 'غير مسجل حضور'}
            </div>
            {userStatus.checkInTime && (
              <span className="text-sm text-slate-600">
                وقت الحضور: {userStatus.checkInTime}
              </span>
            )}
            {userStatus.checkOutTime && (
              <span className="text-sm text-slate-600">
                وقت الانصراف: {userStatus.checkOutTime}
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {!userStatus.isCheckedIn ? (
              <Button onClick={() => setShowCheckInModal(true)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="ml-2" />
                تسجيل حضور
              </Button>
            ) : (
              <Button onClick={handleCheckOut} className="bg-red-600 hover:bg-red-700">
                <XCircle size={16} className="ml-2" />
                تسجيل انصراف
              </Button>
            )}
          </div>
        </div>
      </div>

        {/* Content Area */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">سجلات الحضور</h3>
              <Button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="ml-2" />
                رفع ملف الحضور
              </Button>
            </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              label="التاريخ"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
            />
            <Input
              label="القسم"
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              placeholder="اسم القسم"
            />
            <Input
              label="معرف المستخدم"
              value={filters.userId}
              onChange={(e) => setFilters({...filters, userId: e.target.value})}
              placeholder="معرف المستخدم"
            />
          </div>

          {/* Attendance Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 p-3 text-right">الاسم</th>
                  <th className="border border-slate-200 p-3 text-right">التاريخ</th>
                  <th className="border border-slate-200 p-3 text-right">وقت الحضور</th>
                  <th className="border border-slate-200 p-3 text-right">وقت الانصراف</th>
                  <th className="border border-slate-200 p-3 text-right">الحالة</th>
                  <th className="border border-slate-200 p-3 text-right">القسم</th>
                  <th className="border border-slate-200 p-3 text-right">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.RecordID} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-3">{record.Name}</td>
                    <td className="border border-slate-200 p-3">{record.Date}</td>
                    <td className="border border-slate-200 p-3">{record.CheckInTime || '-'}</td>
                    <td className="border border-slate-200 p-3">{record.CheckOutTime || '-'}</td>
                    <td className="border border-slate-200 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.Status === 'Present' ? 'bg-green-100 text-green-800' :
                        record.Status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                        record.Status === 'Absent' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.Status === 'Present' ? 'حاضر' :
                         record.Status === 'Late' ? 'متأخر' :
                         record.Status === 'Absent' ? 'غائب' :
                         record.Status === 'On Leave' ? 'إجازة' : record.Status}
                      </span>
                    </td>
                    <td className="border border-slate-200 p-3">{record.Department || '-'}</td>
                    <td className="border border-slate-200 p-3">{record.Notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">إدارة الورديات</h3>
            <Button onClick={() => { setEditingShift(null); resetShiftForm(); setShowShiftModal(true); }} className="bg-[#1B2B5B] hover:bg-[#152145]">
              <Plus size={16} className="ml-2" />
              إضافة وردية جديدة
            </Button>
          </div>

          {/* Shifts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <div key={shift.ShiftID} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-slate-800">{shift.Name}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditShift(shift)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="تعديل"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteShift(shift.ShiftID)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{shift.StartTime} - {shift.EndTime}</span>
                  </div>
                  {shift.Department && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{shift.Department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{shift.DaysOfWeek?.map(day => dayNames[day]).join(', ') || 'جميع الأيام'}</span>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    shift.IsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {shift.IsActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {shift.IsActive ? 'نشط' : 'غير نشط'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">تسجيل الحضور</h3>
            <div className="space-y-4">
              <Input
                label="القسم"
                value={checkInData.department}
                onChange={(e) => setCheckInData({...checkInData, department: e.target.value})}
                placeholder="اسم القسم"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الوردية</label>
                <select
                  value={checkInData.shiftId}
                  onChange={(e) => setCheckInData({...checkInData, shiftId: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">اختر الوردية</option>
                  {shifts.map(shift => (
                    <option key={shift.ShiftID} value={shift.ShiftID}>{shift.Name}</option>
                  ))}
                </select>
              </div>
              <Input
                label="ملاحظات"
                value={checkInData.notes}
                onChange={(e) => setCheckInData({...checkInData, notes: e.target.value})}
                placeholder="ملاحظات إضافية"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCheckIn} className="flex-1 bg-green-600 hover:bg-green-700">
                تسجيل الحضور
              </Button>
              <Button onClick={() => setShowCheckInModal(false)} variant="secondary" className="flex-1">
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingShift ? 'تعديل الوردية' : 'إضافة وردية جديدة'}
            </h3>
            <div className="space-y-4">
              <Input
                label="اسم الوردية"
                value={shiftForm.Name}
                onChange={(e) => setShiftForm({...shiftForm, Name: e.target.value})}
                placeholder="مثال: وردية الصباح"
              />
              <Input
                label="وقت البداية"
                type="time"
                value={shiftForm.StartTime}
                onChange={(e) => setShiftForm({...shiftForm, StartTime: e.target.value})}
              />
              <Input
                label="وقت النهاية"
                type="time"
                value={shiftForm.EndTime}
                onChange={(e) => setShiftForm({...shiftForm, EndTime: e.target.value})}
              />
              <Input
                label="القسم (اختياري)"
                value={shiftForm.Department}
                onChange={(e) => setShiftForm({...shiftForm, Department: e.target.value})}
                placeholder="اسم القسم"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">أيام الأسبوع</label>
                <div className="grid grid-cols-2 gap-2">
                  {dayNames.map((day, index) => (
                    <label key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shiftForm.DaysOfWeek.includes(index)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...shiftForm.DaysOfWeek, index]
                            : shiftForm.DaysOfWeek.filter(d => d !== index);
                          setShiftForm({...shiftForm, DaysOfWeek: newDays});
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shiftForm.IsActive}
                  onChange={(e) => setShiftForm({...shiftForm, IsActive: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">نشط</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={editingShift ? handleUpdateShift : handleCreateShift} className="flex-1 bg-[#1B2B5B] hover:bg-[#152145]">
                {editingShift ? 'تحديث' : 'إضافة'}
              </Button>
              <Button onClick={() => { setShowShiftModal(false); setEditingShift(null); resetShiftForm(); }} variant="secondary" className="flex-1">
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;

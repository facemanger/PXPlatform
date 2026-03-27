
import React, { useState } from 'react';
import { Button, Input, Card, BrandLogo } from './UI';
import { AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { submitComplaint } from '../services/db';

const uuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const ComplaintForm = ({ onClose }: any) => {
  // Initialize date with today's date in YYYY-MM-DD format
  const [form, setForm] = useState({
    name: '',
    phone: '',
    dept: '',
    details: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Save the form data including the selected date
    await submitComplaint({
      ComplaintID: uuid(),
      PatientName: form.name,
      Phone: form.phone,
      Department: form.dept,
      Details: form.details,
      Status: 'Pending',
      ComplaintDate: form.date,
      CreatedAt: new Date().toISOString(),
      UserID: 'Anonymous', // If we had user context we'd pass it
      ComplaintLanguage: 'AR',
      ComplaintCategory: 'General'
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 2500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <Check size={40} />
        </div>
        <h2 className="text-2xl font-bold text-[#1B2B5B]">تم تقديم الشكوى</h2>
        <p className="text-slate-500 mt-2">تم حفظ الشكوى في قاعدة البيانات للمتابعة.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4" dir="rtl">
      <div className="max-w-xl mx-auto bg-white shadow-xl rounded-2xl p-8 min-h-[80vh]">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-4">
          <Button variant="ghost" onClick={onClose} className="!p-2 rounded-full">
            <ArrowRight />
          </Button>
          <BrandLogo size="sm" />
        </div>

        <div className="flex items-center gap-3 mb-8 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
          <AlertTriangle size={32} />
          <h2 className="text-xl font-bold text-red-700">تقديم شكوى (File a Complaint)</h2>
        </div>

        <div className="space-y-5">
          <Input label="اسم المريض (Complainant Name)" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="الاسم الكامل" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="رقم الهاتف (Phone)" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="07XXXXXXXX" />
            <Input
              label="تاريخ الشكوى (Date)"
              type="date"
              value={form.date}
              onChange={(e: any) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">القسم المعني (Department)</label>
            <select className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-right" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
              <option value="">اختر القسم...</option>
              <option value="ER">الطوارئ (Emergency)</option>
              <option value="OPD">العيادات الخارجية (Outpatient)</option>
              <option value="LAB">المختبر (Laboratory)</option>
              <option value="RAD">الأشعة (Radiology)</option>
              <option value="INP">القسم الداخلي (In-Patient)</option>
              <option value="OTH">أخرى (Other)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">تفاصيل الشكوى (Details)</label>
            <textarea
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-200 focus:outline-none text-right"
              placeholder="يرجى كتابة تفاصيل الشكوى هنا..."
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="danger"
              onClick={handleSubmit}
              disabled={!form.details || !form.dept || !form.date || submitting}
              className="w-full py-3 font-bold"
            >
              {submitting ? 'جاري الحفظ...' : 'إرسال الشكوى (Submit)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from './UI';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  User as UserIcon,
  Image as ImageIcon,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Download
} from 'lucide-react';
import { IncidentReport } from '../types';

export const IncidentDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const data = await response.json();
      setIncidents(Array.isArray(data)
        ? data.map((inc: any) => ({
            ...inc,
            Name: inc.Name || 'Unknown',
            Place: inc.Place || 'Unknown',
            Note: inc.Note || '',
            Status: (inc.Status || 'Pending').toString(),
            Images: Array.isArray(inc.Images)
              ? inc.Images
              : (typeof inc.Images === 'string' && inc.Images.trim().length > 0)
                ? inc.Images.split(',').map((img: string) => img.trim()).filter((img: string) => img)
                : [],
          }))
        : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    const onIncidentUpdated = () => {
      fetchIncidents();
    };

    window.addEventListener('incident:updated', onIncidentUpdated);
    return () => window.removeEventListener('incident:updated', onIncidentUpdated);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: status })
      });
      if (response.ok) {
        setIncidents(prev => prev.map(inc => 
          inc.IncidentID === id ? { ...inc, Status: status as any } : inc
        ));
        if (selectedIncident?.IncidentID === id) {
          setSelectedIncident(prev => prev ? { ...prev, Status: status as any } : null);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/incidents/export/excel');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `incidents_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const status = (inc.Status || '').toString();
    const name = (inc.Name || '').toString();
    const place = (inc.Place || '').toString();
    const note = (inc.Note || '').toString();
    const q = searchTerm.toLowerCase();
    const matchesFilter = filter === 'all' || status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = 
      name.toLowerCase().includes(q) ||
      place.toLowerCase().includes(q) ||
      note.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  }).sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Badge variant="warning">قيد الانتظار</Badge>;
      case 'under review': return <Badge variant="info">قيد المراجعة</Badge>;
      case 'resolved': return <Badge variant="success">تم الحل</Badge>;
      case 'closed': return <Badge variant="secondary">مغلق</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle className="text-red-500" /> بلاغات الحوادث والمشاكل
          </h2>
          <p className="text-slate-500">إدارة ومتابعة البلاغات المقدمة من الموظفين</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportToExcel} className="flex items-center gap-2">
            <Download size={16} /> تصدير Excel
          </Button>
          <Button variant="secondary" onClick={fetchIncidents} className="flex items-center gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> تحديث
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List View */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="بحث في البلاغات..."
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1B2B5B] outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'under review', 'resolved', 'closed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f ? 'bg-[#1B2B5B] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? 'الكل' : 
                   f === 'pending' ? 'انتظار' : 
                   f === 'under review' ? 'مراجعة' : 
                   f === 'resolved' ? 'تم الحل' : 'مغلق'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {loading && incidents.length === 0 ? (
              <div className="text-center py-10 text-slate-400">جاري التحميل...</div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-10 text-slate-400">لا توجد بلاغات مطابقة</div>
            ) : (
              filteredIncidents.map(inc => (
                <button
                  key={inc.IncidentID}
                  onClick={() => setSelectedIncident(inc)}
                  className={`w-full text-right p-4 rounded-2xl border transition-all ${
                    selectedIncident?.IncidentID === inc.IncidentID 
                    ? 'bg-blue-50 border-[#1B2B5B] shadow-md' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-slate-400">{inc.IncidentID}</span>
                    {getStatusBadge(inc.Status)}
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1 truncate">{inc.Place}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{inc.Note}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-2">
                    <span className="flex items-center gap-1"><UserIcon size={10} /> {inc.Name}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {inc.Date}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <Card className="p-0 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="bg-[#1B2B5B] p-6 text-white">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{selectedIncident.Place}</h3>
                    <p className="text-blue-200 text-sm">معرف البلاغ: {selectedIncident.IncidentID}</p>
                  </div>
                  <div className="flex gap-2">
                    {['Under Review', 'Resolved', 'Closed'].map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedIncident.IncidentID, status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 hover:bg-white/10 ${
                          selectedIncident.Status === status ? 'bg-white/20' : ''
                        }`}
                      >
                        نقل إلى {status === 'Under Review' ? 'مراجعة' : status === 'Resolved' ? 'محلول' : 'مغلق'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">تاريخ الحادث</label>
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Calendar size={16} className="text-[#1B2B5B]" /> {selectedIncident.Date}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">المبلغ</label>
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <UserIcon size={16} className="text-[#1B2B5B]" /> {selectedIncident.Name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">المكان</label>
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <MapPin size={16} className="text-[#1B2B5B]" /> {selectedIncident.Place}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 block">الوصف / الملاحظات</label>
                  <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 leading-relaxed border border-slate-100">
                    {selectedIncident.Note}
                  </div>
                </div>

                {selectedIncident.Images && selectedIncident.Images.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 block flex items-center gap-2">
                      <ImageIcon size={16} /> الصور المرفقة ({selectedIncident.Images.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {selectedIncident.Images.map((img, idx) => (
                        <a 
                          key={idx} 
                          href={img} 
                          target="_blank" 
                          rel="noreferrer"
                          className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 hover:ring-4 hover:ring-[#1B2B5B]/10 transition-all"
                        >
                          <img src={img} alt={`Incident ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="text-white" size={24} />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t flex justify-between items-center text-xs text-slate-400">
                  <span>تم الإنشاء في: {new Date(selectedIncident.CreatedAt).toLocaleString('ar-EG')}</span>
                  {selectedIncident.UpdatedAt && (
                    <span>آخر تحديث: {new Date(selectedIncident.UpdatedAt).toLocaleString('ar-EG')}</span>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                <AlertCircle size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-400">اختر بلاغاً لعرض التفاصيل</h3>
                <p className="text-slate-400 max-w-xs">يمكنك تصفح البلاغات من القائمة الجانبية ومتابعة حالتها</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

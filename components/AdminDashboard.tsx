
import React, { useState, useEffect } from 'react';
import { fetchAnalytics } from '../services/db';
import { exportDatabase } from '../services/excel';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie
} from 'recharts';
import ReactWordcloud from '@cp949/react-wordcloud';
import { Card, Button } from './UI';
import { FileSpreadsheet, Calendar, TrendingUp, Users, Activity, MessageSquare, Tag, Maximize2, X } from 'lucide-react';

interface Props {
  onClose?: () => void;
  hideCloseButton?: boolean;
}

export const AdminDashboard: React.FC<Props> = ({ onClose, hideCloseButton }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [wordCloudView, setWordCloudView] = useState<'positive' | 'negative'>('positive');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Filters
  const [mainCategory, setMainCategory] = useState<string>('All');

  // Zoom
  const [zoomedContent, setZoomedContent] = useState<{ title: string, content: React.ReactNode } | null>(null);

  const [dates, setDates] = useState({ start: '', end: '' });

  const loadData = async (p: string, cat: string) => {
    setLoading(true);

    try {
      const now = new Date();
      // Always fetch current month data initially to allow for client-side slicing
      const m = (now.getMonth() + 1).toString().padStart(2, '0');
      const y = now.getFullYear();
      const query = `${y}-${m}`;

      const res = await fetchAnalytics(query, cat, p);
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    loadData(period, mainCategory);
  }, [period, mainCategory]);

  const handleExport = () => {
    exportDatabase();
  };

  if (loading || !data) return <div className="p-10 text-center">Loading Analytics...</div>;

  const { summary, npsBreakdown, trends, departments } = data;

  const npsData = [
    { name: 'Promoters', value: npsBreakdown.promoters, color: '#10b981' },
    { name: 'Passives', value: npsBreakdown.passives, color: '#fbbf24' },
    { name: 'Detractors', value: npsBreakdown.detractors, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-blue-600" /> لوحة البيانات (Dashboard)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {period === 'day' && 'تقرير آخر 24 ساعة'}
            {period === 'week' && 'تقرير آخر 7 أيام'}
            {period === 'month' && 'تقرير هذا الشهر'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-slate-100 p-1 rounded-lg items-center">
            <select
              value={mainCategory}
              onChange={(e) => setMainCategory(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 p-1.5 focus:outline-none cursor-pointer"
            >
              <option value="All">كل الأقسام (All)</option>
              <option value="OPD">العيادات (OPD)</option>
              <option value="Inpatient">الداخلي (Inpatient)</option>
              <option value="ED">الطوارئ (ED)</option>
              <option value="Allied Health">المساندة (Allied)</option>
            </select>
            <div className="h-4 w-px bg-slate-300 mx-2"></div>
            {['day', 'week', 'month'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${period === p ? 'bg-white text-[#1B2B5B] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {p === 'day' ? 'يومي (Day)' : p === 'week' ? 'أسبوعي (Week)' : 'شهري (Month)'}
              </button>
            ))}
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <Button onClick={() => window.open(window.location.origin + '/api/export/wide', '_blank')} className="bg-emerald-600 hover:bg-emerald-700 text-white !py-1.5">
            <FileSpreadsheet size={18} className="ml-2" />
            تصدير البيانات
          </Button>
          {!hideCloseButton && onClose && <Button variant="secondary" onClick={onClose} className="!py-1.5">إغلاق</Button>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase mb-1">إجمالي الاستجابات</h3>
              <p className="text-4xl font-bold text-slate-900">{summary.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600"><Users size={24} /></div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase mb-1">متوسط الرضا (5.0)</h3>
              <p className="text-4xl font-bold text-slate-900">{summary.satisfaction}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full text-purple-600"><TrendingUp size={24} /></div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase mb-1">NPS Score</h3>
              <p className={`text-4xl font-bold ${summary.nps > 0 ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                {summary.nps}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600"><Activity size={24} /></div>
          </div>
        </Card>
      </div>

      {/* CSAT & NLP Stats & Age Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase mb-1">CSAT Score</h3>
              <p className="text-4xl font-bold text-amber-600">{summary.csat}%</p>
              <p className="text-xs text-slate-400 mt-1">Positive Responses (4-5)</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-full text-amber-600"><TrendingUp size={24} /></div>
          </div>
        </Card>
      </div>

      {/* Age Demographics Chart */}
      <Card className="p-6 h-80 relative group">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-slate-400" />
            الفئات العمرية (Age Groups)
          </h3>
          <button onClick={() => setZoomedContent({
            title: 'الفئات العمرية (Age Groups)',
            content: (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(data.ageGroups || {}).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )
          })} className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={18} /></button>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={Object.entries(data.ageGroups || {}).map(([name, value]) => ({ name, value }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 p-6 h-96 relative group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              اتجاهات الرضا (Satisfaction Trend)
            </h3>
            <button onClick={() => setZoomedContent({
              title: 'اتجاهات الرضا (Satisfaction Trend)',
              content: (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorScoreZoom" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: '#64748b', marginBottom: '4px' }} />
                    <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScoreZoom)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              )
            })} className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={18} /></button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* NPS Pie Chart */}
        <Card className="p-6 h-96 relative group">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">تحليل NPS Breakdown</h3>
            <button onClick={() => setZoomedContent({
              title: 'تحليل NPS Breakdown',
              content: (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={npsData} innerRadius={100} outerRadius={140} paddingAngle={5} dataKey="value">
                        {npsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-5xl font-bold text-slate-700">{summary.nps}</span>
                    <span className="text-sm text-slate-400 uppercase">Score</span>
                  </div>
                </div>
              )
            })} className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={18} /></button>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={npsData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {npsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-700">{summary.nps}</span>
              <span className="text-xs text-slate-400 uppercase">Score</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-slate-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Promoters</div>
            <div className="flex items-center gap-1 text-xs text-slate-600"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Passives</div>
            <div className="flex items-center gap-1 text-xs text-slate-600"><div className="w-2 h-2 rounded-full bg-red-500"></div> Detractors</div>
          </div>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card className="p-6 h-96 relative group">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">الأداء حسب القسم (CSAT Performance)</h3>
          <button onClick={() => setZoomedContent({
            title: 'الأداء حسب القسم (CSAT Performance)',
            content: (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="csat" radius={[4, 4, 0, 0]}>
                    {departments.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.csat > 80 ? '#10b981' : entry.csat > 60 ? '#3b82f6' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          })} className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={18} /></button>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={departments}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="csat" radius={[4, 4, 0, 0]}>
              {departments.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.csat > 80 ? '#10b981' : entry.csat > 60 ? '#3b82f6' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Word Cloud & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 min-h-[450px] relative group">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="text-slate-400" />
                سحابة الكلمات (Word Cloud)
              </h3>
              <button onClick={() => {
                const cloudData = Array.isArray(data.wordCloud) ? data.wordCloud : (data.wordCloud?.[wordCloudView] || []);
                setZoomedContent({
                  title: `سحابة الكلمات (${wordCloudView === 'positive' ? 'إيجابي' : 'سلبي'})`,
                  content: (
                    <div className="w-full h-full border border-slate-100 rounded-lg bg-slate-50 relative">
                      {cloudData.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-slate-400">No data available</div> :
                        <ReactWordcloud
                          words={cloudData}
                          options={{
                            rotations: 2,
                            rotationAngles: [-90, 0],
                            fontSizes: [30, 100],
                            enableTooltip: true,
                            deterministic: true,
                            fontFamily: 'Inter',
                            colors: wordCloudView === 'positive' ? ['#059669', '#10b981', '#34d399', '#6ee7b7'] : ['#dc2626', '#ef4444', '#f87171', '#fca5a5']
                          }}
                        />
                      }
                    </div>
                  )
                });
              }} className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={18} /></button>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setWordCloudView('positive')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${wordCloudView === 'positive' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}>
                إيجابي (Positive)
              </button>
              <button
                onClick={() => setWordCloudView('negative')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${wordCloudView === 'negative' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>
                سلبي (Negative)
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full border border-slate-100 rounded-lg bg-slate-50 relative" key={wordCloudView}>
            {/* Handle legacy array or new object structure */}
            {(() => {
              const cloudData = Array.isArray(data.wordCloud) ? data.wordCloud : (data.wordCloud?.[wordCloudView] || []);
              if (cloudData.length === 0) return <div className="absolute inset-0 flex items-center justify-center text-slate-400">No data available</div>;

              return (
                <ReactWordcloud
                  words={cloudData}
                  options={{
                    rotations: 2,
                    rotationAngles: [-90, 0],
                    fontSizes: [14, 64],
                    enableTooltip: true,
                    deterministic: true,
                    fontFamily: 'Inter',
                    colors: wordCloudView === 'positive' ? ['#059669', '#10b981', '#34d399', '#6ee7b7'] : ['#dc2626', '#ef4444', '#f87171', '#fca5a5']
                  }}
                />
              );
            })()}
          </div>
        </Card>

        <Card className="p-6 h-[450px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Tag className="text-slate-400" />
            تصنيف الملاحظات (Categories) - Insights
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {data.categories && data.categories.map((c: any, i: number) => (
              <div
                key={i}
                onClick={() => setSelectedCategory(c)}
                className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 group-hover:text-blue-700">{c.name}</span>
                  <span className="text-xs text-slate-400 group-hover:text-blue-400">{c.value} تعليق مرتبط</span>
                </div>
                <Users size={16} className="text-slate-300 group-hover:text-blue-400" />
              </div>
            ))}
            {(!data.categories || data.categories.length === 0) && (
              <div className="text-center text-slate-400 py-10">No categories detected</div>
            )}
          </div>
        </Card>
      </div>

      {/* Zoom Modal */}
      {zoomedContent && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setZoomedContent(null)}>
          <div className="bg-white w-full max-w-7xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">{zoomedContent.title}</h3>
              <Button variant="ghost" onClick={() => setZoomedContent(null)}><X /></Button>
            </div>
            <div className="p-6 flex-1 bg-white relative">
              {zoomedContent.content}
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCategory(null)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">ملاحظات: {selectedCategory.name}</h3>
                <p className="text-sm text-slate-500">تم العثور على {selectedCategory.value} تعليق في هذه الفئة</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedCategory(null)}>✕</Button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {selectedCategory.comments && selectedCategory.comments.length > 0 ? (
                selectedCategory.comments.map((comment: string, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-slate-700 leading-relaxed text-right">
                    "{comment}"
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400">لا توجد تفاصيل نصية محفوظة لهذه الفئة.</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 text-center">
              <Button onClick={() => setSelectedCategory(null)} className="w-full">إغلاق</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

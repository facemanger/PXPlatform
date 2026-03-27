import React, { useEffect, useState } from 'react';
import { Card } from './UI';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import { AlertCircle, TrendingUp, CheckCircle, Clock, Brain } from 'lucide-react';

export const ComplaintAnalytics = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [predictiveTrends, setPredictiveTrends] = useState<any>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/complaints/dashboard');
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const fetchPredictiveTrends = async () => {
            try {
                const res = await fetch('/api/ai/predictive-trends');
                const json = await res.json();
                setPredictiveTrends(json.trends);
            } catch (e) {
                console.error('Failed to fetch predictive trends:', e);
            }
        };

        fetchAnalytics();
        fetchPredictiveTrends();
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500">جاري تحميل البيانات...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">فشل تحميل البيانات</div>;

    const { total, status, priority, departments, trend } = data;

    const priorityData = [
        { name: 'Critical', value: priority.Critical, color: '#dc2626' },
        { name: 'High', value: priority.High, color: '#f97316' },
        { name: 'Medium', value: priority.Medium, color: '#fbbf24' },
        { name: 'Low', value: priority.Low, color: '#3b82f6' },
    ].filter(d => d.value > 0);

    const statusData = [
        { name: 'Pending', value: status.Pending, color: '#ef4444' },
        { name: 'In Progress', value: status['In Progress'], color: '#3b82f6' },
        { name: 'Resolved', value: status.Resolved, color: '#10b981' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-blue-600" /> لوحة تحليلات الشكاوى
            </h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 border-r-4 border-r-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase">إجمالي الشكاوى</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{total}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><AlertCircle size={24} /></div>
                    </div>
                </Card>
                <Card className="p-6 border-r-4 border-r-red-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase">قيد الانتظار</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{status.Pending}</h3>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-full"><Clock size={24} /></div>
                    </div>
                </Card>
                <Card className="p-6 border-r-4 border-r-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase">تم الحل</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{status.Resolved}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-full"><CheckCircle size={24} /></div>
                    </div>
                </Card>
                <Card className="p-6 border-r-4 border-r-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase">عالية الأهمية</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{(priority.Critical || 0) + (priority.High || 0)}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><AlertCircle size={24} /></div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart */}
                <Card className="p-6 lg:col-span-2 min-h-[350px]">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">اتجاه الشكاوى (آخر 7 أيام)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={trend}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Priority Pie */}
                <Card className="p-6 min-h-[350px]">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">توزيع الأهمية</h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={priorityData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-slate-700">{total}</span>
                            <span className="text-xs text-slate-400 uppercase">Complaints</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Departments */}
                <Card className="p-6 min-h-[350px]">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">الأقسام الأكثر شكوى</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={departments} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                            <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Status Breakdown */}
                <Card className="p-6 min-h-[350px]">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">توزيع الحالات</h3>
                    <div className="flex flex-col gap-4">
                        {statusData.map((s) => (
                            <div key={s.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                                    <span className="font-medium text-slate-700">{s.name}</span>
                                </div>
                                <span className="font-bold text-slate-900">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* AI Predictive Trends */}
            {predictiveTrends && (
                <Card className="p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                        <Brain className="text-purple-600" /> التحليلات التنبؤية للشكاوى
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{predictiveTrends.nextWeekPredicted}</div>
                                <div className="text-sm text-slate-500">الشكاوى المتوقعة الأسبوع القادم</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{predictiveTrends.trendDirection === 'increasing' ? '↑' : predictiveTrends.trendDirection === 'decreasing' ? '↓' : '→'}</div>
                                <div className="text-sm text-slate-500">اتجاه الشكاوى</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{predictiveTrends.confidence}%</div>
                                <div className="text-sm text-slate-500">نسبة الثقة في التنبؤ</div>
                            </div>
                        </div>

                        {predictiveTrends.departmentPredictions && predictiveTrends.departmentPredictions.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-bold text-slate-700 mb-4">الأقسام الأكثر عرضة للشكاوى</h4>
                                <div className="space-y-2">
                                    {predictiveTrends.departmentPredictions.slice(0, 5).map((dept: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">{dept.department}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500">خطر: {dept.riskLevel}</span>
                                                <div className={`w-3 h-3 rounded-full ${
                                                    dept.riskLevel === 'high' ? 'bg-red-500' :
                                                    dept.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {predictiveTrends.insights && predictiveTrends.insights.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-bold text-slate-700 mb-4">التوصيات</h4>
                                <div className="space-y-2">
                                    {predictiveTrends.insights.map((insight: string, idx: number) => (
                                        <div key={idx} className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                                            <p className="text-sm text-blue-800">{insight}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};


import React, { useMemo } from 'react';
import { fetchLeaderboard } from '../services/db';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Card } from './UI';

export const LeaderboardWidget = () => {
  const [data, setData] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetchLeaderboard().then(setData);
  }, []);
  const currentMonthName = new Date().toLocaleString('ar-EG', { month: 'long' });

  return (
    <Card className="h-full overflow-hidden border-0 shadow-lg flex flex-col bg-white">
      <div className="bg-[#1B2B5B] text-white p-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400" />
              لوحة الصدارة (Leaderboard)
            </h3>
            <p className="text-xs text-blue-200 mt-1">الأكثر نشاطاً لشهر {currentMonthName}</p>
          </div>
          <TrendingUp className="text-blue-300 opacity-50" size={32} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Award size={32} className="mb-2 opacity-50" />
            <p className="text-sm">لا توجد بيانات لهذا الشهر</p>
          </div>
        ) : (
          data.map((user) => (
            <div key={user.name} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-sm
                ${user.rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' :
                  user.rank === 2 ? 'bg-slate-100 text-slate-600 ring-2 ring-slate-200' :
                    user.rank === 3 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' :
                      'bg-white text-slate-500 border border-slate-200'}`}>
                {user.rank <= 3 ? (
                  user.rank === 1 ? <Trophy size={14} /> : <Medal size={14} />
                ) : user.rank}
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                {/* Progress Bar visual relative to max */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${user.rank === 1 ? 'bg-yellow-400' : 'bg-[#1B2B5B]'}`}
                    style={{ width: `${(user.count / (data[0]?.count || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <span className="block text-lg font-bold text-[#1B2B5B] leading-none">{user.count}</span>
                <span className="text-[10px] text-slate-400">استبيان</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

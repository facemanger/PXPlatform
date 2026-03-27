import React, { useState, useEffect } from 'react';
import { loginUser } from './services/db';
import { User } from './types';
import { Button, Input, BrandLogo } from './components/UI';
import { SurveyRenderer } from './components/SurveyRenderer';
import { ComplaintForm } from './components/ComplaintForm';
import { AdminPanel } from './components/AdminPanel';
import { LeaderboardWidget } from './components/Leaderboard';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { ChatWindow } from './components/ChatWindow';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationToast } from './components/NotificationToast';
import { LoginReminder } from './components/LoginReminder';
import { useNotifications } from './hooks/useNotifications';
import { OfflineQueue } from './services/offlineQueue';
import { exportDatabase } from './services/excel';
import { ChatOverlay } from './components/ChatOverlay';
import { IncidentReportForm } from './components/IncidentReportForm';
import { LogOut, AlertTriangle, FileDown, ClipboardList, Database, LayoutDashboard, Shield, BarChart2, Home, MessageCircle, Eye, EyeOff, AlertCircle, Globe } from 'lucide-react';
import { DEFAULT_MAIN_MENU_ITEMS, ICONS_MAP, MainMenuItem } from './constants';
import { useTranslation } from 'react-i18next';
import './i18n';

const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('login.fillAllFields'));
      return;
    }
    setLoading(true);
    const user = await loginUser(username, password);
    setLoading(false);

    if (user) onLogin(user);
    else setError(t('login.invalidCredentials'));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border-t-8 border-[#1B2B5B]">
        <div className="flex flex-col items-center justify-center mb-10 mt-4">
          <BrandLogo size="lg" />
        </div>

        <h2 className="text-xl font-bold text-slate-700 text-center mb-6">{t('login.title')}</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label={t('login.username')}
            type="text"
            value={username}
            onChange={(e: any) => { setUsername(e.target.value); setError(''); }}
            placeholder={t('login.usernamePlaceholder')}
            autoFocus
          />
          <Input
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(e: any) => { setPassword(e.target.value); setError(''); }}
            placeholder={t('login.passwordPlaceholder')}
            error={error}
          />
          <Button className="w-full py-3 font-bold bg-[#1B2B5B] hover:bg-[#152145]" type="submit" disabled={loading}>
            {loading ? t('login.loading') : t('login.loginButton')}
          </Button>
        </form>
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs border-t border-slate-100 pt-6">
          <Database size={14} />
          <span>{t('login.footer')}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const { t, i18n } = useTranslation();
  const [isConductingSurvey, setIsConductingSurvey] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLoginReminder, setShowLoginReminder] = useState(true);
  const [toastNotification, setToastNotification] = useState<any>(null);

  const [view, setView] = useState<'home' | 'analytics'>('home');
  const [showIcons, setShowIcons] = useState(true);
  const [mainMenuItems, setMainMenuItems] = useState<MainMenuItem[]>(DEFAULT_MAIN_MENU_ITEMS);

  const {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    requestPermission
  } = useNotifications(user.UserID);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.isRead) {
        setToastNotification(latest);
      }
    }
  }, [notifications]);

  const isAdmin = user.UserGroup === 'Administrator';
  const isManager = user.UserGroup === 'Manager';
  const isUser = user.UserGroup === 'User';
  const isSuperAdmin = user.UserGroup === 'Super Admin';

  const canAccessAdminPanel = isAdmin || isManager || isSuperAdmin;
  const canSeeLeaderboard = isAdmin || isManager || isSuperAdmin;
  const canSeeAnalytics = isAdmin || isManager || isSuperAdmin;
  const canExport = isAdmin || isSuperAdmin;

  useEffect(() => {
    const sync = async () => { await OfflineQueue.sync(); };
    sync();
    const interval = setInterval(sync, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadMenuSettings = async () => {
      try {
        const res = await fetch('/api/config/menu-settings');
        const settings = await res.json();
        if (settings && typeof settings.showIcons === 'boolean') {
          setShowIcons(settings.showIcons);
        } else {
          const storedVisibility = localStorage.getItem('hospital_icon_visibility');
          if (storedVisibility !== null) setShowIcons(JSON.parse(storedVisibility));
        }
      } catch (e) {
        console.error('Failed to load menu settings from API', e);
        const storedVisibility = localStorage.getItem('hospital_icon_visibility');
        if (storedVisibility !== null) setShowIcons(JSON.parse(storedVisibility));
      }
    };
    const loadSavedMenuItems = async () => {
      try {
        const res = await fetch('/api/config/menu-items');
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items) && items.length > 0) {
            setMainMenuItems(items);
            localStorage.setItem('hospital_main_menu_items', JSON.stringify(items));
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load main menu items from API', e);
      }

      const storedMenu = localStorage.getItem('hospital_main_menu_items');
      if (storedMenu) {
        try {
          const parsed = JSON.parse(storedMenu);
          if (Array.isArray(parsed)) setMainMenuItems(parsed);
        } catch (e) {
          console.error('Failed to parse stored main menu items', e);
        }
      }
    };

    loadMenuSettings();
    loadSavedMenuItems();

  }, []);

  const handleExport = () => {
    if (confirm(t('dashboard.exportConfirm'))) {
      exportDatabase();
    }
  };

  const toggleIconVisibility = () => {
    const newVisibility = !showIcons;
    setShowIcons(newVisibility);
    localStorage.setItem('hospital_icon_visibility', JSON.stringify(newVisibility));
  };

  const handleMenuAction = (menuItem: MainMenuItem) => {
    if (!menuItem.isActive) return;
    if (menuItem.action === 'survey') setIsConductingSurvey(true);
    if (menuItem.action === 'complaint') setIsComplaintOpen(true);
    if (menuItem.action === 'incident') setIsIncidentOpen(true);
  };

  if (isConductingSurvey) return <SurveyRenderer onClose={() => setIsConductingSurvey(false)} officerName={user.Name} />;
  if (isComplaintOpen) return <ComplaintForm onClose={() => setIsComplaintOpen(false)} />;
  if (isIncidentOpen) return <IncidentReportForm onClose={() => setIsIncidentOpen(false)} userId={user.UserID} userName={user.Name} />;
  if (isAdminPanelOpen && canAccessAdminPanel) return <AdminPanel onClose={() => setIsAdminPanelOpen(false)} currentUser={user} mainMenuItems={mainMenuItems} setMainMenuItems={setMainMenuItems} />;

  return (
    <div className="min-h-screen bg-[#f8fafc]" dir="rtl">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" />
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <span className="font-bold text-sm text-slate-500 hidden sm:block pt-1">{t('dashboard.title')}</span>
          </div>
          <div className="flex items-center gap-4">
            {canSeeAnalytics && (
              <div className="hidden md:flex bg-slate-100 rounded-lg p-1 gap-1 ml-4 border border-slate-200">
                <button onClick={() => setView('home')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${view === 'home' ? 'bg-white shadow text-[#1B2B5B]' : 'text-slate-500 hover:bg-slate-200'}`}>
                  <Home size={14} /> {t('dashboard.home')}
                </button>
                <button onClick={() => setView('analytics')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${view === 'analytics' ? 'bg-white shadow text-[#1B2B5B]' : 'text-slate-500 hover:bg-slate-200'}`}>
                  <BarChart2 size={14} /> {t('dashboard.analytics')}
                </button>
              </div>
            )}

            {canAccessAdminPanel && (
              <Button onClick={() => setIsAdminPanelOpen(true)} variant="secondary" className="!py-1.5 text-xs shadow-sm text-[#1B2B5B]">
                <LayoutDashboard size={14} className="ml-2" />
                {isSuperAdmin ? t('dashboard.admin.superAdmin') : isManager ? t('dashboard.admin.manager') : t('dashboard.admin.admin')}
              </Button>
            )}

            {canExport && (
              <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white !py-1.5 text-xs shadow-sm">
                <FileDown size={14} className="ml-2" /> {t('dashboard.export')}
              </Button>
            )}

            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              connected={connected}
            />

            <button onClick={() => setIsChatOpen(true)} className="relative p-2 text-slate-600 hover:text-[#1B2B5B] hover:bg-slate-100 rounded-lg transition-all" title={t('dashboard.chat')}>
              <MessageCircle size={20} />
            </button>

            {isSuperAdmin && (
              <button onClick={toggleIconVisibility} className="relative p-2 text-slate-600 hover:text-[#1B2B5B] hover:bg-slate-100 rounded-lg transition-all" title={showIcons ? t('dashboard.hideIcons') : t('dashboard.showIcons')}>
                {showIcons ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-[#1B2B5B]">{user.Name}</span>
              <span className="text-[10px] bg-slate-100 px-2 rounded-full text-slate-500 flex items-center gap-1"><Shield size={8} /> {user.UserGroup}</span>
            </div>

            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 mr-2"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>

            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2" title={t('dashboard.logout')}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-[#1B2B5B] mb-2">{t('dashboard.welcome')} {user.Name}</h2>
            <p className="text-slate-500">{view === 'home' ? t('dashboard.homeDescription') : t('dashboard.analyticsDescription')}</p>
          </div>

          {canSeeAnalytics && (
            <div className="md:hidden flex bg-slate-100 rounded-lg p-1 gap-1 border border-slate-200">
              <button onClick={() => setView('home')} className={`p-2 rounded-md transition-all ${view === 'home' ? 'bg-white shadow text-[#1B2B5B]' : 'text-slate-500'}`}><Home size={20} /></button>
              <button onClick={() => setView('analytics')} className={`p-2 rounded-md transition-all ${view === 'analytics' ? 'bg-white shadow text-[#1B2B5B]' : 'text-slate-500'}`}><BarChart2 size={20} /></button>
            </div>
          )}
        </div>

        {view === 'analytics' && canSeeAnalytics ? (
          <DashboardAnalytics />
        ) : (
          <div className={`grid gap-8 ${canSeeLeaderboard ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
            <div className={`${canSeeLeaderboard ? 'lg:col-span-2' : ''} space-y-8`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mainMenuItems.filter(m => m.isActive).length === 0 && (
                  <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">{t('dashboard.noActiveItems')}</div>
                )}

                {mainMenuItems.filter(m => m.isActive).map(menuItem => {
                  const IconComponent = ICONS_MAP[menuItem.icon];
                  return (
                    <button key={menuItem.id} onClick={() => handleMenuAction(menuItem)} className="group relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center gap-4 h-64">
                      <div className="absolute top-0 left-0 w-full h-2 bg-[#1B2B5B] group-hover:h-4 transition-all" />
                      <div>
                        {showIcons && IconComponent && (
                          <div className="w-16 h-16 bg-slate-100 text-[#1B2B5B] rounded-full flex items-center justify-center group-hover:bg-[#1B2B5B] group-hover:text-white transition-colors duration-300">
                            <IconComponent size={32} />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#1B2B5B] transition-colors">{i18n.language === 'ar' ? menuItem.titleAr : menuItem.titleEn}</h3>
                          <p className="text-slate-400 mt-2 text-sm px-4">{i18n.language === 'ar' ? menuItem.descriptionAr : menuItem.descriptionEn}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isUser && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center"><p className="text-blue-800 font-medium">{t('dashboard.userMessage')}</p></div>
              )}
            </div>

            {canSeeLeaderboard && (
              <div className="h-full min-h-[500px]"><LeaderboardWidget /></div>
            )}
          </div>
        )}
      </main>

      {isChatOpen && <ChatWindow currentUserId={user.UserID} onClose={() => setIsChatOpen(false)} />}
      <ChatOverlay currentUserId={user.UserID} />
      {toastNotification && <NotificationToast notification={toastNotification} onClose={() => setToastNotification(null)} />}
      {showLoginReminder && <LoginReminder userId={user.UserID} onClose={() => setShowLoginReminder(false)} />}
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('hospital_user_session');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse stored user session');
        localStorage.removeItem('hospital_user_session');
      }
    }
  }, []);

  const handleLogin = (newUser: User) => {
    localStorage.setItem('hospital_user_session', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('hospital_user_session');
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
};

export default App;

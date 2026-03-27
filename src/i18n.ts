import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Login
      loginTitle: 'Login to the System',
      username: 'Username',
      password: 'Password',
      loginButton: 'Login',
      loginLoading: 'Verifying...',
      loginError: 'Invalid credentials',
      loginRequired: 'Please enter username and password',
      developedBy: 'Developed by Amin Mukhtar',

      // Dashboard
      welcome: 'Welcome, {{name}}',
      mainDashboard: 'Main Control Panel',
      reportsAnalytics: 'Reports and Analytics',
      home: 'Home',
      analytics: 'Analytics',
      superAdminPanel: 'Super Admin Panel',
      managerPanel: 'Manager Panel',
      controlPanel: 'Control Panel',
      exportData: 'Export Data',
      exportConfirm: 'Do you want to download the complete database (Excel)?',
      patientExperience: 'Patient Experience',
      logout: 'Logout',
      userGroup: 'User Group',
      noAccess: 'You do not have access to reports or leaderboard.',

      // Menu Items
      conductSurvey: 'Conduct Survey',
      conductSurveyDesc: 'Evaluate patient experience in various departments',
      submitComplaint: 'Submit Complaint',
      submitComplaintDesc: 'Register a patient complaint for follow-up',
      reportIncident: 'Report Incident',
      reportIncidentDesc: 'Report an incident or technical/administrative problem',

      // Admin Panel
      systemSettings: 'System Settings',
      manageDepartments: 'Manage Departments',
      manageQuestions: 'Manage Questions',
      mainMenu: 'Main Menu',
      iconSettings: 'Icon Settings',
      showHideIcons: 'Show or hide icons from main page cards',
      enabled: 'Enabled',
      disabled: 'Disabled',
      hideIcons: 'Hide Icons',
      showIcons: 'Show Icons',
      menuItems: 'Menu Items',
      noMenuItems: 'No items in the main menu. Please set them up in the main menu settings page.',
      active: 'Active',
      inactive: 'Inactive',

      // Other
      conversations: 'Conversations',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      add: 'Add',
      edit: 'Edit',
      close: 'Close',
    },
  },
  ar: {
    translation: {
      // Login
      loginTitle: 'تسجيل الدخول للنظام',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      loginButton: 'تسجيل الدخول',
      loginLoading: 'جاري التحقق...',
      loginError: 'بيانات الاعتماد غير صالحة',
      loginRequired: 'الرجاء إدخال اسم المستخدم وكلمة المرور',
      developedBy: 'تم تطوير البرنامج بواسطة أمين مختار',

      // Dashboard
      welcome: 'مرحباً بك، {{name}}',
      mainDashboard: 'لوحة التحكم الرئيسية',
      reportsAnalytics: 'التقارير والتحليلات',
      home: 'الرئيسية',
      analytics: 'التحليلات',
      superAdminPanel: 'لوحة السوبر أدمن',
      managerPanel: 'لوحة المشرفين',
      controlPanel: 'لوحة التحكم',
      exportData: 'تصدير البيانات',
      exportConfirm: 'هل تريد تنزيل قاعدة البيانات الكاملة (Excel)؟',
      patientExperience: 'تجربة المريض',
      logout: 'تسجيل خروج',
      userGroup: 'المجموعة',
      noAccess: 'ليس لديك صلاحية الوصول إلى التقارير أو لوحة الصدارة.',

      // Menu Items
      conductSurvey: 'إجراء استبيان',
      conductSurveyDesc: 'تقييم تجربة المريض في الأقسام المختلفة',
      submitComplaint: 'تقديم شكوى',
      submitComplaintDesc: 'تسجيل شكوى مريض للمتابعة',
      reportIncident: 'إبلاغ عن مشكلة',
      reportIncidentDesc: 'بلاغ عن حادث أو مشكلة فنية/إدارية',

      // Admin Panel
      systemSettings: 'إعدادات النظام',
      manageDepartments: 'إدارة الأقسام',
      manageQuestions: 'إدارة الأسئلة',
      mainMenu: 'القائمة الرئيسية',
      iconSettings: 'إعدادات الأيقونات',
      showHideIcons: 'إظهار أو إخفاء الأيقونات من بطاقات الصفحة الرئيسية',
      enabled: 'مفعلة',
      disabled: 'معطلة',
      hideIcons: 'إخفاء الأيقونات',
      showIcons: 'إظهار الأيقونات',
      menuItems: 'عناصر القائمة',
      noMenuItems: 'لا توجد عناصر في القائمة الرئيسية. الرجاء تمكين العناصر من صفحة إعدادات القائمة الرئيسية.',
      active: 'مفعّل',
      inactive: 'معطل',

      // Other
      conversations: 'المحادثات',
      confirm: 'تأكيد',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      add: 'إضافة',
      edit: 'تعديل',
      close: 'إغلاق',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
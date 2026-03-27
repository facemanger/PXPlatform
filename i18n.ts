import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      login: {
        title: 'Hospital Patient Experience Platform',
        username: 'Username',
        usernamePlaceholder: 'Enter username',
        password: 'Password',
        passwordPlaceholder: 'Enter password',
        loginButton: 'Login',
        loading: 'Logging in...',
        fillAllFields: 'Please fill in all fields',
        invalidCredentials: 'Invalid username or password',
        footer: 'Powered by Hospital Management System'
      },
      dashboard: {
        title: 'Dashboard',
        home: 'Home',
        analytics: 'Analytics',
        admin: {
          superAdmin: 'Super Admin Panel',
          manager: 'Manager Panel',
          admin: 'Admin Panel'
        },
        export: 'Export Data',
        exportConfirm: 'Are you sure you want to export all data (Excel)?',
        chat: 'Chat',
        hideIcons: 'Hide Icons',
        showIcons: 'Show Icons',
        logout: 'Logout',
        welcome: 'Welcome',
        homeDescription: 'Access main platform features',
        analyticsDescription: 'View detailed analytics and reports',
        noActiveItems: 'No active menu items available. Please contact administrator to enable menu items in settings.',
        userMessage: 'Your feedback helps us improve our services. Thank you for your participation.'
      },
      admin: {
        managerView: 'Manager Panel',
        adminPanel: 'Admin Control Panel',
        exit: 'Exit',
        settings: {
          title: 'System Settings',
          subtitle: 'Manage departments and surveys',
          departments: 'Departments',
          questions: 'Questions',
          menu: 'Main Menu',
          icons: {
            title: 'Icon Settings',
            subtitle: 'Show or hide icons from main page cards',
            enabled: 'Enabled',
            disabled: 'Disabled'
          },
          menuItems: {
            title: 'Main Menu Items',
            empty: 'No items in the main menu. Please set them up on the main page.',
            enabled: 'Enabled',
            disabled: 'Disabled'
          }
        }
      }
    }
  },
  ar: {
    translation: {
      login: {
        title: 'منصة تجربة المريض في المستشفى',
        username: 'اسم المستخدم',
        usernamePlaceholder: 'أدخل اسم المستخدم',
        password: 'كلمة المرور',
        passwordPlaceholder: 'أدخل كلمة المرور',
        loginButton: 'تسجيل الدخول',
        loading: 'جاري تسجيل الدخول...',
        fillAllFields: 'يرجى ملء جميع الحقول',
        invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        footer: 'مدعوم من نظام إدارة المستشفى'
      },
      dashboard: {
        title: 'لوحة التحكم',
        home: 'الرئيسية',
        analytics: 'التحليلات',
        admin: {
          superAdmin: 'لوحة المدير العام',
          manager: 'لوحة المدير',
          admin: 'لوحة الإدارة'
        },
        export: 'تصدير البيانات',
        exportConfirm: 'هل أنت متأكد من أنك تريد تصدير جميع البيانات (Excel)؟',
        chat: 'الدردشة',
        hideIcons: 'إخفاء الأيقونات',
        showIcons: 'إظهار الأيقونات',
        logout: 'تسجيل الخروج',
        welcome: 'مرحباً',
        homeDescription: 'الوصول إلى الميزات الرئيسية للمنصة',
        analyticsDescription: 'عرض التحليلات والتقارير التفصيلية',
        noActiveItems: 'لا توجد عناصر قائمة نشطة متاحة. يرجى الاتصال بالمسؤول لتفعيل عناصر القائمة في الإعدادات.',
        userMessage: 'ملاحظاتك تساعدنا في تحسين خدماتنا. شكراً لمشاركتك.'
      },
      admin: {
        managerView: 'لوحة المشرفين (Manager View)',
        adminPanel: 'لوحة تحكم المسؤول (Admin Panel)',
        exit: 'خروج',
        settings: {
          title: 'إعدادات النظام',
          subtitle: 'إدارة الأقسام والاستبيانات',
          departments: 'الأقسام',
          questions: 'الأسئلة',
          menu: 'القائمة الرئيسية',
          icons: {
            title: 'إعدادات الأيقونات',
            subtitle: 'إظهار أو إخفاء الأيقونات من بطاقات الصفحة الرئيسية',
            enabled: 'مفعلة',
            disabled: 'معطلة'
          },
          menuItems: {
            title: 'عناصر القائمة الرئيسية',
            empty: 'لا توجد عناصر في القائمة الرئيسية. الرجاء إعدادها في الصفحة الرئيسية.',
            enabled: 'مفعّل',
            disabled: 'معطل'
          }
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
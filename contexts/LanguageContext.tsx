import React, { createContext, useContext, useState, useEffect } from 'react';

// Language context
const LanguageContext = createContext<{
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}>({
  language: 'ar',
  setLanguage: () => {},
  t: () => '',
  dir: 'rtl'
});

// Translations
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.complaints': 'Complaints',
    'nav.incidents': 'Incidents',
    'nav.surveys': 'Surveys',
    'nav.messages': 'Messages',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Incident Management
    'incidents.title': 'Incident Reports',
    'incidents.subtitle': 'Manage and track incident reports',
    'incidents.export': 'Export Excel',
    'incidents.refresh': 'Refresh',
    'incidents.search': 'Search incidents...',
    'incidents.filter.all': 'All',
    'incidents.filter.pending': 'Pending',
    'incidents.filter.review': 'Under Review',
    'incidents.filter.resolved': 'Resolved',
    'incidents.filter.closed': 'Closed',
    'incidents.select': 'Select incident to view details',
    'incidents.noIncidents': 'No incidents available',
    
    // Incident Form
    'incident.report': 'Report Incident',
    'incident.name': 'Your Name',
    'incident.place': 'Place',
    'incident.place.ward': 'Ward',
    'incident.place.clinic': 'Clinic',
    'incident.place.general': 'General',
    'incident.place.other': 'Other',
    'incident.note': 'Description',
    'incident.date': 'Date',
    'incident.attachImages': 'Attach Images',
    'incident.submit': 'Submit Report',
    'incident.success': 'Report Submitted Successfully',
    'incident.successMessage': 'Thank you for your report. We will investigate and get back to you if needed.',
    
    // Status
    'status.pending': 'Pending',
    'status.review': 'Under Review',
    'status.resolved': 'Resolved',
    'status.closed': 'Closed',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.refresh': 'Refresh',
    
    // Place Types
    'place.ward': 'Ward',
    'place.clinic': 'Clinic',
    'place.general': 'General Area',
    
    // Incident Details
    'incident.details': 'Incident Details',
    'incident.id': 'Incident ID',
    'incident.date': 'Date',
    'incident.reporter': 'Reported By',
    'incident.place': 'Place',
    'incident.description': 'Description',
    'incident.images': 'Attached Images',
    'incident.createdAt': 'Created At',
    'incident.updatedAt': 'Last Updated',
    'incident.updateStatus': 'Update Status',
    'incident.moveToReview': 'Move to Review',
    'incident.moveToResolved': 'Move to Resolved',
    'incident.moveToClosed': 'Move to Closed'
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.complaints': 'الشكاوى',
    'nav.incidents': 'البلاغات',
    'nav.surveys': 'الاستبيانات',
    'nav.messages': 'الرسائل',
    'nav.reports': 'التقارير',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    
    // Incident Management
    'incidents.title': 'بلاغات الحوادث والمشاكل',
    'incidents.subtitle': 'إدارة ومتابعة البلاغات المقدمة من الموظفين',
    'incidents.export': 'تصدير Excel',
    'incidents.refresh': 'تحديث',
    'incidents.search': 'بحث في البلاغات...',
    'incidents.filter.all': 'الكل',
    'incidents.filter.pending': 'قيد الانتظار',
    'incidents.filter.review': 'قيد المراجعة',
    'incidents.filter.resolved': 'تم الحل',
    'incidents.filter.closed': 'مغلق',
    'incidents.select': 'اختر بلاغاً لعرض التفاصيل',
    'incidents.noIncidents': 'لا توجد بلاغات متاحة',
    
    // Incident Form
    'incident.report': 'إبلاغ عن حدث',
    'incident.name': 'اسمك',
    'incident.place': 'المكان',
    'incident.place.ward': 'قسم',
    'incident.place.clinic': 'عيادة',
    'incident.place.general': 'عام',
    'incident.place.other': 'أخرى',
    'incident.note': 'الوصف',
    'incident.date': 'التاريخ',
    'incident.attachImages': 'إرفاق صور',
    'incident.submit': 'إرسال البلاغ',
    'incident.success': 'تم إرسال البلاغ بنجاح',
    'incident.successMessage': 'شكراً لك على بلاغك. سنقوم بالتحقيق والرد عليك إذا لزم الأمر.',
    
    // Status
    'status.pending': 'قيد الانتظار',
    'status.review': 'قيد المراجعة',
    'status.resolved': 'تم الحل',
    'status.closed': 'مغلق',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.close': 'إغلاق',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.refresh': 'تحديث',
    
    // Place Types
    'place.ward': 'قسم',
    'place.clinic': 'عيادة',
    'place.general': 'منطقة عامة',
    
    // Incident Details
    'incident.details': 'تفاصيل البلاغ',
    'incident.id': 'معرف البلاغ',
    'incident.date': 'تاريخ الحادث',
    'incident.reporter': 'المبلغ',
    'incident.place': 'المكان',
    'incident.description': 'الوصف / الملاحظات',
    'incident.images': 'الصور المرفقة',
    'incident.createdAt': 'تم الإنشاء في',
    'incident.updatedAt': 'آخر تحديث',
    'incident.updateStatus': 'تحديث الحالة',
    'incident.moveToReview': 'نقل إلى مراجعة',
    'incident.moveToResolved': 'نقل إلى محلول',
    'incident.moveToClosed': 'نقل إلى مغلق'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('language') as 'en' | 'ar';
    if (saved && (saved === 'en' || saved === 'ar')) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: 'en' | 'ar') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

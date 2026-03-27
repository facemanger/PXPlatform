
import { 
  LogOut, 
  Activity, 
  Stethoscope, 
  TestTube, 
  Scan, 
  Bed, 
  Ambulance, 
  ClipboardList, 
  AlertTriangle,
  BarChart3,
  Home,
  AlertCircle
} from 'lucide-react';

// Re-export Lists
export * from './surveys/lists';

// Re-export Surveys
export { POST_DISCHARGE_SURVEY } from './surveys/post-discharge';
export { PHYSIO_SURVEY } from './surveys/physiotherapy';
export { OUTPATIENT_SURVEY } from './surveys/outpatient';
export { IMAGING_SURVEY } from './surveys/radiology';
export { LAB_SURVEY } from './surveys/laboratory';
export { INPATIENT_SURVEY } from './surveys/inpatient';
export { EMERGENCY_SURVEY } from './surveys/emergency';

import { POST_DISCHARGE_SURVEY } from './surveys/post-discharge';
import { PHYSIO_SURVEY } from './surveys/physiotherapy';
import { OUTPATIENT_SURVEY } from './surveys/outpatient';
import { IMAGING_SURVEY } from './surveys/radiology';
import { LAB_SURVEY } from './surveys/laboratory';
import { INPATIENT_SURVEY } from './surveys/inpatient';
import { EMERGENCY_SURVEY } from './surveys/emergency';

export const ALL_SURVEYS = [
  POST_DISCHARGE_SURVEY,
  PHYSIO_SURVEY,
  OUTPATIENT_SURVEY,
  IMAGING_SURVEY,
  LAB_SURVEY,
  INPATIENT_SURVEY,
  EMERGENCY_SURVEY
];

export const ICONS_MAP: Record<string, any> = {
  LogOut, Activity, Stethoscope, TestTube, Scan, Bed, Ambulance, ClipboardList, AlertTriangle, BarChart3, Home, AlertCircle
};

export interface MainMenuItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: keyof typeof ICONS_MAP;
  action: 'survey' | 'complaint' | 'incident';
  isActive: boolean;
}

export const DEFAULT_MAIN_MENU_ITEMS: MainMenuItem[] = [
  {
    id: 'conduct_survey',
    titleAr: 'إجراء استبيان',
    titleEn: 'Conduct Survey',
    descriptionAr: 'تقييم تجربة المريض في الأقسام المختلفة',
    descriptionEn: 'Evaluate patient experience in different departments',
    icon: 'ClipboardList',
    action: 'survey',
    isActive: true,
  },
  {
    id: 'submit_complaint',
    titleAr: 'تقديم شكوى',
    titleEn: 'Submit Complaint',
    descriptionAr: 'تسجيل شكوى مريض للمتابعة',
    descriptionEn: 'Record a patient complaint for follow-up',
    icon: 'AlertTriangle',
    action: 'complaint',
    isActive: true,
  },
  {
    id: 'report_incident',
    titleAr: 'إبلاغ عن حدث',
    titleEn: 'Report Incident',
    descriptionAr: 'بلاغ عن حادث أو مشكلة فنية/إدارية',
    descriptionEn: 'Report an incident or technical/administrative issue',
    icon: 'AlertCircle',
    action: 'incident',
    isActive: true,
  },
];

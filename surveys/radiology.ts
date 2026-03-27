
import { SurveyConfig, QuestionType } from '../types';
import { WAITING_TIME_OPTS_A } from './lists';

export const IMAGING_SURVEY: SurveyConfig = {
  id: 'medical-imaging',
  title: 'الأشعة والتصوير (Radiology)',
  icon: 'Scan',
  color: 'bg-indigo-500',
  questions: [
    { id: 'wait_time', textEn: 'ما المدة التي انتظرتها قبل اجراء الخدمة', type: QuestionType.RADIO, options: WAITING_TIME_OPTS_A, category: 'Access' },
    { id: 'q1', textEn: 'بشكل عام ما مستوى رضاءك عن الخدمة المقدمة بقسم التصوير الطبى؟', type: QuestionType.SCALE, category: 'General' },
    { id: 'q2', textEn: 'نظافة قسم التصوير الطبى بشكل عام', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q3', textEn: 'التعاون وتقديم المساعدة والرد علي الاستفسارات من موظف الاستقبال', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q5', textEn: 'الإبلاغ بالتحضيرات المطلوبه للفحوصات بشكل واضح', type: QuestionType.SCALE, category: 'Process' },
    { id: 'q6', textEn: 'التعامل من قبل طاقم التصوير الطبى', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q7', textEn: 'مراعاة المختص خصوصية المريض اثناء اجراء التصوير', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q8', textEn: 'تسليم تقارير التصوير الطبى المطلوبة فى موعدها', type: QuestionType.SCALE, category: 'Process' },
    { id: 'q9', textEn: 'توافر جميع انواع الفحوصات المطلوبة', type: QuestionType.SCALE, category: 'Service' },
    { id: 'q10', textEn: 'تعامل التمريض والمظهر العام', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q11', textEn: 'تحضير المريض للدخول الي التصوير الطبى', type: QuestionType.SCALE, category: 'Care' },
    { id: 'nps', textEn: 'ما مدى احتمالية ان توصي بالمستشفى لعائلتك واصدقائك؟', type: QuestionType.NPS, category: 'NPS' },
    { id: 'feedback_pos', textEn: 'ما أكثر ما أعجبك في الخدمة؟', type: QuestionType.TEXT, category: 'Feedback' },
    { id: 'feedback_neg', textEn: 'ما األمور التي ترى أنه يمكن تحسينها؟', type: QuestionType.TEXT, category: 'Feedback' }
  ]
};

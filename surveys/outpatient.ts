
import { SurveyConfig, QuestionType } from '../types';
import { WAITING_TIME_OPTS_A } from './lists';

export const OUTPATIENT_SURVEY: SurveyConfig = {
  id: 'outpatient',
  title: 'العيادات الخارجية (Outpatient)',
  icon: 'Stethoscope',
  color: 'bg-teal-500',
  questions: [
    { id: 'wait_time', textEn: 'المدة التي انتظرتها بالاستشارية قبل مقابلة الطبيب', type: QuestionType.RADIO, options: WAITING_TIME_OPTS_A, category: 'Access' },
    { id: 'q1', textEn: 'بشكل عام ما هو مستوى رضاءك عن الخدمة المقدمة بوحدة الاستشارية', type: QuestionType.SCALE, category: 'General' },
    { id: 'q2', textEn: 'التنظيم والنظافة داخل الاستشارية', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q3', textEn: 'تقييمك لفعالية اجراءات الحجز', type: QuestionType.SCALE, category: 'Process' },
    { id: 'q4', textEn: 'التعاون وتقديم المساعدة من موظف الاستقبال', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q5', textEn: 'تقييمك للطبيب (سماع الشكوى، شرح الحالة، الاجابة عن الاستفسارات)', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q6', textEn: 'حسن المظهر والتعامل الجيد لطاقم التمريض', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q7', textEn: 'سرعة وكفاءة طاقم التمريض والتزامهم بالخطوات المطلوبة', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'nps', textEn: 'ما مدى احتمالية ان توصي بالمستشفى لعائلتك واصدقائك؟', type: QuestionType.NPS, category: 'NPS' },
    { id: 'feedback_pos', textEn: 'ما أكثر ما أعجبك في الخدمة؟', type: QuestionType.TEXT, category: 'Feedback' },
    { id: 'feedback_neg', textEn: 'ما األمور التي ترى أنه يمكن تحسينها؟', type: QuestionType.TEXT, category: 'Feedback' }
  ]
};

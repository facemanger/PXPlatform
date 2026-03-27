
import { SurveyConfig, QuestionType } from '../types';
import { WAITING_TIME_OPTS_A } from './lists';

export const LAB_SURVEY: SurveyConfig = {
  id: 'laboratory',
  title: 'المختبر (Laboratory)',
  icon: 'TestTube',
  color: 'bg-purple-500',
  questions: [
    { id: 'wait_time', textEn: 'ما هي مدة الانتظار التي قضيتها بالمختبر', type: QuestionType.RADIO, options: WAITING_TIME_OPTS_A, category: 'Access' },
    { id: 'q1', textEn: 'بشكل عام ما مستوى رضاءك عن الخدمة المقدمة بالمختبر؟', type: QuestionType.SCALE, category: 'General' },
    { id: 'q2', textEn: 'نظافة قسم المختبر بشكل عام', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q3', textEn: 'التعاون وتقديم المساعدة واجابة الاستفسارات من موظف الاستقبال', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q4', textEn: 'الإبلاغ بالتحضيرات المطلوبه للفحوصات بشكل واضح', type: QuestionType.SCALE, category: 'Process' },
    { id: 'q5', textEn: 'كفاءة سحب العينات', type: QuestionType.SCALE, category: 'Process' },
    { id: 'q6', textEn: 'التعامل من قبل طاقم المختبر', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q7', textEn: 'الدقة وتسليم النتائج في موعدها', type: QuestionType.SCALE, category: 'Service' },
    { id: 'nps', textEn: 'ما مدى احتمالية ان توصي بالمستشفى لعائلتك واصدقائك؟', type: QuestionType.NPS, category: 'NPS' },
    { id: 'feedback_pos', textEn: 'ما أكثر ما أعجبك في الخدمة؟', type: QuestionType.TEXT, category: 'Feedback' },
    { id: 'feedback_neg', textEn: 'ما األمور التي ترى أنه يمكن تحسينها؟', type: QuestionType.TEXT, category: 'Feedback' }
  ]
};


import { SurveyConfig, QuestionType } from '../types';
import { WAITING_TIME_OPTS_A } from './lists';

export const EMERGENCY_SURVEY: SurveyConfig = {
  id: 'emergency',
  title: 'الطوارئ (Emergency)',
  icon: 'Ambulance',
  color: 'bg-red-500',
  questions: [
    { id: 'wait_time', textEn: 'ما المدة التي انتظرتها لتلقي الخدمة الطبية؟', type: QuestionType.RADIO, options: WAITING_TIME_OPTS_A, category: 'Access' },
    { id: 'q1', textEn: 'بشكل عام ماهو مستوى رضاءك عن الخدمة المقدمة بوحدة الطوارىء', type: QuestionType.SCALE, category: 'General' },
    { id: 'q2', textEn: 'التنظيم والنظافة داخل وحدة الطوارئ', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q3', textEn: 'استقبال موظف الاستقبال', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q4', textEn: 'تقييمك لطبيب الطوارىء (سماع الشكوى، شرح الحالة، الاجابة عن الاستفسارات)', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q5', textEn: 'سرعة استدعاء اطباء في اي تخصص اخر', type: QuestionType.SCALE, category: 'Process' },
    { id: 'q6', textEn: 'سرعة تقديم الخدمة الطبية', type: QuestionType.SCALE, category: 'Process' },
    { id: 'q7', textEn: 'حسن المظهر والتعامل الجيد لطاقم التمريض', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q8', textEn: 'سرعة وكفاءة طاقم التمريض والتزامهم بالخطوات المطلوبة', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'nps', textEn: 'ما مدى احتمالية ان توصي بالمستشفى لعائلتك واصدقائك؟', type: QuestionType.NPS, category: 'NPS' },
    { id: 'feedback_pos', textEn: 'ما أكثر ما أعجبك في الخدمة؟', type: QuestionType.TEXT, category: 'Feedback' },
    { id: 'feedback_neg', textEn: 'ما األمور التي ترى أنه يمكن تحسينها؟', type: QuestionType.TEXT, category: 'Feedback' }
  ]
};

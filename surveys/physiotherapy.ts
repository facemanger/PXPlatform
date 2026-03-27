
import { SurveyConfig, QuestionType } from '../types';
import { WAITING_TIME_OPTS_A } from './lists';

export const PHYSIO_SURVEY: SurveyConfig = {
  id: 'physiotherapy',
  title: 'العلاج الطبيعي (Physiotherapy)',
  icon: 'Activity',
  color: 'bg-emerald-500',
  questions: [
    { id: 'wait_time', textEn: 'مدة الانتظار قبل بدء الجلسة', type: QuestionType.RADIO, options: WAITING_TIME_OPTS_A, category: 'Access' },
    { id: 'q1', textEn: 'رضاك العام عن خدمات العلاج الفيزيائي', type: QuestionType.SCALE, category: 'General' },
    { id: 'q2', textEn: 'سهولة الوصول إلى وحدة العلاج الفيزيائي', type: QuestionType.SCALE, category: 'Access' },
    { id: 'q3', textEn: 'وضوح آلية الاستقبال والتوجيه داخل القسم', type: QuestionType.SCALE, category: 'Process' },
    { id: 'q4', textEn: 'تعامل الكادر الطبي واإلداري باحترام ومهنية', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q5', textEn: 'نظافة القسم وتجهيزاته', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q6', textEn: 'كفاءة المعالجين الفيزيائيين واهتمامهم بالحالة', type: QuestionType.SCALE, category: 'Staff' },
    { id: 'q7', textEn: 'وضوح الخطة العلاجية والتعليمات المقدمة', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q8', textEn: 'جودة الأجهزة والمعدات المستخدمة في الجلسة', type: QuestionType.SCALE, category: 'Equipment' },
    { id: 'q9', textEn: 'تحسن حالتك بعد الجلسات العلاجية', type: QuestionType.SCALE, category: 'Outcome' },
    { id: 'nps', textEn: 'ما مدى احتمالية ان توصي بالمستشفى لعائلتك واصدقائك؟', type: QuestionType.NPS, category: 'NPS' },
    { id: 'feedback_pos', textEn: 'ما أكثر ما أعجبك في الخدمة؟', type: QuestionType.TEXT, category: 'Feedback' },
    { id: 'feedback_neg', textEn: 'ما األمور التي ترى أنه يمكن تحسينها؟', type: QuestionType.TEXT, category: 'Feedback' }
  ]
};

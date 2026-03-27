
import { SurveyConfig, QuestionType } from '../types';

export const INPATIENT_SURVEY: SurveyConfig = {
  id: 'inpatient',
  title: 'القسم الداخلي (In-Patient)',
  icon: 'Bed',
  color: 'bg-cyan-600',
  questions: [
    { id: 'q1', textEn: 'بشكل عام ما مستوى رضاءك عن الخدمة المقدمة بالمستشفى؟', type: QuestionType.SCALE, category: 'General' },
    { id: 'q2', textEn: 'سهولة وسرعة اجراءات الدخول', type: QuestionType.SCALE, category: 'Admission' },
    { id: 'q3', textEn: 'هل شرح لك الأطباء حالتك الصحية بطريقة واضحة ومفهومة؟', type: QuestionType.SCALE, category: 'Care Team' },
    { id: 'q4', textEn: 'هل أظهر الأطباء احتراماً واهتماماً لأسئلتك واستفساراتك؟', type: QuestionType.SCALE, category: 'Care Team' },
    { id: 'q5', textEn: 'هل أظهر لك فريق التمريض الاحترام واللطف والاهتمام؟', type: QuestionType.SCALE, category: 'Care Team' },
    { id: 'q6', textEn: 'هل كان طاقم التمريض مهتماً وملبياً لاحتياجاتك بسرعة؟', type: QuestionType.SCALE, category: 'Care Team' },
    { id: 'q7', textEn: 'هل تم شرح دواعي استخدام جميع الأدوية الجديدة قبل إعطائك إياها؟', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q8', textEn: 'خلال اقامتك بالمستشفى هل تم السيطرة على الألم؟', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q9', textEn: 'هل كانت غرفتك نظيفة طوال فترة إقامتك؟', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q10a', textEn: 'هل كانت المنطقة المحيطة بغرفتك هادئة في الليل؟', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q10b', textEn: 'هل كان الطعام المقدم طازجاً وذي مذاق جيد؟', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q11', textEn: 'هل يوجد أي شيء في الغرفة يحتاج إلى صيانة أو إصلاح؟', type: QuestionType.BOOLEAN, category: 'Environment' },
    { id: 'nps', textEn: 'ما مدى احتمالية ان توصي بالمستشفى لعائلتك واصدقائك؟', type: QuestionType.NPS, category: 'NPS' },
    { id: 'feedback_pos', textEn: 'ما أكثر ما أعجبك في الخدمة؟', type: QuestionType.TEXT, category: 'Feedback' },
    { id: 'feedback_neg', textEn: 'ما األمور التي ترى أنه يمكن تحسينها؟', type: QuestionType.TEXT, category: 'Feedback' }
  ]
};

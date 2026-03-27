
import { SurveyConfig, QuestionType } from '../types';

export const POST_DISCHARGE_SURVEY: SurveyConfig = {
  id: 'post-discharge',
  title: 'استبيان ما بعد الخروج (Post Discharge)',
  icon: 'LogOut',
  color: 'bg-blue-500',
  questions: [
    { id: 'q1', textEn: 'بشكل عام ما مستوى رضاءك عن الخدمة المقدمة بالمستشفى؟', type: QuestionType.SCALE, category: 'General' },
    { id: 'q2', textEn: 'سهولة و سرعة اجراءات الدخول', type: QuestionType.SCALE, category: 'Admission' },
    { id: 'q3', textEn: 'تعامل موظفى مكتب الدخول بلباقة و احترام', type: QuestionType.SCALE, category: 'Admission' },
    { id: 'q4', textEn: 'سهولة اجراءات الخروج', type: QuestionType.SCALE, category: 'Admission' },
    { id: 'q5', textEn: 'هل شرح لك األطباء حالتك الصحية بطريقة واضحة ومفهومة؟', type: QuestionType.SCALE, category: 'Care Team' },
    { id: 'q6', textEn: 'هل أظهر األطباء احتراماً واهتماماً ألسئلتك واستفساراتك؟', type: QuestionType.SCALE, category: 'Care Team' },
    { id: 'q7', textEn: 'هل أظهر لك فريق التمريض االحترام واللطف و االهتمام؟', type: QuestionType.SCALE, category: 'Care Team' },
    { id: 'q8', textEn: 'هل كان طاقم التمريض مهتماً وملبياً لاحتياجاتك بسرعة؟', type: QuestionType.SCALE, category: 'Care Team' },
    { id: 'q9', textEn: 'هل تم شرح دواعي استخدام جميع األدوية الجديدة قبل إعطائك إياها؟', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q10', textEn: 'بعد الضغط على جرس االستدعاء، هل حصلت على المساعدة بالسرعة التي أردتها؟', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q11', textEn: 'خلال اقامتك بالمستشفى هل تم السيطرة على الألم؟', type: QuestionType.SCALE, category: 'Care' },
    { id: 'q12', textEn: 'هل تم شرح جميع التعليمات الطبية المتعلقة بالرعاية في المنزل بعد الخروج؟', type: QuestionType.SCALE, category: 'Discharge' },
    { id: 'q13', textEn: 'هل تحدث معك فريق المستشفى حول ما إذا كنت ستحصل على المساعدة التي تحتاجها في المنزل؟', type: QuestionType.SCALE, category: 'Discharge' },
    { id: 'q14', textEn: 'هل كانت غرفتك نظيفة طوال فترة إقامتك؟', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q15', textEn: 'هل كانت المنطقة المحيطة بغرفتك هادئة في الليل؟', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q16', textEn: 'هل كان الطعام المقدم طازجاً وذي مذاق جيد؟', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'q17', textEn: 'هل كانت تجهيزات الغرفة (مثل التكييف والسرير ودورات المياه) مناسبة؟', type: QuestionType.SCALE, category: 'Environment' },
    { id: 'nps', textEn: 'بناءً على تجربتك االخيرة، ما مدى احتمالية ان توصي بالمستشفى لعائلتك واصدقائك؟', type: QuestionType.NPS, category: 'NPS' },
    { id: 'feedback_pos', textEn: 'ما أكثر ما أعجبك في الخدمة المقدمة داخل المستشفى؟', type: QuestionType.TEXT, category: 'Feedback' },
    { id: 'feedback_neg', textEn: 'ما األمور التي ترى أنه يمكن تحسينها أو تطويرها؟', type: QuestionType.TEXT, category: 'Feedback' }
  ]
};

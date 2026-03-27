
import natural from 'natural';

// --- FEEDBACK CATEGORIZATION (Enhanced with Arabic) ---
const CATEGORIES = {
    "Communication": [
        // English
        'communication', 'explain', 'listen', 'understand', 'clear', 'language', 'speak', 'talk', 'told', 'information',
        // Arabic
        'تواصل', 'شرح', 'استماع', 'فهم', 'واضح', 'لغة', 'تحدث', 'كلام', 'قال', 'معلومات', 'اسلوب', 'تفاهم'
    ],
    "Staff Attitude and Courtesy": [
        // English
        'attitude', 'rude', 'polite', 'kind', 'nice', 'friendly', 'respect', 'mean', 'angry', 'smile', 'helpful', 'courtesy',
        // Arabic
        'اسلوب', 'وقح', 'مهذب', 'لطيف', 'جيد', 'ودود', 'احترام', 'سيء', 'غاضب', 'ابتسامة', 'مساعد', 'لباقة', 'تعامل', 'أخلاق'
    ],
    "Respect, Dignity, and Compassion": [
        // English
        'dignity', 'compassion', 'care', 'human', 'treated', 'feeling', 'empathy',
        // Arabic
        'قيمة', 'تعاطف', 'رعاية', 'انسانية', 'تعامل', 'شعور', 'احساس', 'رحمة'
    ],
    "Responsiveness of Staff": [
        // English
        'fast', 'slow', 'quick', 'wait', 'calling', 'bell', 'respond', 'ignore', 'attention', 'urgent',
        // Arabic
        'سريع', 'بطيء', 'سرعة', 'انتظار', 'نداء', 'جرس', 'استجابة', 'تجاهل', 'اهتمام', 'عاجل', 'فورا', 'حالاً'
    ],
    "Waiting Times and Delays": [
        // English
        'wait', 'delay', 'long', 'time', 'queue', 'hour', 'waiting', 'schedule', 'appointment', 'late',
        // Arabic
        'انتظار', 'تأخير', 'طويل', 'وقت', 'طابور', 'ساعة', 'مواعيد', 'موعد', 'متأخر', 'زحمة'
    ],
    "Information and Patient Education": [
        // English
        'education', 'teach', 'learn', 'know', 'guide', 'brochure', 'pamphlet', 'instruction', 'discharge',
        // Arabic
        'تعليم', 'تدريس', 'تعلم', 'اعرف', 'دليل', 'منشور', 'كتيب', 'تعليمات', 'خروج', 'توضيح'
    ],
    "Involvement in Decision Making": [
        // English
        'decision', 'ask', 'consent', 'choice', 'option', 'agree', 'plan', 'discuss',
        // Arabic
        'قرار', 'سؤال', 'موافقة', 'خيار', 'اختيار', 'اتفاق', 'خطة', 'ناقش', 'رأي'
    ],
    "Pain Management": [
        // English
        'pain', 'hurt', 'ache', 'relief', 'medicine', 'drug', 'injection', 'suffer', 'agony',
        // Arabic
        'ألم', 'وجع', 'إيلام', 'راحة', 'دواء', 'علاج', 'حقنة', 'إبرة', 'معاناة', 'عذاب', 'مسكن'
    ],
    "Cleanliness and Hygiene": [
        // English
        'clean', 'dirty', 'dust', 'smell', 'garbage', 'bin', 'toilet', 'bathroom', 'hygiene', 'mess',
        // Arabic
        'نظيف', 'وسخ', 'غبار', 'رائحة', 'زبالة', 'سلة', 'حمام', 'تواليت', 'نظافة', 'فوضى', 'قذر'
    ],
    "Quietness of Environment": [
        // English
        'quiet', 'noise', 'loud', 'sound', 'sleep', 'night', 'annoying', 'voice',
        // Arabic
        'هادئ', 'ضجيج', 'ازعاج', 'صوت', 'نوم', 'ليل', 'مزعج', 'هدوء'
    ],
    "Food and Nutrition": [
        // English
        'food', 'eat', 'meal', 'drink', 'water', 'taste', 'cold', 'hungry', 'menu', 'diet',
        // Arabic
        'طعام', 'أكل', 'وجبة', 'شرب', 'ماء', 'طعم', 'بارد', 'جوع', 'قائمة', 'حمية', 'غداء', 'عشاء', 'فطور'
    ],
    "Registration and Admission Process": [
        // English
        'registration', 'admission', 'paperwork', 'form', 'sign', 'desk', 'reception', 'register',
        // Arabic
        'تسجيل', 'دخول', 'أوراق', 'استمارة', 'توقيع', 'مكتب', 'استقبال', 'إجراءات'
    ],
    "Discharge Process and Transition": [
        // English
        'discharge', 'leave', 'home', 'go', 'bill', 'payment', 'instructions',
        // Arabic
        'خروج', 'مغادرة', 'منزل', 'ذهاب', 'فاتورة', 'دفع', 'تعليمات', 'حساب'
    ],
    "Privacy and Confidentiality": [
        // English
        'privacy', 'private', 'secret', 'confidential', 'curtain', 'door', 'hear', 'room',
        // Arabic
        'خصوصية', 'خاص', 'سر', 'سري', 'ستارة', 'باب', 'سمع', 'غرفة', 'عزلة'
    ],
    "Access to Care and Services": [
        // English
        'access', 'available', 'open', 'close', 'find', 'reach', 'transport', 'parking', 'appointment',
        // Arabic
        'وصول', 'متاح', 'موجود', 'فتح', 'غلق', 'أجد', 'وصول', 'نقل', 'موقف', 'سيارة', 'موعد'
    ],
    "Physical Comfort and Safety": [
        // English
        'comfort', 'bed', 'pillow', 'cold', 'hot', 'safe', 'danger', 'fall', 'slip', 'chair',
        // Arabic
        'راحة', 'سرير', 'مخدة', 'برد', 'حر', 'أمان', 'خطر', 'سقوط', 'انزلاق', 'كرسي', 'مريح'
    ],
    "Emotional Support": [
        // English
        'emotional', 'sad', 'cry', 'happy', 'fear', 'scared', 'worry', 'anxious', 'support', 'calm',
        // Arabic
        'عاطفي', 'حزين', 'بكي', 'سعيد', 'خوف', 'مرعوب', 'قلق', 'توتر', 'دعم', 'هدوء', 'طمأنينة'
    ],
    "Likelihood to Recommend the Hospital": [
        // English
        'recommend', 'friend', 'family', 'tell', 'suggest', 'good',
        // Arabic
        'أنصح', 'أوصي', 'صديق', 'عائلة', 'أخبر', 'اقترح', 'جيد', 'ممتاز'
    ],
    "Overall Positive Experience Rating": [
        // English
        'great', 'excellent', 'amazing', 'best', 'love', 'perfect', 'satisfied', 'good',
        // Arabic
        'رائع', 'ممتاز', 'مذهل', 'أفضل', 'أحب', 'مثالي', 'راضي', 'جيد', 'شكرا'
    ],
    "Overall Negative Experience Rating": [
        // English
        'bad', 'terrible', 'worst', 'hate', 'awful', 'dissatisfied', 'poor',
        // Arabic
        'سيء', 'فظيع', 'أسوأ', 'أكره', 'شنيع', 'غير راضي', 'ضعيف', 'زفت'
    ],
    "Maintenance": [
        // English
        'broken', 'fix', 'light', 'ac', 'air', 'water', 'leak', 'door', 'window', 'tv',
        // Arabic
        'مكسور', 'عطلان', 'تصلح', 'ضوء', 'إنارة', 'مكيف', 'هواء', 'ماء', 'تسريب', 'باب', 'شباك', 'تلفزيون', 'صيانة'
    ],
    "Services & Resources Availability": [
        // English
        'resource', 'machine', 'equipment', 'medicine', 'stock', 'available', 'out of', 'missing',
        // Arabic
        'موارد', 'ماكينة', 'جهاز', 'معدات', 'دواء', 'مخزون', 'متاح', 'ناقص', 'مفقود', 'غير موجود'
    ]
};

export const categorizeFeedback = (text) => {
    if (!text) return [];

    // Simple improvement: Remove newlines and trim
    const cleanText = text.toLowerCase().replace(/\n/g, ' ').trim();
    if (!cleanText) return [];

    // Note: 'natural' stemmers are mostly for English. 
    // For Arabic, we'll do direct keyword matching for now which is effective for this scope.
    // If needed, we can add a basic Arabic stemmer, but simple inclusion is often enough for "bad", "slow", etc.

    const matches = new Set();

    Object.entries(CATEGORIES).forEach(([category, keywords]) => {
        // Check if any keyword exists in the text
        const hasMatch = keywords.some(keyword => cleanText.includes(keyword.toLowerCase()));
        if (hasMatch) matches.add(category);
    });

    return Array.from(matches);
};

export const generateWordCloudData = (texts) => {
    // Combine all texts
    const fullText = texts.join(' ');

    // Improved Tokenizer for Multilingual (Basic split by spaces and punctuation)
    // natural.WordTokenizer often handles English well but might break Arabic. 
    // Let's use a regex that captures words in both scripts.
    const tokens = fullText.toLowerCase().match(/[\u0600-\u06FFa-z0-9]+/g) || [];

    // Filter Stopwords (English + Common Arabic)
    const stopwords = [
        // EN
        'the', 'and', 'is', 'to', 'in', 'it', 'of', 'for', 'was', 'my', 'a', 'an', 'on', 'with', 'at', 'by', 'this', 'that', 'were', 'very', 'not', 'so', 'but',
        // AR
        'في', 'من', 'على', 'ان', 'و', 'او', 'يا', 'لا', 'ما', 'هذا', 'كان', 'انا', 'انت', 'هو', 'هي', 'نحن', 'هم', 'مع', 'بها', 'به', 'عن', 'الى', 'الولادة'
    ];

    const cleanTokens = tokens.filter(t => !stopwords.includes(t) && t.length > 2);

    const freqMap = {};
    cleanTokens.forEach(t => {
        freqMap[t] = (freqMap[t] || 0) + 1;
    });

    // Convert to array format for react-wordcloud [{text: 'word', value: 10}]
    return Object.entries(freqMap)
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50); // Top 50 words
};

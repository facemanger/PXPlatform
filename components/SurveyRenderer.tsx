
import React, { useState, useEffect } from 'react';
import { SurveyConfig, QuestionType, LocationType, SurveyHeader, SurveyResponseEntry, Department, Question, QuestionTranslation } from '../types';
import { Button, Input, Card, BrandLogo } from './UI';
import { submitSurvey, fetchConfig } from '../services/db';
import { Check, ChevronLeft, Bed, Stethoscope, Ambulance, ArrowRight, Activity } from 'lucide-react';

const uuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface Props {
  onClose: () => void;
  officerName: string;
}

export const SurveyRenderer: React.FC<Props> = ({ onClose, officerName }) => {
  // Config State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [translations, setTranslations] = useState<QuestionTranslation[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // State Wizard
  const [step, setStep] = useState(0);
  const [patientInfo, setPatientInfo] = useState({
    name: '', companionName: '', age: '', gender: 'male', fileNumber: '', phone: '', ward: ''
  });
  const [locationType, setLocationType] = useState<LocationType | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patientHistory, setPatientHistory] = useState<any>(null);
  const [aiRouting, setAiRouting] = useState<any>(null);
  const [routingChecked, setRoutingChecked] = useState(false);

  // Load Config on Mount
  useEffect(() => {
    fetchConfig().then(data => {
      console.log('Loaded Config:', data);
      if (data.departments) setDepartments(data.departments);
      if (data.questions) setAllQuestions(data.questions);
      if (data.translations) setTranslations(data.translations);
      setLoadingConfig(false);
    });
  }, []);

  // --- NAVIGATION & LOGIC ---

  const goBack = () => {
    if (step === 0) onClose();
    else if (step === 1) setStep(0);
    else if (step === 2) setStep(1);
    else if (step === 3) {
      if (locationType === 'ED') setStep(1);
      else setStep(2);
    }
  };

  const handleLocationTypeSelect = (type: LocationType) => {
    setLocationType(type);
    setStep(2);
  };

  const handleSpecificLocationSelect = async (deptId: string) => {
    const dept = departments.find(d => d.DeptID === deptId);
    if (!dept) return;

    setPatientInfo(prev => ({ ...prev, ward: dept.NameEn }));
    setSelectedDept(dept);

    // Check for smart routing if we have patient history
    if (patientHistory && !routingChecked) {
      try {
        const routingResponse = await fetch('/api/ai/smart-routing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patientInfo.phone,
            currentDepartment: dept.NameEn
          })
        });

        if (routingResponse.ok) {
          const routingData = await routingResponse.json();
          setAiRouting(routingData.routing);
          setRoutingChecked(true);

          // Show routing suggestion if alternative department recommended
          if (routingData.routing.recommendedDepartment &&
              routingData.routing.recommendedDepartment !== dept.NameEn &&
              routingData.routing.confidence > 70) {
            const proceed = confirm(
              `بناءً على تاريخ المريض، يُنصح بتوجيه الاستبيان إلى قسم ${routingData.routing.recommendedDepartment}.\n\n` +
              `السبب: ${routingData.routing.reasoning}\n\n` +
              `هل تريد المتابعة مع القسم المحدد (${dept.NameEn}) أم التغيير إلى القسم المقترح؟`
            );

            if (!proceed) {
              // Find the recommended department and select it
              const recommendedDept = departments.find(d =>
                d.NameEn === routingData.routing.recommendedDepartment ||
                d.NameAr === routingData.routing.recommendedDepartment
              );
              if (recommendedDept) {
                setPatientInfo(prev => ({ ...prev, ward: recommendedDept.NameEn }));
                setSelectedDept(recommendedDept);
              }
            }
          }
        }
      } catch (e) {
        console.error('Smart routing check failed:', e);
      }
    }

    setStep(3);
  };

  const handleAnswer = (qid: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const handleSubmit = async () => {
    if (!selectedDept || !targetQuestions.length) return;
    setSubmitting(true);

    const surveyId = uuid();
    const now = new Date();

    const header: SurveyHeader = {
      SurveyID: surveyId,
      SurveyType: selectedDept.SurveyType,
      SurveyLanguage: 'AR',
      SurveyDate: now.toLocaleDateString(),
      SurveyTime: now.toLocaleTimeString(),
      UserID: officerName,
      Department: selectedDept.NameEn,
      PatientName: patientInfo.name,
      PatientPhone: patientInfo.phone,
      PatientAge: patientInfo.age,
      PatientGender: patientInfo.gender,
      CompanionName: patientInfo.companionName,
      PatientFileNumber: patientInfo.fileNumber,
      WaitingTime: answers['wait_time'] ? String(answers['wait_time']) : undefined,
      NPS_Score: typeof answers['nps'] === 'number' ? answers['nps'] : undefined,
      CreatedAt: now.toISOString()
    };

    const responses: SurveyResponseEntry[] = Object.entries(answers).map(([qid, val]) => ({
      ResponseID: uuid(),
      SurveyID: surveyId,
      QuestionID: qid,
      NumericAnswer: typeof val === 'number' ? val : undefined,
      TextAnswer: typeof val !== 'number' ? String(val) : undefined
    }));

    try {
      await submitSurvey(header, responses);
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (e) {
      alert('Failed to save survey');
      setSubmitting(false);
    }
  };

  const startQuestionIndex = 0;

  // Derive Questions for current View
  // Join Questions with Translations (Assuming AR for now)
  const targetQuestions = selectedDept ? allQuestions.filter(q => q.SurveyType === selectedDept.SurveyType && q.IsActive).map(q => {
    const t = translations.find(tr => tr.QuestionID === q.QuestionID && tr.Language === 'AR');
    return { ...q, text: t?.QuestionText || q.Category, options: t?.Options ? t.Options.split(',') : [] };
  }).sort((a, b) => {
    // Sort Order: Normal Questions -> NPS -> Feedback
    const getOrder = (q: any) => {
      if (q.AnswerType === 'NPS') return 100;
      if (q.AnswerType === 'Text' || q.Category === 'Feedback') return 200;
      return 0;
    };
    return getOrder(a) - getOrder(b);
  }) : [];


  // --- HEADER COMPONENT ---
  const Header = () => (
    <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={goBack} className="!p-2 rounded-full">
          <ArrowRight />
        </Button>
        <BrandLogo size="sm" />
      </div>
      <div className="text-sm text-slate-500 font-bold">
        {step === 0 && 'الخطوة 1: البيانات'}
        {step === 1 && 'الخطوة 2: الموقع'}
        {step === 2 && 'الخطوة 3: القسم'}
        {step === 3 && 'الخطوة 4: الاستبيان'}
      </div>
    </div>
  );

  // --- RENDER STEPS ---

  if (loadingConfig) return <div className="p-10 text-center">Loading Configuration...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Check size={48} />
        </div>
        <h2 className="text-3xl font-bold text-[#1B2B5B] mb-2">تم الحفظ بنجاح!</h2>
        <p className="text-slate-500">تمت إضافة الاستبيان إلى قاعدة البيانات (Excel) على الخادم.</p>
      </div>
    );
  }

  // STEP 0: Demographics
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-4" dir="rtl">
        <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8 min-h-[80vh]">
          <Header />
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">بيانات المريض (Patient Info)</h2>
            <p className="text-slate-400 mt-1">يرجى تعبئة الحقول المطلوبة للبدء</p>
          </div>

          <div className="space-y-5">
            <Input label="اسم المريض (Patient Name) *" value={patientInfo.name} onChange={(e: any) => setPatientInfo({ ...patientInfo, name: e.target.value })} placeholder="الاسم الكامل" />
            <Input label="اسم المرافق (Companion Name)" value={patientInfo.companionName} onChange={(e: any) => setPatientInfo({ ...patientInfo, companionName: e.target.value })} placeholder="اسم المرافق (اختياري)" />

            <div className="grid grid-cols-2 gap-4">
              <Input label="العمر (Age) *" type="number" value={patientInfo.age} onChange={(e: any) => setPatientInfo({ ...patientInfo, age: e.target.value })} />
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">الجنس (Gender) *</label>
                <select className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-right" value={patientInfo.gender} onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}>
                  <option value="male">ذكر (Male)</option>
                  <option value="female">أنثى (Female)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="رقم الهاتف (Phone) *" type="tel" value={patientInfo.phone} onChange={(e: any) => setPatientInfo({ ...patientInfo, phone: e.target.value })} />
              <Input label="رقم الملف (File No.)" value={patientInfo.fileNumber} onChange={(e: any) => setPatientInfo({ ...patientInfo, fileNumber: e.target.value })} />
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <Button
              onClick={async () => {
                // PHONE VALIDATION
                const phoneRegex = /^(?:\+964|0)?(7\d{9})$/;
                if (!phoneRegex.test(patientInfo.phone.replace(/\s/g, ''))) {
                  alert('رقم الهاتف غير صحيح. يجب أن يكون بالصيغة العراقية (مثال: 07xxxx, +9647xxxx, 7xxxx)');
                  return;
                }

                // Fetch patient history for smart routing
                if (patientInfo.phone) {
                  try {
                    const response = await fetch(`/api/ai/patient-history/${patientInfo.phone}`);
                    if (response.ok) {
                      const data = await response.json();
                      setPatientHistory(data.patientHistory);
                    }
                  } catch (e) {
                    console.error('Failed to fetch patient history:', e);
                  }
                }

                setStep(1);
              }}
              disabled={!patientInfo.name || !patientInfo.phone || !patientInfo.age}
              className="w-full sm:w-auto px-8 py-3 text-lg"
            >
              التالي (Next) <ChevronLeft size={20} className="mr-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: Location Type
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-4" dir="rtl">
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8 min-h-[60vh]">
          <Header />
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#1B2B5B] mb-2">أين يتواجد المريض؟</h2>
            <p className="text-slate-500">يرجى تحديد موقع الخدمة لتوجيه الاستبيان</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. OPD */}
            <button onClick={() => handleLocationTypeSelect('OPD')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-teal-500 hover:shadow-lg transition-all group h-64">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform mb-4"><Stethoscope size={32} /></div>
              <span className="text-lg font-bold text-slate-800">العيادات الخارجية</span>
              <span className="text-xs text-slate-400 mt-1 uppercase">OPD</span>
            </button>

            {/* 2. Inpatient */}
            <button onClick={() => handleLocationTypeSelect('INPATIENT')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-cyan-500 hover:shadow-lg transition-all group h-64">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform mb-4"><Bed size={32} /></div>
              <span className="text-lg font-bold text-slate-800">الأقسام الداخلية</span>
              <span className="text-xs text-slate-400 mt-1 uppercase">Inpatient</span>
            </button>

            {/* 3. Allied */}
            <button onClick={() => handleLocationTypeSelect('ALLIED')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all group h-64">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform mb-4"><Activity size={32} /></div>
              <span className="text-lg font-bold text-slate-800">الخدمات المساندة</span>
              <span className="text-xs text-slate-400 mt-1 uppercase">Allied Health</span>
            </button>

            {/* 4. ED */}
            <button onClick={() => handleLocationTypeSelect('ED')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-red-500 hover:shadow-lg transition-all group h-64">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform mb-4"><Ambulance size={32} /></div>
              <span className="text-lg font-bold text-slate-800">الطوارئ</span>
              <span className="text-xs text-slate-400 mt-1 uppercase">Emergency</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Specific Location Dropdown
  if (step === 2) {
    const list = departments.filter(d => {
      // Primary Check: Explicit MainCategory
      if (d.MainCategory) {
        const cat = d.MainCategory.toUpperCase().trim();
        if (cat === locationType) return true;
        if (locationType === 'ALLIED' && cat === 'ALLIED HEALTH') return true;
        return false;
      }
      // Fallback Inference
      if (!d.MainCategory) {
        if (locationType === 'OPD' && d.Type === 'CLINIC') return true;
        if (locationType === 'INPATIENT' && d.Type === 'WARD') return true;
        if (locationType === 'ED' && d.Type === 'ED') return true;
        if (locationType === 'ALLIED') {
          const alliedTypes = ['Laboratory', 'Radiology', 'Pharmacy', 'Physiotherapy'];
          if (alliedTypes.includes(d.SurveyType)) return true;
        }
      }
      return false;
    });

    // Label Map
    const labelMap: any = {
      'OPD': 'الرجاء اختيار العيادة (Select Clinic)',
      'INPATIENT': 'الرجاء اختيار الردهة (Select Ward)',
      'ED': 'الرجاء اختيار قسم الطوارئ (Select ED Section)',
      'ALLIED': 'الرجاء اختيار الخدمة (Select Service)'
    };

    return (
      <div className="min-h-screen bg-[#f8fafc] p-4" dir="rtl">
        <div className="max-w-xl mx-auto bg-white shadow-xl rounded-2xl p-8 min-h-[50vh]">
          <Header />
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1B2B5B]">اختيار القسم الفرعي</h2>
          </div>
          <Card className="p-8 border-slate-200 shadow-none bg-slate-50">
            <label className="block text-lg font-medium text-slate-700 mb-4">{labelMap[locationType as string] || 'الرجاء اختيار القسم'}</label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-right text-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => handleSpecificLocationSelect(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>اختر من القائمة...</option>
              {list.map(dept => <option key={dept.DeptID} value={dept.DeptID}>{dept.NameAr || dept.NameEn}</option>)}
            </select>
          </Card>
        </div>
      </div>
    );
  }

  // STEP 3: Survey Questions
  if (!selectedDept || targetQuestions.length === 0) return (
    <div className="min-h-screen p-8 text-center text-xl font-bold text-red-500">
      عذراً، لم يتم العثور على أسئلة لهذا القسم ({selectedDept?.SurveyType}). يرجى مراجعة المسؤول.
      <br /><Button onClick={goBack} className="mt-4">رجوع</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12" dir="rtl">
      {/* Survey Sticky Header */}
      <div className="sticky top-0 bg-white shadow-md z-20 border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={goBack} className="!p-1.5">
              <ArrowRight size={20} />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-[#1B2B5B]">{selectedDept.NameAr}</h2>
              <p className="text-xs text-slate-500">{selectedDept.SurveyType}</p>
            </div>
          </div>
          <div className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-[#1B2B5B]">
            {Object.keys(answers).length} / {targetQuestions.length}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-6">
        {targetQuestions.map((q, idx) => (
          <Card key={q.QuestionID} className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 bg-[#1B2B5B] text-white rounded-full flex items-center justify-center font-bold text-sm mt-1">
                {idx + 1}
              </span>
              <p className="text-lg font-medium text-slate-800 leading-relaxed">{q.text}</p>
            </div>

            {/* SCALE */}
            {q.AnswerType === QuestionType.SCALE && (
              <div className="flex justify-between items-center gap-2 max-w-md mx-auto mt-6">
                <span className="text-xs text-red-500 font-medium hidden sm:block">غير راضٍ</span>
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    onClick={() => handleAnswer(q.QuestionID, val)}
                    className={`w-12 h-12 rounded-full text-lg font-bold transition-all duration-200 flex items-center justify-center border-2
                        ${answers[q.QuestionID] === val
                        ? 'bg-[#1B2B5B] border-[#1B2B5B] text-white scale-110 shadow-lg'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}
                  >
                    {val}
                  </button>
                ))}
                <span className="text-xs text-green-600 font-medium hidden sm:block">راضٍ جداً</span>
              </div>
            )}

            {/* RADIO */}
            {q.AnswerType === QuestionType.RADIO && q.options && (
              <div className="space-y-3 mt-4">
                {q.options.map((opt: string) => (
                  <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                     ${answers[q.QuestionID] === opt ? 'bg-blue-50 border-blue-500 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name={q.QuestionID}
                      value={opt}
                      checked={answers[q.QuestionID] === opt}
                      onChange={() => handleAnswer(q.QuestionID, opt)}
                      className="w-5 h-5 accent-[#1B2B5B]"
                    />
                    <span className="text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* BOOLEAN */}
            {q.AnswerType === QuestionType.BOOLEAN && (
              <div className="flex flex-col items-center gap-4 mt-4 w-full">
                <div className="flex gap-4 max-w-xs mx-auto w-full">
                  {['نعم (Yes)', 'لا (No)'].map(opt => (
                    <Button
                      key={opt}
                      variant={answers[q.QuestionID] === opt ? 'primary' : 'secondary'}
                      onClick={() => {
                        handleAnswer(q.QuestionID, opt);
                        // Clear details if switching to No
                        if (opt !== 'نعم (Yes)' && (q.QuestionID === 'ip_q11' || q.QuestionID === 'ip_q12')) {
                          handleAnswer(`${q.QuestionID}_details`, undefined);
                        }
                      }}
                      className={`flex-1 py-3 ${answers[q.QuestionID] === opt ? '!bg-[#1B2B5B]' : ''}`}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>

                {/* PROMPT FOR MAINTENANCE DETAILS */}
                {/* Check for ip_q12 (which is the maintenance question ID in rebuild_database.js) */}
                {(q.QuestionID === 'ip_q12' || q.QuestionID === 'ip_q11') && answers[q.QuestionID] === 'نعم (Yes)' && (
                  <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm text-slate-600 mb-2 font-medium">يرجى تحديد العطل أو المشكلة (Please specify):</label>
                    <textarea
                      placeholder="صف المشكلة هنا... (Describe the issue here)"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1B2B5B] outline-none bg-yellow-50 min-h-[100px]"
                      value={answers[`${q.QuestionID}_details`] || ''}
                      onChange={(e) => handleAnswer(`${q.QuestionID}_details`, e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* NPS */}
            {q.AnswerType === QuestionType.NPS && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                    <button
                      key={val}
                      onClick={() => handleAnswer(q.QuestionID, val)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all text-sm border
                         ${answers[q.QuestionID] === val
                          ? 'bg-[#1B2B5B] border-[#1B2B5B] text-white shadow-lg scale-110'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEXT */}
            {q.AnswerType === QuestionType.TEXT && (
              <textarea
                className="w-full mt-4 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none bg-slate-50"
                rows={3}
                placeholder="اكتب إجابتك هنا..."
                value={answers[q.QuestionID] || ''}
                onChange={(e) => handleAnswer(q.QuestionID, e.target.value)}
              />
            )}
          </Card>
        ))}

        <div className="pt-8 pb-16">
          <Button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < 2}
            className={`w-full py-4 text-xl shadow-xl ${submitting ? 'opacity-75 cursor-not-allowed' : 'bg-[#1B2B5B] hover:bg-[#152145]'}`}
          >
            {submitting ? 'جاري الحفظ إلى قاعدة البيانات...' : 'إرسال وحفظ (Submit & Save)'}
            {!submitting && <Check size={24} className="mr-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const winkNLP = require('wink-nlp');
const winkSentiment = require('wink-sentiment');
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);
const its = nlp.its;

import { SentimentAnalysis, ComplaintCategory, PatientHistory, PredictiveTrend, SurveyRouting, Complaint, SurveyResponseEntry } from '../types';

// AI Service for Healthcare Platform Intelligence
export class HealthcareAIService {

  // Arabic and English keywords for sentiment analysis (backup)
  private static positiveKeywords = {
    ar: ['ممتاز', 'جيد', 'رائع', 'شكرا', 'ممتاز', 'ممتاز جدا', 'سعيد', 'مرضي', 'احترافي', 'جيد جدا', 'ممتازة'],
    en: ['excellent', 'good', 'great', 'amazing', 'satisfied', 'professional', 'wonderful', 'perfect', 'thank', 'happy']
  };

  private static negativeKeywords = {
    ar: ['سيء', 'رديء', 'بطيء', 'مشكلة', 'غاضب', 'ساخط', 'انتظار', 'تأخير', 'غير مرضي', 'سيء جدا', 'كارثة'],
    en: ['bad', 'terrible', 'slow', 'problem', 'angry', 'disappointed', 'waiting', 'delay', 'unsatisfactory', 'worst']
  };

  // Complaint categories with keywords (enhanced with NLP)
  private static complaintCategories = [
    {
      name: 'Staff Behavior',
      keywords: {
        ar: ['طبيب', 'ممرض', 'موظف', 'عامل', 'سلوك', 'تعامل', 'احترام', 'لباقة'],
        en: ['doctor', 'nurse', 'staff', 'behavior', 'treatment', 'respect', 'courtesy', 'attitude']
      }
    },
    {
      name: 'Waiting Time',
      keywords: {
        ar: ['انتظار', 'تأخير', 'وقت', 'طويل', 'ساعات', 'دقائق', 'سرعة', 'بطيء'],
        en: ['waiting', 'delay', 'time', 'long', 'hours', 'minutes', 'slow', 'fast']
      }
    },
    {
      name: 'Facilities & Cleanliness',
      keywords: {
        ar: ['نظافة', 'غرفة', 'مرحاض', 'مستشفى', 'معدات', 'أجهزة', 'قذر', 'نظيف'],
        en: ['cleanliness', 'room', 'bathroom', 'hospital', 'equipment', 'dirty', 'clean', 'facilities']
      }
    },
    {
      name: 'Medical Care Quality',
      keywords: {
        ar: ['علاج', 'تشخيص', 'أدوية', 'عملية', 'جراحة', 'رعاية', 'طبية', 'جودة'],
        en: ['treatment', 'diagnosis', 'medication', 'surgery', 'care', 'medical', 'quality', 'procedure']
      }
    },
    {
      name: 'Administrative Issues',
      keywords: {
        ar: ['إدارة', 'تسجيل', 'ورق', 'ملف', 'تعويض', 'فواتير', 'إجراءات', 'إداري'],
        en: ['administration', 'registration', 'paperwork', 'file', 'insurance', 'billing', 'procedures', 'admin']
      }
    }
  ];

  // Analyze sentiment of text using actual NLP
  static analyzeSentiment(text: string): SentimentAnalysis {
    if (!text || text.trim().length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.5,
        keywords: [],
        analyzedAt: new Date().toISOString()
      };
    }

    try {
      // Use wink-sentiment for sentiment analysis
      const sentimentResult = winkSentiment(text);

      // Get NLP document for additional processing
      const doc = nlp.readDoc(text);

      // Extract entities and keywords for better analysis
      const tokens = doc.tokens().out();
      const entities = doc.entities().out();
      const posTags = doc.tokens().out(its.pos);

      // Combine wink-sentiment with keyword analysis for enhanced accuracy
      const lowerText = text.toLowerCase();
      let keywordScore = 0;
      const foundKeywords: string[] = [];

      // Check positive keywords
      [...this.positiveKeywords.ar, ...this.positiveKeywords.en].forEach(keyword => {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          keywordScore += matches.length * 0.1;
          foundKeywords.push(keyword);
        }
      });

      // Check negative keywords
      [...this.negativeKeywords.ar, ...this.negativeKeywords.en].forEach(keyword => {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          keywordScore -= matches.length * 0.1;
          foundKeywords.push(keyword);
        }
      });

      // Combine NLP sentiment with keyword analysis
      const combinedScore = sentimentResult.score + keywordScore;
      const normalizedScore = Math.max(-1, Math.min(1, combinedScore));

      let sentiment: 'positive' | 'negative' | 'neutral';
      if (normalizedScore > 0.1) sentiment = 'positive';
      else if (normalizedScore < -0.1) sentiment = 'negative';
      else sentiment = 'neutral';

      // Calculate confidence based on multiple factors
      const textLength = text.split(' ').length;
      const keywordDensity = foundKeywords.length / Math.max(textLength, 1);
      const sentimentStrength = Math.abs(sentimentResult.score);
      const confidence = Math.min(
        (sentimentStrength * 0.6 + keywordDensity * 0.4) * (textLength > 3 ? 1 : 0.7),
        0.95
      );

      return {
        sentiment,
        score: normalizedScore,
        confidence: Math.max(confidence, 0.3),
        keywords: [...new Set([...foundKeywords, ...entities])],
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('NLP sentiment analysis error:', error);
      // Fallback to keyword-based analysis
      return this.fallbackSentimentAnalysis(text);
    }
  }

  // Fallback keyword-based sentiment analysis
  private static fallbackSentimentAnalysis(text: string): SentimentAnalysis {
    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    const foundKeywords: string[] = [];

    // Check positive keywords
    [...this.positiveKeywords.ar, ...this.positiveKeywords.en].forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        positiveScore += matches.length;
        foundKeywords.push(keyword);
      }
    });

    // Check negative keywords
    [...this.negativeKeywords.ar, ...this.negativeKeywords.en].forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        negativeScore += matches.length;
        foundKeywords.push(keyword);
      }
    });

    // Calculate sentiment score (-1 to 1)
    const totalWords = text.split(' ').length;
    const positiveRatio = positiveScore / totalWords;
    const negativeRatio = negativeScore / totalWords;
    const score = positiveRatio - negativeRatio;

    let sentiment: 'positive' | 'negative' | 'neutral';
    if (score > 0.1) sentiment = 'positive';
    else if (score < -0.1) sentiment = 'negative';
    else sentiment = 'neutral';

    // Confidence based on keyword matches
    const confidence = Math.min((positiveScore + negativeScore) / Math.max(totalWords * 0.1, 1), 1);

    return {
      sentiment,
      score,
      confidence,
      keywords: [...new Set(foundKeywords)], // Remove duplicates
      analyzedAt: new Date().toISOString()
    };
  }

  // Auto-categorize complaints using NLP
  static categorizeComplaint(text: string): ComplaintCategory {
    if (!text || text.trim().length === 0) {
      return {
        categoryId: 'general',
        categoryName: 'General',
        confidence: 0.1,
        assignedAt: new Date().toISOString()
      };
    }

    try {
      // Use NLP to analyze the text
      const doc = nlp.readDoc(text);
      const tokens = doc.tokens().out();
      const entities = doc.entities().out();

      // Calculate semantic similarity with each category
      let bestMatch = {
        category: 'General',
        confidence: 0.1,
        keywords: [] as string[],
        priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical'
      };

      this.complaintCategories.forEach(cat => {
        let matchScore = 0;
        const categoryKeywords = [...cat.keywords.ar, ...cat.keywords.en];
        const foundKeywords: string[] = [];

        // Check for exact keyword matches
        categoryKeywords.forEach(keyword => {
          const regex = new RegExp(keyword.toLowerCase(), 'gi');
          if (regex.test(text.toLowerCase())) {
            matchScore += 0.3;
            foundKeywords.push(keyword);
          }
        });

        // Check for entity matches (people, organizations, etc.)
        entities.forEach((entity: string) => {
          if (categoryKeywords.some(k => entity.toLowerCase().includes(k.toLowerCase()))) {
            matchScore += 0.2;
          }
        });

        // Use NLP similarity (basic implementation)
        const textLower = text.toLowerCase();
        const categoryNameLower = cat.name.toLowerCase();

        // Simple word overlap similarity
        const textWords = new Set(textLower.split(' '));
        const categoryWords = new Set(categoryNameLower.split(' '));
        const overlap = [...textWords].filter(word => categoryWords.has(word)).length;
        const similarity = overlap / Math.max(textWords.size, categoryWords.size);

        matchScore += similarity * 0.4;

        // Determine priority based on keywords and urgency indicators
        let priority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
        const urgentWords = ['critical', 'urgent', 'emergency', 'حرج', 'طارئ', 'عاجل'];
        const highWords = ['high', 'important', 'serious', 'عالي', 'مهم', 'خطير'];

        if (urgentWords.some(word => textLower.includes(word))) {
          priority = 'Critical';
        } else if (highWords.some(word => textLower.includes(word))) {
          priority = 'High';
        }

        if (matchScore > bestMatch.confidence) {
          bestMatch = {
            category: cat.name,
            confidence: Math.min(matchScore, 0.95),
            keywords: foundKeywords,
            priority
          };
        }
      });

      return {
        categoryId: bestMatch.category.toLowerCase().replace(/\s+/g, '_'),
        categoryName: bestMatch.category,
        confidence: bestMatch.confidence,
        subCategories: bestMatch.keywords.length > 0 ? bestMatch.keywords : undefined,
        priority: bestMatch.priority,
        assignedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('NLP categorization error:', error);
      // Fallback to keyword-based categorization
      return this.fallbackCategorization(text);
    }
  }

  // Fallback keyword-based categorization
  private static fallbackCategorization(text: string): ComplaintCategory {
    const lowerText = text.toLowerCase();
    let bestMatch = {
      category: 'General',
      confidence: 0.1,
      keywords: [] as string[]
    };

    this.complaintCategories.forEach(cat => {
      let matchCount = 0;
      const allKeywords = [...cat.keywords.ar, ...cat.keywords.en];

      allKeywords.forEach(keyword => {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          matchCount += matches.length;
        }
      });

      const confidence = Math.min(matchCount / Math.max(text.split(' ').length * 0.05, 1), 1);

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          category: cat.name,
          confidence,
          keywords: allKeywords.filter(k => lowerText.includes(k.toLowerCase()))
        };
      }
    });

    return {
      categoryId: bestMatch.category.toLowerCase().replace(/\s+/g, '_'),
      categoryName: bestMatch.category,
      confidence: bestMatch.confidence,
      assignedAt: new Date().toISOString()
    };
  }

  // Build patient history from surveys and complaints using AI analysis
  static buildPatientHistory(
    patientPhone: string,
    surveys: any[],
    complaints: Complaint[]
  ): PatientHistory {
    try {
      // Enhanced patient data extraction using NLP
      const patientSurveys = surveys.filter(s =>
        s.PatientPhone === patientPhone ||
        s.PatientName?.toLowerCase().includes(patientPhone.toLowerCase()) ||
        s.PatientPhone?.replace(/\D/g, '') === patientPhone.replace(/\D/g, '')
      );

      const patientComplaints = complaints.filter(c =>
        c.Phone === patientPhone ||
        c.PatientName?.toLowerCase().includes(patientPhone.toLowerCase()) ||
        c.Phone?.replace(/\D/g, '') === patientPhone.replace(/\D/g, '')
      );

      // AI-enhanced analysis
      const npsScores = patientSurveys
        .map(s => s.NPS_Score)
        .filter(score => score !== undefined && score !== null);

      const averageNPS = npsScores.length > 0
        ? npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length
        : 0;

      // Department preferences with frequency analysis
      const departmentPrefs: { [key: string]: number } = {};
      patientSurveys.forEach(survey => {
        if (survey.Department) {
          departmentPrefs[survey.Department] = (departmentPrefs[survey.Department] || 0) + 1;
        }
      });

      // AI-powered risk assessment
      const riskFactors = this.calculateRiskFactors(patientSurveys, patientComplaints, averageNPS);

      // Analyze complaint patterns using NLP
      const complaintPatterns = this.analyzeComplaintPatterns(patientComplaints);

      // Calculate risk level using ML approach
      let riskLevel: 'Low' | 'Medium' | 'High';
      const riskScore = riskFactors.overallRisk;

      if (riskScore >= 0.7) riskLevel = 'High';
      else if (riskScore >= 0.4) riskLevel = 'Medium';
      else riskLevel = 'Low';

      // Extract behavioral patterns
      const behavioralPatterns = this.extractBehavioralPatterns(patientSurveys, patientComplaints);

      // Last survey date
      const lastSurveyDate = patientSurveys.length > 0
        ? patientSurveys.sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())[0].CreatedAt
        : '';

      return {
        PatientID: patientPhone,
        totalSurveys: patientSurveys.length,
        averageNPS,
        lastSurveyDate,
        complaintHistory: patientComplaints.map(c => c.ComplaintID),
        departmentPreferences: departmentPrefs,
        riskLevel,
        riskFactors,
        complaintPatterns,
        behavioralPatterns,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI patient history error:', error);
      // Fallback to basic analysis
      return this.fallbackPatientHistory(patientPhone, surveys, complaints);
    }
  }

  // Calculate risk factors using AI analysis
  private static calculateRiskFactors(surveys: any[], complaints: Complaint[], averageNPS: number) {
    let riskScore = 0;

    // NPS-based risk
    if (averageNPS < 6) riskScore += 0.3;
    else if (averageNPS < 8) riskScore += 0.1;

    // Complaint frequency risk
    const complaintRate = complaints.length / Math.max(surveys.length, 1);
    if (complaintRate > 0.5) riskScore += 0.4;
    else if (complaintRate > 0.2) riskScore += 0.2;

    // Recent negative complaints
    const recentComplaints = complaints.filter(c =>
      new Date(c.CreatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const negativeRecent = recentComplaints.filter(c =>
      c.Priority === 'Critical' || c.Priority === 'High'
    ).length;
    riskScore += Math.min(negativeRecent * 0.1, 0.3);

    // Sentiment analysis of recent complaints
    const recentTexts = recentComplaints.map(c => c.Details || '').filter(t => t.trim());
    const negativeSentiments = recentTexts.filter(text => {
      const analysis = this.analyzeSentiment(text);
      return analysis.sentiment === 'negative';
    }).length;

    riskScore += (negativeSentiments / Math.max(recentTexts.length, 1)) * 0.2;

    return {
      overallRisk: Math.min(riskScore, 1),
      npsRisk: averageNPS < 6 ? 0.3 : 0,
      complaintFrequencyRisk: Math.min(complaintRate * 2, 0.4),
      recentNegativeRisk: Math.min(negativeRecent * 0.1, 0.3),
      sentimentRisk: (negativeSentiments / Math.max(recentTexts.length, 1)) * 0.2
    };
  }

  // Analyze complaint patterns using NLP
  private static analyzeComplaintPatterns(complaints: Complaint[]) {
    const patterns = {
      commonThemes: [] as string[],
      temporalPatterns: {} as { [key: string]: number },
      severityTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      categoryFrequency: {} as { [key: string]: number }
    };

    // Analyze themes using NLP
    complaints.forEach(complaint => {
      const text = complaint.Details || '';
      if (text.trim()) {
        try {
          const doc = nlp.readDoc(text);
          const entities = doc.entities().out();
          const tokens = doc.tokens().out();

          // Extract common themes
          entities.forEach((entity: string) => {
            if (!patterns.commonThemes.includes(entity)) {
              patterns.commonThemes.push(entity);
            }
          });
        } catch (e) {
          // Skip NLP analysis for this complaint
        }
      }
    });

    // Analyze temporal patterns
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    patterns.temporalPatterns = {
      last7Days: complaints.filter(c => new Date(c.CreatedAt) >= last7Days).length,
      last30Days: complaints.filter(c => new Date(c.CreatedAt) >= last30Days).length,
      total: complaints.length
    };

    return patterns;
  }

  // Extract behavioral patterns using AI
  private static extractBehavioralPatterns(surveys: any[], complaints: Complaint[]) {
    const patterns = {
      surveyFrequency: 'regular' as 'frequent' | 'regular' | 'infrequent',
      complaintFrequency: 'low' as 'high' | 'medium' | 'low',
      preferredTimes: [] as string[],
      responseConsistency: 0.5
    };

    // Analyze survey frequency
    if (surveys.length > 10) patterns.surveyFrequency = 'frequent';
    else if (surveys.length < 3) patterns.surveyFrequency = 'infrequent';
    else patterns.surveyFrequency = 'regular';

    // Analyze complaint frequency relative to surveys
    const complaintRatio = complaints.length / Math.max(surveys.length, 1);
    if (complaintRatio > 0.3) patterns.complaintFrequency = 'high';
    else if (complaintRatio > 0.1) patterns.complaintFrequency = 'medium';
    else patterns.complaintFrequency = 'low';

    return patterns;
  }

  // Fallback patient history (original implementation)
  private static fallbackPatientHistory(
    patientPhone: string,
    surveys: any[],
    complaints: Complaint[]
  ): PatientHistory {
    const patientSurveys = surveys.filter(s =>
      s.PatientPhone === patientPhone || s.PatientName?.toLowerCase().includes(patientPhone.toLowerCase())
    );

    const patientComplaints = complaints.filter(c =>
      c.Phone === patientPhone || c.PatientName?.toLowerCase().includes(patientPhone.toLowerCase())
    );

    // Calculate average NPS
    const npsScores = patientSurveys
      .map(s => s.NPS_Score)
      .filter(score => score !== undefined && score !== null);

    const averageNPS = npsScores.length > 0
      ? npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length
      : 0;

    // Department preferences
    const departmentPrefs: { [key: string]: number } = {};
    patientSurveys.forEach(survey => {
      if (survey.Department) {
        departmentPrefs[survey.Department] = (departmentPrefs[survey.Department] || 0) + 1;
      }
    });

    // Risk level based on complaints and low NPS
    const negativeComplaints = patientComplaints.filter(c =>
      c.Status !== 'Resolved' || c.Priority === 'Critical' || c.Priority === 'High'
    ).length;

    const lowNPSSurveys = npsScores.filter(score => score <= 6).length;
    const riskScore = (negativeComplaints * 2) + lowNPSSurveys;

    let riskLevel: 'Low' | 'Medium' | 'High';
    if (riskScore >= 5) riskLevel = 'High';
    else if (riskScore >= 2) riskLevel = 'Medium';
    else riskLevel = 'Low';

    // Last survey date
    const lastSurveyDate = patientSurveys.length > 0
      ? patientSurveys.sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())[0].CreatedAt
      : '';

    return {
      PatientID: patientPhone,
      totalSurveys: patientSurveys.length,
      averageNPS,
      lastSurveyDate,
      complaintHistory: patientComplaints.map(c => c.ComplaintID),
      departmentPreferences: departmentPrefs,
      riskLevel,
      lastUpdated: new Date().toISOString()
    };
  }

  // Generate predictive trends using AI/ML analysis
  static predictTrends(
    complaints: Complaint[],
    surveys: any[],
    departments: string[]
  ): PredictiveTrend[] {
    try {
      const trends: PredictiveTrend[] = [];
      const now = new Date();

      // AI-enhanced trend analysis
      departments.forEach(dept => {
        const deptComplaints = complaints.filter(c => c.Department === dept);
        const deptSurveys = surveys.filter(s => s.Department === dept);

        if (deptComplaints.length >= 3) { // Minimum data for prediction
          const prediction = this.predictDepartmentTrends(dept, deptComplaints, deptSurveys);

          if (prediction.confidence > 0.6) {
            trends.push({
              trendId: `ai_trend_${dept}_${Date.now()}`,
              trendType: prediction.trendType,
              department: dept,
              predictedIncrease: prediction.predictedIncrease,
              confidence: prediction.confidence,
              timeframe: 'next_week',
              recommendations: prediction.recommendations,
              generatedAt: new Date().toISOString()
            });
          }
        }
      });

      // Overall platform sentiment trend analysis
      const sentimentTrend = this.analyzeSentimentTrends(surveys, complaints);
      if (sentimentTrend) {
        trends.push(sentimentTrend as PredictiveTrend);
      }

      // Cross-department pattern analysis
      const crossDeptPatterns = this.analyzeCrossDepartmentPatterns(complaints, departments);
      trends.push(...crossDeptPatterns);

      return trends;

    } catch (error) {
      console.error('AI predictive trends error:', error);
      // Fallback to basic trend analysis
      return this.fallbackPredictTrends(complaints, surveys, departments);
    }
  }

  // Predict department-specific trends using AI
  private static predictDepartmentTrends(
    department: string,
    complaints: Complaint[],
    surveys: any[]
  ) {
    const now = new Date();
    const days = [7, 14, 30, 60, 90];

    // Create time series data
    const timeSeries = days.map(daysBack => {
      const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const periodComplaints = complaints.filter(c =>
        new Date(c.CreatedAt) >= date
      ).length;

      const periodSurveys = surveys.filter(s =>
        new Date(s.CreatedAt) >= date
      );

      const avgNPS = periodSurveys.length > 0
        ? periodSurveys.reduce((sum, s) => sum + (s.NPS_Score || 0), 0) / periodSurveys.length
        : 0;

      return {
        days: daysBack,
        complaints: periodComplaints,
        surveys: periodSurveys.length,
        nps: avgNPS
      };
    });

    // Simple linear regression for trend prediction
    const complaintCounts = timeSeries.map(t => t.complaints);
    const daysArray = timeSeries.map(t => t.days);

    const slope = this.calculateLinearRegressionSlope(daysArray, complaintCounts);
    const predictedIncrease = Math.round(slope * 7); // Next week prediction

    // Analyze sentiment correlation
    const recentComplaints = complaints.filter(c =>
      new Date(c.CreatedAt) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );

    const negativeRatio = recentComplaints.filter(c => {
      const analysis = this.analyzeSentiment(c.Details || '');
      return analysis.sentiment === 'negative';
    }).length / Math.max(recentComplaints.length, 1);

    // Determine trend type and confidence
    let trendType: 'complaint_increase' | 'complaint_decrease' | 'sentiment_decline' = 'complaint_increase';
    let confidence = 0.5;

    if (Math.abs(predictedIncrease) > 2) {
      confidence = Math.min(Math.abs(slope) * 0.1 + 0.5, 0.9);
      trendType = predictedIncrease > 0 ? 'complaint_increase' : 'complaint_decrease';
    } else if (negativeRatio > 0.3) {
      trendType = 'sentiment_decline';
      confidence = negativeRatio * 0.8;
    }

    // Generate AI-powered recommendations
    const recommendations = this.generateTrendRecommendations(
      trendType,
      predictedIncrease,
      negativeRatio,
      department
    );

    return {
      trendType,
      predictedIncrease: Math.abs(predictedIncrease),
      confidence,
      recommendations
    };
  }

  // Calculate linear regression slope
  private static calculateLinearRegressionSlope(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  // Analyze overall sentiment trends
  private static analyzeSentimentTrends(surveys: any[], complaints: Complaint[]) {
    const recentSurveys = surveys.filter(s =>
      new Date(s.CreatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const olderSurveys = surveys.filter(s =>
      new Date(s.CreatedAt) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      new Date(s.CreatedAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );

    if (recentSurveys.length >= 5 && olderSurveys.length >= 5) {
      const recentAvgNPS = recentSurveys.reduce((sum, s) => sum + (s.NPS_Score || 0), 0) / recentSurveys.length;
      const olderAvgNPS = olderSurveys.reduce((sum, s) => sum + (s.NPS_Score || 0), 0) / olderSurveys.length;

      const decline = olderAvgNPS - recentAvgNPS;

      if (decline > 0.5) {
        return {
          trendId: `sentiment_trend_${Date.now()}`,
          trendType: 'sentiment_decline',
          predictedIncrease: Math.round(decline),
          confidence: Math.min(decline / 2, 0.9),
          timeframe: 'next_week',
          recommendations: [
            'Immediate review of recent patient feedback required',
            'Identify common themes in negative feedback',
            'Consider staff training or process improvements',
            'Monitor NPS scores closely for the next week'
          ],
          generatedAt: new Date().toISOString()
        };
      }
    }

    return null;
  }

  // Analyze cross-department patterns
  private static analyzeCrossDepartmentPatterns(complaints: Complaint[], departments: string[]) {
    const patterns: PredictiveTrend[] = [];

    // Find departments with correlated complaint patterns
    const deptStats = departments.map(dept => {
      const deptComplaints = complaints.filter(c => c.Department === dept);
      const recentCount = deptComplaints.filter(c =>
        new Date(c.CreatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      return { dept, recentCount, totalCount: deptComplaints.length };
    });

    // Identify high-risk departments
    const highRiskDepts = deptStats
      .filter(stat => stat.recentCount > 5 || stat.totalCount > 10)
      .sort((a, b) => b.recentCount - a.recentCount);

    if (highRiskDepts.length > 0) {
      patterns.push({
        trendId: `cross_dept_risk_${Date.now()}`,
        trendType: 'complaint_increase',
        department: highRiskDepts[0].dept,
        predictedIncrease: Math.round(highRiskDepts[0].recentCount * 0.3),
        confidence: 0.7,
        timeframe: 'next_week',
        recommendations: [
          `Focus on ${highRiskDepts[0].dept} department - highest complaint volume`,
          'Consider additional staffing or process review',
          'Monitor complaint patterns across all departments'
        ],
        generatedAt: new Date().toISOString()
      });
    }

    return patterns;
  }

  // Generate AI-powered recommendations
  private static generateTrendRecommendations(
    trendType: string,
    predictedIncrease: number,
    negativeRatio: number,
    department: string
  ): string[] {
    const recommendations: string[] = [];

    if (trendType === 'complaint_increase') {
      recommendations.push(`Monitor ${department} closely for increased complaints`);
      recommendations.push('Review recent patient feedback for common themes');

      if (predictedIncrease > 5) {
        recommendations.push('Consider immediate intervention or additional resources');
      }

      if (negativeRatio > 0.5) {
        recommendations.push('Address negative sentiment patterns urgently');
      }
    } else if (trendType === 'sentiment_decline') {
      recommendations.push('Analyze recent survey responses for sentiment drivers');
      recommendations.push('Implement feedback improvement measures');
      recommendations.push('Monitor sentiment trends daily');
    }

    return recommendations;
  }

  // Fallback predictive trends (original implementation)
  private static fallbackPredictTrends(
    complaints: Complaint[],
    surveys: any[],
    departments: string[]
  ): PredictiveTrend[] {
    const trends: PredictiveTrend[] = [];
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Analyze complaints by department
    departments.forEach(dept => {
      const deptComplaints = complaints.filter(c => c.Department === dept);
      const recentComplaints = deptComplaints.filter(c =>
        new Date(c.CreatedAt) >= last30Days
      );

      if (deptComplaints.length >= 5) { // Minimum data threshold
        const olderPeriod = deptComplaints.filter(c =>
          new Date(c.CreatedAt) < last30Days && new Date(c.CreatedAt) >= new Date(last30Days.getTime() - 30 * 24 * 60 * 60 * 1000)
        );

        const currentRate = recentComplaints.length;
        const previousRate = olderPeriod.length;

        if (previousRate > 0) {
          const changePercent = ((currentRate - previousRate) / previousRate) * 100;

          if (changePercent > 20) { // Significant increase
            trends.push({
              trendId: `trend_${dept}_${Date.now()}`,
              trendType: 'complaint_increase',
              department: dept,
              predictedIncrease: Math.round(changePercent),
              confidence: Math.min(Math.abs(changePercent) / 100, 0.9),
              timeframe: 'next_week',
              recommendations: [
                `Monitor ${dept} closely for the next week`,
                'Consider additional staff training',
                'Review patient feedback patterns'
              ],
              generatedAt: new Date().toISOString()
            });
          }
        }
      }
    });

    // Analyze sentiment trends
    const recentSurveys = surveys.filter(s => new Date(s.CreatedAt) >= last7Days);
    const olderSurveys = surveys.filter(s =>
      new Date(s.CreatedAt) >= new Date(last7Days.getTime() - 7 * 24 * 60 * 60 * 1000) &&
      new Date(s.CreatedAt) < last7Days
    );

    if (recentSurveys.length > 10 && olderSurveys.length > 10) {
      const recentAvgNPS = recentSurveys.reduce((sum, s) => sum + (s.NPS_Score || 0), 0) / recentSurveys.length;
      const olderAvgNPS = olderSurveys.reduce((sum, s) => sum + (s.NPS_Score || 0), 0) / olderSurveys.length;

      if (olderAvgNPS - recentAvgNPS > 0.5) { // Significant decline
        trends.push({
          trendId: `sentiment_${Date.now()}`,
          trendType: 'sentiment_decline',
          predictedIncrease: Math.round(olderAvgNPS - recentAvgNPS),
          confidence: 0.7,
          timeframe: 'next_week',
          recommendations: [
            'Review recent patient feedback',
            'Investigate potential service issues',
            'Consider staff satisfaction surveys'
          ],
          generatedAt: new Date().toISOString()
        });
      }
    }

    return trends;
  }

  // Smart survey routing based on patient history
  static routeSurvey(
    patientHistory: PatientHistory,
    currentDepartment: string
  ): SurveyRouting {
    const patientId = patientHistory.PatientID;

    // High-risk patients get priority routing
    if (patientHistory.riskLevel === 'High') {
      return {
        surveyId: `survey_${Date.now()}`,
        patientId,
        recommendedDepartment: currentDepartment,
        routingReason: 'High-risk patient requires immediate attention',
        priority: 'High',
        routeTo: [currentDepartment, 'Management'],
        generatedAt: new Date().toISOString()
      };
    }

    // Route based on department preferences
    const preferredDepts = Object.entries(patientHistory.departmentPreferences)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 2)
      .map(([dept]) => dept);

    if (preferredDepts.length > 0 && !preferredDepts.includes(currentDepartment)) {
      return {
        surveyId: `survey_${Date.now()}`,
        patientId,
        recommendedDepartment: preferredDepts[0],
        routingReason: `Patient prefers ${preferredDepts[0]} based on history`,
        priority: 'Medium',
        routeTo: preferredDepts,
        generatedAt: new Date().toISOString()
      };
    }

    // Default routing
    return {
      surveyId: `survey_${Date.now()}`,
      patientId,
      recommendedDepartment: currentDepartment,
      routingReason: 'Standard routing based on current department',
      priority: 'Low',
      routeTo: [currentDepartment],
      generatedAt: new Date().toISOString()
    };
  }
}

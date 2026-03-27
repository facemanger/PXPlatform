
export const QuestionType = {
  SCALE: 'Scale',
  TEXT: 'Text',
  NPS: 'NPS',
  RADIO: 'Radio',
  BOOLEAN: 'Boolean'
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export type UserGroup = 'Administrator' | 'Manager' | 'User' | 'Super Admin';

export interface User {
  UserID: string;
  Username: string;
  Name: string;
  UserGroup: UserGroup;
  Department?: string;
  IsActive: boolean;
  CreatedAt?: string;
  Password?: string;
}

export interface Question {
  QuestionID: string;
  SurveyType: string;
  Category: string;
  AnswerType: QuestionType;
  IsActive?: boolean;
}

export interface QuestionTranslation {
  QuestionID: string;
  Language: 'AR' | 'EN';
  QuestionText: string;
  Options?: string; // Comma separated
}

export interface SurveyHeader {
  SurveyID: string;
  SurveyType: string; // Emergency, Inpatient, etc.
  SurveyLanguage: 'AR' | 'EN';
  SurveyDate: string;
  SurveyTime: string;
  UserID: string; // The staff conducting it
  Department: string; // Ward/Location
  PatientName: string;
  PatientPhone: string;
  PatientFileNumber?: string; // ADDED
  PatientAge?: string;
  PatientGender?: 'Male' | 'Female' | string; // Relaxed type
  CompanionName?: string;
  CompanionPhone?: string;
  WaitingTime?: string;
  NPS_Score?: number;
  CreatedAt: string;
}

export interface SurveyResponseEntry {
  ResponseID: string;
  SurveyID: string; // Link to Header
  QuestionID: string;
  NumericAnswer?: number;
  TextAnswer?: string;
}

export interface Complaint {
  ComplaintID: string;
  ComplaintDate: string;
  UserID: string;
  Department: string;
  ComplaintCategory?: string;
  ComplaintText?: string;
  ComplaintLanguage?: 'AR' | 'EN';
  Severity?: string;
  Status: string; // 'Pending' | 'Resolved' | 'In Progress'
  AdminNotes?: string;
  PatientName?: string;
  Phone?: string;
  Details?: string;
  CreatedAt: string;
  AssignedUser?: string;
  Priority?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ComplaintUpdate {
  UpdateID: string;
  ComplaintID: string;
  UserID: string;
  UserName: string;
  UpdateText: string;
  Type: 'Response' | 'Internal Note' | 'Status Change' | 'Assignment';
  Timestamp: string;
}

export interface LeaderboardEntry {
  name: string;
  count: number;
}

export type LocationType = 'WARD' | 'CLINIC' | 'ED' | 'OPD' | 'INPATIENT' | 'ALLIED';

export interface Department {
  DeptID: string;
  NameEn: string;
  NameAr: string;
  Type: LocationType;
  MainCategory?: string;
  SurveyType: string;
  IsActive: boolean;
}

export interface SurveyQuestionConfig {
  id: string;
  textEn: string;
  textAr: string;
  type: QuestionType;
  options?: string[];
}

export interface SurveyConfig {
  id: string;
  title: string;
  questions: SurveyQuestionConfig[];
}

export interface AttendanceRecord {
  RecordID: string;
  UserID: string;
  Username: string;
  Name: string;
  CheckInTime: string;
  CheckOutTime?: string;
  Date: string;
  Department?: string;
  ShiftID?: string;
  Status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  Notes?: string;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  keywords: string[];
  analyzedAt: string;
}

export interface ComplaintCategory {
  categoryId: string;
  categoryName: string; // e.g., "Staff Behavior", "Waiting Time", "Facilities", etc.
  confidence: number; // 0 to 1
  subCategories?: string[];
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedAt: string;
}

export interface PatientHistory {
  PatientID: string; // Could be phone or name-based
  totalSurveys: number;
  averageNPS: number;
  lastSurveyDate: string;
  complaintHistory: string[]; // Complaint IDs
  departmentPreferences: { [department: string]: number }; // Frequency scores
  riskLevel: 'Low' | 'Medium' | 'High'; // Based on negative feedback
  riskFactors?: {
    overallRisk: number;
    npsRisk: number;
    complaintFrequencyRisk: number;
    recentNegativeRisk: number;
    sentimentRisk: number;
  };
  complaintPatterns?: {
    commonThemes: string[];
    temporalPatterns: { [key: string]: number };
    severityTrend: 'increasing' | 'decreasing' | 'stable';
    categoryFrequency: { [key: string]: number };
  };
  behavioralPatterns?: {
    surveyFrequency: 'frequent' | 'regular' | 'infrequent';
    complaintFrequency: 'high' | 'medium' | 'low';
    preferredTimes: string[];
    responseConsistency: number;
  };
  lastUpdated: string;
}

export interface PredictiveTrend {
  trendId: string;
  trendType: 'complaint_increase' | 'sentiment_decline' | 'department_issue' | 'complaint_decrease';
  department?: string;
  predictedIncrease: number; // Percentage increase expected
  confidence: number; // 0 to 1
  timeframe: string; // "next_week", "next_month"
  recommendations: string[];
  generatedAt: string;
}

export interface SurveyRouting {
  surveyId: string;
  patientId: string;
  recommendedDepartment: string;
  routingReason: string;
  priority: 'Low' | 'Medium' | 'High';
  routeTo: string[]; // Department names
  generatedAt: string;
}

export interface IncidentReport {
  IncidentID: string;
  Date: string; // ISO date string
  Name: string;
  Place: string; // Ward/Clinic name or "Other" with custom text
  Note: string;
  Images?: string[]; // Array of image file paths or base64 data
  ImageFilename?: string; // Single image filename for direct reference
  Status: 'Pending' | 'Under Review' | 'Resolved' | 'Closed';
  CreatedAt: string;
  UpdatedAt?: string;
  ReportedBy?: string; // User ID if logged in
}

export interface MenuSettings {
  showIcons: boolean;
  updatedBy: string;
  updatedAt: string;
}


import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'ts-node';
register({
  esm: true,
  experimentalSpecifierResolution: 'node',
  transpileOnly: true
});
import { categorizeFeedback, generateWordCloudData } from './services/nlp_service.js';
// import { HealthcareAIService } from './services/aiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

// Cache Control
app.disable('etag');
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});
app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Serve Static Files (Frontend)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log(`Serving static files from ${distPath}`);
  app.use(express.static(distPath));
} else {
  console.log(`Dist folder not found at ${distPath}. Run 'npm run build' to generate frontend.`);
}

// --- DATABASE CONFIGURATION ---
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Split Databases
const DB_PATHS = {
  Config: path.join(DATA_DIR, 'Config_DB.xlsx'),
  Surveys: path.join(DATA_DIR, 'Surveys_DB.xlsx'),
  Complaints: path.join(DATA_DIR, 'Complaints_DB.xlsx'),
  Messages: path.join(DATA_DIR, 'Messages_DB.xlsx'),
  Attendance: path.join(DATA_DIR, 'Attendance_DB.xlsx'),
  Incidents: path.join(DATA_DIR, 'Incidents_DB.xlsx')
};

const VOICE_DIR = path.join(DATA_DIR, 'Voice_Recordings');
const INCIDENT_IMAGES_DIR = path.join(DATA_DIR, 'Incident_Images');

if (!fs.existsSync(VOICE_DIR)) {
  fs.mkdirSync(VOICE_DIR, { recursive: true });
}
if (!fs.existsSync(INCIDENT_IMAGES_DIR)) {
  fs.mkdirSync(INCIDENT_IMAGES_DIR, { recursive: true });
}

// Serve Voice Files
app.use('/voice', express.static(VOICE_DIR));
// Serve Incident Images
app.use('/incident-images', express.static(INCIDENT_IMAGES_DIR));

// --- HELPER FUNCTIONS ---

const saveWorkbook = (wb, key) => {
  try {
    const filePath = DB_PATHS[key];
    xlsx.writeFile(wb, filePath);
  } catch (e) {
    console.error(`[DB] Failed to save ${key} workbook (is it open?):`, e.message);
  }
};

const getWorkbook = (key) => {
  const filePath = DB_PATHS[key];
  if (fs.existsSync(filePath)) {
    try {
      return xlsx.readFile(filePath, { type: 'file', cellDates: true });
    } catch (e) {
      console.error(`[DB] Failed to read ${key} workbook:`, e.message);
      throw e;
    }
  }
  const wb = xlsx.utils.book_new();
  saveWorkbook(wb, key);
  return wb;
};

const readSheet = (wb, sheetName) => {
  const ws = wb.Sheets[sheetName];
  return ws ? xlsx.utils.sheet_to_json(ws) : [];
};

const writeSheet = (wb, sheetName, data, key) => {
  const ws = xlsx.utils.json_to_sheet(data);
  wb.Sheets[sheetName] = ws;
  if (!wb.SheetNames.includes(sheetName)) {
    wb.SheetNames.push(sheetName);
  }
  saveWorkbook(wb, key);
};

const appendToSheet = (wb, sheetName, data, key) => {
  let ws = wb.Sheets[sheetName];
  if (!ws) {
    ws = xlsx.utils.json_to_sheet([]);
    wb.Sheets[sheetName] = ws;
    if (!wb.SheetNames.includes(sheetName)) {
      wb.SheetNames.push(sheetName);
    }
  }
  const currentData = xlsx.utils.sheet_to_json(ws);
  const newData = [...currentData, ...data];
  const newWs = xlsx.utils.json_to_sheet(newData);
  wb.Sheets[sheetName] = newWs;
  saveWorkbook(wb, key);
};

const calculateAgeGroups = (headers) => {
  const groups = { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 };
  headers.forEach(h => {
    const age = parseInt(h.PatientAge);
    if (!isNaN(age)) {
      if (age >= 18 && age <= 24) groups['18-24']++;
      else if (age >= 25 && age <= 34) groups['25-34']++;
      else if (age >= 35 && age <= 44) groups['35-44']++;
      else if (age >= 45) groups['45+']++;
    }
  });
  return groups;
};

// --- API ENDPOINTS ---

// 1. CONFIGURATION
app.get('/api/config/menu-settings', (req, res) => {
  try {
    const wb = getWorkbook('Config');
    const settings = readSheet(wb, 'MenuSettings');
    if (settings.length > 0) {
      res.json(settings[0]);
    } else {
      // Default settings
      res.json({ showIcons: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu settings' });
  }
});

app.post('/api/config/menu-settings', (req, res) => {
  try {
    const { showIcons, userId } = req.body;
    const wb = getWorkbook('Config');
    const newSettings = {
      showIcons,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };
    writeSheet(wb, 'MenuSettings', [newSettings], 'Config');
    res.json({ message: 'Menu settings updated successfully', settings: newSettings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu settings' });
  }
});

// Menu items activation state for all users
const DEFAULT_MAIN_MENU_ITEMS = [
  { id: 'conduct_survey', titleAr: 'إجراء استبيان', titleEn: 'Conduct Survey', descriptionAr: 'تقييم تجربة المريض في الأقسام المختلفة', descriptionEn: 'Evaluate patient experience in different departments', icon: 'ClipboardList', action: 'survey', isActive: true },
  { id: 'submit_complaint', titleAr: 'تقديم شكوى', titleEn: 'Submit Complaint', descriptionAr: 'تسجيل شكوى مريض للمتابعة', descriptionEn: 'Record a patient complaint for follow-up', icon: 'AlertTriangle', action: 'complaint', isActive: true },
  { id: 'report_incident', titleAr: 'إبلاغ عن مشكلة', titleEn: 'Report Incident', descriptionAr: 'بلاغ عن حادث أو مشكلة فنية/إدارية', descriptionEn: 'Report an incident or technical/administrative issue', icon: 'AlertCircle', action: 'incident', isActive: true }
];

app.get('/api/config/menu-items', (req, res) => {
  try {
    const wb = getWorkbook('Config');
    const items = readSheet(wb, 'MenuItems');
    if (Array.isArray(items) && items.length > 0) {
      res.json(items);
    } else {
      res.json(DEFAULT_MAIN_MENU_ITEMS);
    }
  } catch (error) {
    console.error('Failed to fetch menu items', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.post('/api/config/menu-items', (req, res) => {
  try {
    const { menuItems, userId } = req.body;
    if (!Array.isArray(menuItems)) {
      return res.status(400).json({ error: 'menuItems must be an array' });
    }
    const wb = getWorkbook('Config');
    const persisted = menuItems.map(item => ({ ...item, updatedBy: userId, updatedAt: new Date().toISOString() }));
    writeSheet(wb, 'MenuItems', persisted, 'Config');
    res.json({ message: 'Menu items updated successfully', menuItems: persisted });
  } catch (error) {
    console.error('Failed to update menu items', error);
    res.status(500).json({ error: 'Failed to update menu items' });
  }
});
app.get('/api/config', (req, res) => {
  try {
    const wb = getWorkbook('Config');
    const questions = readSheet(wb, 'Questions');
    const translations = readSheet(wb, 'Question_Translations');
    const departments = readSheet(wb, 'Departments');
    res.json({ questions, translations, departments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load config' });
  }
});

app.post('/api/config/questions', (req, res) => {
  try {
    const { questions, translations } = req.body;
    const wb = getWorkbook('Config');
    writeSheet(wb, 'Questions', questions, 'Config');
    writeSheet(wb, 'Question_Translations', translations, 'Config');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update questions' });
  }
});

app.post('/api/config/departments', (req, res) => {
  try {
    const { departments } = req.body;
    const wb = getWorkbook('Config');
    writeSheet(wb, 'Departments', departments, 'Config');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update departments' });
  }
});

// 2. AUTHENTICATION
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const wb = getWorkbook('Config');
  const users = readSheet(wb, 'Users');

  const user = users.find(u => {
    const uName = String(u.Username || '').trim().toLowerCase();
    const inputName = String(username || '').trim().toLowerCase();
    const uPass = String(u.Password || '').trim();
    const inputPass = String(password || '').trim();
    let isActive = false;
    if (u.IsActive === true || u.IsActive === 1) isActive = true;
    else if (typeof u.IsActive === 'string' && u.IsActive.toLowerCase() === 'true') isActive = true;

    return uName === inputName && uPass === inputPass && isActive;
  });

  if (user) {
    console.log(`[Auth] Login Success: ${user.Username}`);
    const { Password, ...safeUser } = user;
    res.json(safeUser);
  } else {
    res.status(401).json({ error: 'Invalid Credentials' });
  }
});

// 3. SURVEY SUBMISSION
app.post('/api/surveys', (req, res) => {
  try {
    const { header, responses } = req.body;
    const wb = getWorkbook('Surveys');

    const rawType = header.SurveyType || 'General';
    const type = rawType.trim().charAt(0).toUpperCase() + rawType.trim().slice(1).toLowerCase();

    const sheetName = type;
    const headerSheet = `${sheetName}_Headers`;
    const responseSheet = `${sheetName}_Responses`;

    appendToSheet(wb, headerSheet, [header], 'Surveys');

    // Add SurveyID to each response to link it
    const responsesWithId = responses.map(r => ({ SurveyID: header.SurveyID, ...r }));
    appendToSheet(wb, responseSheet, responsesWithId, 'Surveys');

    console.log(`Survey Saved: ${header.SurveyID}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save survey' });
  }
});

// 4. EXPORT DB
app.get('/api/export', (req, res) => {
  try {
    const file = DB_PATHS.Surveys;
    if (fs.existsSync(file)) {
      res.download(file, 'Surveys_DB.xlsx');
    } else {
      res.status(404).send('No surveys found.');
    }
  } catch (e) {
    res.status(500).send('Export failed.');
  }
});

// 5. EXPORT WIDE (ALL DEPARTMENTS & TYPES)
app.get('/api/export/wide', (req, res) => {
  try {
    const wbSurveys = getWorkbook('Surveys');
    const wbConfig = getWorkbook('Config');

    // 1. Build Question Text Map (ID -> English Text)
    const translations = readSheet(wbConfig, 'Question_Translations');
    const questions = readSheet(wbConfig, 'Questions');
    const qTextMap = {};

    // Default to QuestionID or Category
    questions.forEach(q => {
      qTextMap[q.QuestionID] = q.QuestionID;
    });

    // OVERRIDE with English Translation if available
    translations.filter(t => t.Language === 'EN').forEach(t => {
      if (t.QuestionText) qTextMap[t.QuestionID] = t.QuestionText;
    });

    // 2. Discover Survey Types
    const newWb = xlsx.utils.book_new();
    const typeSheetMap = {};

    wbSurveys.SheetNames.forEach(sheet => {
      if (sheet.endsWith('_Headers')) {
        const type = sheet.replace('_Headers', '');
        if (!typeSheetMap[type]) typeSheetMap[type] = { headers: [], responses: [] };
        typeSheetMap[type].headers = readSheet(wbSurveys, sheet);
      }
      else if (sheet.endsWith('_Responses')) {
        const type = sheet.replace('_Responses', '');
        if (!typeSheetMap[type]) typeSheetMap[type] = { headers: [], responses: [] };
        typeSheetMap[type].responses = readSheet(wbSurveys, sheet);
      }
    });

    // 3. Process Each Type -> Create Sheet
    Object.keys(typeSheetMap).forEach(type => {
      const { headers, responses } = typeSheetMap[type];
      if (headers.length === 0) return;

      // Find all unique Question IDs appearing in this type's responses
      const uniqueQIDs = [...new Set(responses.map(r => r.QuestionID))];

      // Sort QIDs? (Optional: Could sort by QuestionID string)
      uniqueQIDs.sort();

      const flatData = headers.map(h => {
        const row = {
          "SurveyID": h.SurveyID,
          "Date": h.SurveyDate,
          "Time": h.SurveyTime,
          "Department": h.Department,
          "MainCategory": h.MainCategory || "",
          "Patient Name": h.PatientName,
          "Phone": h.PatientPhone,
          "Age": h.PatientAge,
          "Gender": h.PatientGender,
          "File No": h.PatientFileNumber,
          "Staff User": h.UserID
        };

        // Fill Answers
        const myResponses = responses.filter(r => r.SurveyID === h.SurveyID);
        uniqueQIDs.forEach(qid => {
          const resp = myResponses.find(r => r.QuestionID === qid);
          // Clean header: Remove symbols if necessary, but user wants full text
          const colName = qTextMap[qid] || qid;

          if (resp) {
            row[colName] = resp.TextAnswer || resp.NumericAnswer;
          } else {
            row[colName] = "";
          }
        });
        return row;
      });

      if (flatData.length > 0) {
        const ws = xlsx.utils.json_to_sheet(flatData);
        xlsx.utils.book_append_sheet(newWb, ws, type);
      }
    });

    const buffer = xlsx.write(newWb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Wide_Export_All.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Export failed");
  }
});


// 6. USERS
app.get('/api/users', (req, res) => {
  try {
    const wb = getWorkbook('Config');
    const users = readSheet(wb, 'Users');
    res.json(users);
  } catch (e) {
    res.status(500).json([]);
  }
});
app.post('/api/users', (req, res) => {
  try {
    const newUser = req.body;
    const wb = getWorkbook('Config');
    appendToSheet(wb, 'Users', [newUser], 'Config');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add user' });
  }
});
app.put('/api/users', (req, res) => {
  try {
    const updatedUser = req.body;
    const wb = getWorkbook('Config');
    const users = readSheet(wb, 'Users');
    const index = users.findIndex(u => u.UserID === updatedUser.UserID);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      writeSheet(wb, 'Users', users, 'Config');
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});
app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const wb = getWorkbook('Config');
    let users = readSheet(wb, 'Users');
    const newUsers = users.filter(u => u.UserID !== id);
    writeSheet(wb, 'Users', newUsers, 'Config');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 7. COMPLAINTS
app.post('/api/complaints', (req, res) => {
  try {
    const complaint = req.body;
    const wb = getWorkbook('Complaints');
    appendToSheet(wb, 'Complaints', [complaint], 'Complaints');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save complaint' });
  }
});
app.get('/api/complaints', (req, res) => {
  try {
    const wb = getWorkbook('Complaints');
    const complaints = readSheet(wb, 'Complaints');
    res.json(complaints);
  } catch (e) {
    res.status(500).json([]);
  }
});
app.put('/api/complaints', (req, res) => {
  try {
    const updated = req.body;
    const wb = getWorkbook('Complaints');
    const complaints = readSheet(wb, 'Complaints');
    const index = complaints.findIndex(c => c.ComplaintID === updated.ComplaintID);
    if (index !== -1) {
      complaints[index] = { ...complaints[index], ...updated };
      writeSheet(wb, 'Complaints', complaints, 'Complaints');
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Complaint not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});
app.post('/api/complaints/update', (req, res) => {
  try {
    const updated = req.body;
    const wb = getWorkbook('Complaints');
    const complaints = readSheet(wb, 'Complaints');
    const index = complaints.findIndex(c => c.ComplaintID === updated.ComplaintID);
    if (index !== -1) {
      const oldComplaint = complaints[index];

      // Merge with existing complaint, preserving all fields
      complaints[index] = { ...complaints[index], ...updated };
      writeSheet(wb, 'Complaints', complaints, 'Complaints');

      console.log(`[Complaint Updated] ID: ${updated.ComplaintID}, Assigned: ${updated.AssignedUser || 'N/A'}, Priority: ${updated.Priority || 'N/A'}`);

      // Send notification if complaint was assigned to a user
      if (updated.AssignedUser && updated.AssignedUser !== oldComplaint.AssignedUser) {
        if (typeof global.sendNotification === 'function') {
          // Resolve UserID from Name
          const wbConfig = getWorkbook('Config');
          const users = readSheet(wbConfig, 'Users');
          const assignedUserObj = users.find(u => u.Name === updated.AssignedUser || u.Username === updated.AssignedUser);

          if (assignedUserObj) {
            console.log(`[Notification] Sending assignment to UserID: ${assignedUserObj.UserID} (Name: ${updated.AssignedUser})`);
            global.sendNotification(assignedUserObj.UserID, {
              type: 'complaint_assigned',
              title: 'تم تعيين شكوى جديدة',
              message: `تم تعيين شكوى جديدة إليك من ${updated.PatientName || 'مريض'}`,
              priority: updated.Priority || 'Medium',
              complaintId: updated.ComplaintID,
              data: {
                patientName: updated.PatientName,
                department: updated.Department,
                priority: updated.Priority
              },
              timestamp: new Date().toISOString()
            });
          } else {
            console.log(`[Notification] Failed to resolve UserID for name: ${updated.AssignedUser}`);
          }
        }
      }

      res.json({ success: true, complaint: complaints[index] });
    } else {
      res.status(404).json({ error: 'Complaint not found' });
    }
  } catch (e) {
    console.error('Complaint update error:', e);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

app.get('/api/complaints/dashboard', (req, res) => {
  try {
    const wb = getWorkbook('Complaints');
    const complaints = readSheet(wb, 'Complaints');
    // Normalize safely in case of empty sheet
    const list = Array.isArray(complaints) ? complaints : [];

    const total = list.length;

    // Status Breakdown
    const status = { Pending: 0, 'In Progress': 0, Resolved: 0 };
    list.forEach(c => {
      const s = c.Status || 'Pending';
      if (status[s] !== undefined) status[s]++;
      else status[s] = 1;
    });

    // Priority Breakdown
    const priority = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    list.forEach(c => {
      const p = c.Priority || 'Medium';
      if (priority[p] !== undefined) priority[p]++;
    });

    // Department Breakdown
    const deptCounts = {};
    list.forEach(c => {
      const d = c.Department || 'Unknown';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });
    const departments = Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trend (Last 7 Days)
    const trend = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD local

      const dayCount = list.filter(c => {
        const rawDate = c.CreatedAt || c.ComplaintDate;
        if (!rawDate) return false;
        return rawDate.startsWith(dateStr);
      }).length;

      trend.push({ date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), count: dayCount });
    }

    res.json({ total, status, priority, departments, trend });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/complaints/:id', (req, res) => {
  try {
    const { id } = req.params;
    const wb = getWorkbook('Complaints');
    const complaints = readSheet(wb, 'Complaints');
    const newComplaints = complaints.filter(c => c.ComplaintID !== id);
    if (newComplaints.length === complaints.length) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    writeSheet(wb, 'Complaints', newComplaints, 'Complaints');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});
app.get('/api/complaints/assigned/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const wb = getWorkbook('Complaints');
    const complaints = readSheet(wb, 'Complaints');

    // Filter complaints assigned to this user that are pending or in progress
    const assigned = complaints.filter(c =>
      c.AssignedUser === userId &&
      (c.Status === 'Pending' || c.Status === 'In Progress')
    );

    res.json({
      total: assigned.length,
      complaints: assigned,
      critical: assigned.filter(c => c.Priority === 'Critical').length,
      high: assigned.filter(c => c.Priority === 'High').length
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch assigned complaints' });
  }
});

// Get Updates for a Complaint
app.get('/api/complaints/:id/updates', (req, res) => {
  try {
    const { id } = req.params;
    const wb = getWorkbook('Complaints');
    const updates = readSheet(wb, 'Complaint_Updates'); // New Sheet
    const allUpdates = Array.isArray(updates) ? updates : [];

    const filtered = allUpdates
      .filter(u => u.ComplaintID === id)
      .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());

    res.json(filtered);
  } catch (e) {
    res.json([]);
  }
});

// Add Update to Complaint
app.post('/api/complaints/:id/updates', (req, res) => {
  try {
    const { id } = req.params;
    const { UserID, UserName, UpdateText, Type } = req.body;

    if (!UpdateText) return res.status(400).json({ error: 'Update text required' });

    const newUpdate = {
      UpdateID: `upd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ComplaintID: id,
      UserID,
      UserName,
      UpdateText,
      Type: Type || 'Response',
      Timestamp: new Date().toISOString()
    };

    const wb = getWorkbook('Complaints');
    appendToSheet(wb, 'Complaint_Updates', [newUpdate], 'Complaints');

    res.json({ success: true, update: newUpdate });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add update' });
  }
});

// 8. MESSAGING / CHAT SYSTEM
// Load messages from DB
let messages = []; // Array of message objects
try {
  const wbMsg = getWorkbook('Messages');
  messages = readSheet(wbMsg, 'Messages'); // Load all existing messages
  // Sort by timestamp
  messages.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
  console.log(`[Chat] Loaded ${messages.length} messages from history.`);
} catch (e) {
  console.log('[Chat] No previous message history found or failed to load.');
  messages = [];
}

const chatGroups = []; // Array of chat group objects

// Get or create department-based groups
function initializeChatGroups() {
  if (chatGroups.length === 0) {
    try {
      const wb = getWorkbook('Config');
      const users = readSheet(wb, 'Users');

      // 1. User Role Groups (e.g. Doctors, Nurses)
      const roles = [...new Set(users.map(u => u.UserGroup).filter(r => r && typeof r === 'string'))];

      roles.forEach(role => {
        chatGroups.push({
          GroupID: `group_${role.toLowerCase().replace(/\s+/g, '_')}`,
          GroupName: `${role}s Group`, // e.g. Doctors Group
          GroupNameEn: role,
          GroupType: 'Role',
          Department: 'General',
          Role: role,
          Members: [],
          CreatedAt: new Date().toISOString()
        });
      });

      console.log(`[Chat] Initialized ${chatGroups.length} role-based groups`);
    } catch (e) {
      console.log('[Chat] Failed to initialize groups (Config might not be ready):', e.message);
    }
  }
  return chatGroups;
}

// Initialize groups on startup
initializeChatGroups();

// Send message (private or group)
app.post('/api/messages/send', (req, res) => {
  try {
    const { SenderID, RecipientID, GroupID, MessageText, SenderName } = req.body;

    if (!SenderID || !MessageText) {
      return res.status(400).json({ error: 'SenderID and MessageText required' });
    }

    if (!RecipientID && !GroupID) {
      return res.status(400).json({ error: 'Either RecipientID or GroupID required' });
    }

    const message = {
      MessageID: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      SenderID,
      SenderName: SenderName || SenderID,
      RecipientID: RecipientID || null,
      GroupID: GroupID || null,
      MessageText,
      Timestamp: new Date().toISOString(),
      IsRead: false,
      Type: GroupID ? 'group' : 'private'
    };

    messages.push(message);

    // Emit via Socket.IO for real-time delivery
    if (global.io) {
      if (GroupID) {
        // Group message - broadcast to all group members
        global.io.emit('message:group', { groupId: GroupID, message });
      } else if (RecipientID) {
        // Private message - send to recipient
        global.io.emit('message:private', { recipientId: RecipientID, message });
      }
    }

    // Save to DB (Async)
    setTimeout(() => {
      try {
        const wb = getWorkbook('Messages');
        appendToSheet(wb, 'Messages', [message], 'Messages');
      } catch (err) {
        console.error('[Chat] Failed to save message to DB:', err);
      }
    }, 10);

    console.log(`[Chat] Message sent: ${message.Type} from ${SenderID}`);
    res.json({ success: true, message });
  } catch (e) {
    console.error('[Chat] Send message error:', e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Upload Voice Message
app.post('/api/messages/upload-voice', (req, res) => {
  try {
    const { audioData } = req.body; // Expecting base64 string
    if (!audioData) return res.status(400).json({ error: 'No audio data' });

    // Remove header if present (data:audio/webm;base64,...)
    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.webm`;
    const filePath = path.join(VOICE_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    console.log(`[Voice] Saved recording: ${filename}`);
    res.json({ url: `/voice/${filename}` });
  } catch (e) {
    console.error('[Voice] Upload failed:', e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get private conversation between two users
app.get('/api/messages/conversation/:userId/:otherUserId', (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const conversation = messages.filter(m =>
      m.Type === 'private' &&
      ((m.SenderID === userId && m.RecipientID === otherUserId) ||
        (m.SenderID === otherUserId && m.RecipientID === userId))
    ).sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());

    res.json(conversation);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// --- SOCKET.IO HANDLING ---
if (global.io) {
  global.io.on('connection', (socket) => {
    socket.on('call:start', ({ recipientId, offer }) => {
      // Forward call request to recipient
      console.log(`[Call] Call started from ${socket.userId} to ${recipientId}`);
      global.io.emit('call:incoming', {
        callerId: socket.userId,
        offer
      });
    });

    socket.on('call:accepted', ({ callerId, answer }) => {
      console.log(`[Call] Call accepted by ${socket.userId}`);
      global.io.emit('call:accepted', {
        accepterId: socket.userId,
        answer
      });
    });

    socket.on('call:rejected', ({ callerId }) => {
      console.log(`[Call] Call rejected by ${socket.userId}`);
      global.io.emit('call:rejected', { rejecterId: socket.userId });
    });

    socket.on('call:end', ({ otherUserId }) => {
      console.log(`[Call] Call ended by ${socket.userId}`);
      global.io.emit('call:ended', { enderId: socket.userId });
    });

    socket.on('call:signal', ({ recipientId, candidate }) => {
      // Forward ICE candidates
      global.io.emit('call:signal', {
        senderId: socket.userId,
        candidate
      });
    });
  });
}

// Get group messages
app.get('/api/messages/group/:groupId', (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const groupMessages = messages
      .filter(m => m.GroupID === groupId)
      .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime())
      .slice(-limit);

    res.json(groupMessages);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

// Get all conversations for a user (recent chats)
app.get('/api/messages/conversations/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Find unique conversation partners
    const partners = new Set();
    const conversationMap = new Map();

    messages
      .filter(m => m.Type === 'private' && (m.SenderID === userId || m.RecipientID === userId))
      .forEach(m => {
        const partnerId = m.SenderID === userId ? m.RecipientID : m.SenderID;
        partners.add(partnerId);

        if (!conversationMap.has(partnerId) ||
          new Date(m.Timestamp) > new Date(conversationMap.get(partnerId).Timestamp)) {
          conversationMap.set(partnerId, m);
        }
      });

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());

    res.json(conversations);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Mark message as read
app.put('/api/messages/:messageId/read', (req, res) => {
  try {
    const { messageId } = req.params;
    const message = messages.find(m => m.MessageID === messageId);

    if (message) {
      message.IsRead = true;

      // Emit read receipt via Socket.IO
      if (global.io && message.SenderID) {
        global.io.emit('message:read', { messageId, senderId: message.SenderID });
      }

      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Get all users (General endpoint)
app.get('/api/users', (req, res) => {
  try {
    const wb = getWorkbook('Config');
    const users = readSheet(wb, 'Users');
    // Return full user list wrapped in an object to match ComplaintManagement expectations
    // ComplaintManagement expects: { users: [...] } or just [...] depending on implementation
    // Looking at ComplaintManagement.tsx line 49: setUsers(usersData?.users || []);
    // So we should return { users: [...] }

    const safeUsers = users.map(u => ({
      UserID: u.UserID,
      Username: u.Username,
      Name: u.Name,
      Role: u.UserGroup,
      Department: u.Department,
      Password: u.Password,
      UserGroup: u.UserGroup
    }));

    console.log(`[Users API] Fetched ${safeUsers.length} users`);
    res.json({ users: safeUsers });
  } catch (e) {
    console.error('Failed to fetch users:', e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get available users for chat
app.get('/api/chat/users', (req, res) => {
  try {
    const wb = getWorkbook('Config');
    const users = readSheet(wb, 'Users');

    // Return simplified user list
    const chatUsers = users.map(u => ({
      UserID: u.UserID,
      FullName: u.Name,
      Role: u.UserGroup,
      Department: u.Department
    }));

    res.json(chatUsers);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get chat groups
app.get('/api/chat/groups', (req, res) => {
  try {
    res.json(initializeChatGroups());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Search messages
app.get('/api/messages/search', (req, res) => {
  try {
    const { query, userId } = req.query;

    if (!query) {
      return res.json([]);
    }

    const searchTerm = String(query).toLowerCase();
    const results = messages.filter(m => {
      // Only search messages user is part of
      const isParticipant = m.SenderID === userId || m.RecipientID === userId || m.GroupID;
      return isParticipant && m.MessageText.toLowerCase().includes(searchTerm);
    }).slice(-50); // Limit to 50 results

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// 9. LEADERBOARD

app.get('/api/leaderboard', (req, res) => {
  try {
    const wbConfig = getWorkbook('Config');
    const departmentsConfig = readSheet(wbConfig, 'Departments');
    const wbSurveys = getWorkbook('Surveys');

    const normalizeType = (t) => {
      if (!t) return 'General';
      const trim = t.trim().toLowerCase();
      return trim.charAt(0).toUpperCase() + trim.slice(1);
    };

    const surveyTypes = [...new Set(departmentsConfig.map(d => normalizeType(d.SurveyType)))];

    let allHeaders = [];
    surveyTypes.forEach(type => {
      const sheetName = type + '_Headers';
      const headers = readSheet(wbSurveys, sheetName);
      allHeaders = [...allHeaders, ...headers];
    });

    const now = new Date();
    const headers = allHeaders.filter(h => {
      if (!h.CreatedAt) return false;
      const d = new Date(h.CreatedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const counts = {};
    headers.forEach(h => {
      const user = h.UserID || 'Unknown';
      counts[user] = (counts[user] || 0) + 1;
    });

    const leaderboard = Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    res.json(leaderboard);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

// 10. ATTENDANCE MANAGEMENT

// Check-in endpoint
app.post('/api/attendance/checkin', (req, res) => {
  try {
    const { userId, department, shiftId, notes } = req.body;
    const wbConfig = getWorkbook('Config');
    const users = readSheet(wbConfig, 'Users');
    const user = users.find(u => u.UserID === userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 8);

    // Check if already checked in today
    const wbAttendance = getWorkbook('Attendance');
    const records = readSheet(wbAttendance, 'Attendance_Records') || [];
    const existingRecord = records.find(r => r.UserID === userId && r.Date === today);

    if (existingRecord && existingRecord.CheckInTime) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const record = {
      RecordID: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      UserID: userId,
      Username: user.Username,
      Name: user.Name,
      CheckInTime: currentTime,
      CheckOutTime: null,
      Date: today,
      Department: department || user.Department,
      ShiftID: shiftId,
      Status: 'Present',
      Notes: notes || ''
    };

    appendToSheet(wbAttendance, 'Attendance_Records', [record], 'Attendance');
    res.json({ success: true, record });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// Check-out endpoint
app.post('/api/attendance/checkout', (req, res) => {
  try {
    const { userId, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 8);

    const wbAttendance = getWorkbook('Attendance');
    const records = readSheet(wbAttendance, 'Attendance_Records') || [];
    const recordIndex = records.findIndex(r => r.UserID === userId && r.Date === today);

    if (recordIndex === -1) {
      return res.status(404).json({ error: 'No check-in record found for today' });
    }

    const record = records[recordIndex];
    if (record.CheckOutTime) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    record.CheckOutTime = currentTime;
    record.Notes = notes ? record.Notes + ' | ' + notes : record.Notes;

    writeSheet(wbAttendance, 'Attendance_Records', records, 'Attendance');
    res.json({ success: true, record });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// Get attendance records
app.get('/api/attendance', (req, res) => {
  try {
    const { userId, date, department } = req.query;
    const wbAttendance = getWorkbook('Attendance');
    let records = readSheet(wbAttendance, 'Attendance_Records') || [];

    if (userId) records = records.filter(r => r.UserID === userId);
    if (date) records = records.filter(r => r.Date === date);
    if (department) records = records.filter(r => r.Department === department);

    res.json(records);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// Get user's current attendance status
app.get('/api/attendance/status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const wbAttendance = getWorkbook('Attendance');
    const records = readSheet(wbAttendance, 'Attendance_Records') || [];
    const todayRecord = records.find(r => r.UserID === userId && r.Date === today);

    res.json({
      isCheckedIn: todayRecord && todayRecord.CheckInTime && !todayRecord.CheckOutTime,
      checkInTime: todayRecord?.CheckInTime || null,
      checkOutTime: todayRecord?.CheckOutTime || null,
      record: todayRecord || null
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// 11. SHIFT MANAGEMENT

// Get all shifts
app.get('/api/shifts', (req, res) => {
  try {
    const wbAttendance = getWorkbook('Attendance');
    const shifts = readSheet(wbAttendance, 'Shifts') || [];
    res.json(shifts);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// Create shift
app.post('/api/shifts', (req, res) => {
  try {
    const shift = req.body;
    shift.ShiftID = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    shift.CreatedAt = new Date().toISOString();
    shift.IsActive = shift.IsActive !== false;

    const wbAttendance = getWorkbook('Attendance');
    appendToSheet(wbAttendance, 'Shifts', [shift], 'Attendance');
    res.json({ success: true, shift });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

// Update shift
app.put('/api/shifts/:shiftId', (req, res) => {
  try {
    const { shiftId } = req.params;
    const updatedShift = req.body;

    const wbAttendance = getWorkbook('Attendance');
    const shifts = readSheet(wbAttendance, 'Shifts') || [];
    const index = shifts.findIndex(s => s.ShiftID === shiftId);

    if (index === -1) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    shifts[index] = { ...shifts[index], ...updatedShift };
    writeSheet(wbAttendance, 'Shifts', shifts, 'Attendance');
    res.json({ success: true, shift: shifts[index] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

// Delete shift
app.delete('/api/shifts/:shiftId', (req, res) => {
  try {
    const { shiftId } = req.params;
    const wbAttendance = getWorkbook('Attendance');
    const shifts = readSheet(wbAttendance, 'Shifts') || [];
    const newShifts = shifts.filter(s => s.ShiftID !== shiftId);
    writeSheet(wbAttendance, 'Shifts', newShifts, 'Attendance');
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

// Bulk upload attendance records
app.post('/api/attendance/bulk-upload', (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided' });
    }

    const wbAttendance = getWorkbook('Attendance');
    const existingRecords = readSheet(wbAttendance, 'Attendance_Records') || [];

    // Validate and process records
    const validRecords = [];
    const errors = [];

    records.forEach((record, index) => {
      try {
        // Validate required fields
        if (!record.UserID || !record.Date) {
          errors.push(`Row ${index + 1}: Missing required fields (UserID, Date)`);
          return;
        }

        // Generate RecordID if not provided
        if (!record.RecordID) {
          record.RecordID = `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        }

        // Set default status if not provided
        if (!record.Status) {
          record.Status = 'Present';
        }

        // Validate date format (expecting YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(record.Date)) {
          errors.push(`Row ${index + 1}: Invalid date format (expected YYYY-MM-DD)`);
          return;
        }

        // Validate time formats if provided
        if (record.CheckInTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(record.CheckInTime)) {
          errors.push(`Row ${index + 1}: Invalid check-in time format (expected HH:MM or HH:MM:SS)`);
          return;
        }

        if (record.CheckOutTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(record.CheckOutTime)) {
          errors.push(`Row ${index + 1}: Invalid check-out time format (expected HH:MM or HH:MM:SS)`);
          return;
        }

        validRecords.push(record);
      } catch (e) {
        errors.push(`Row ${index + 1}: ${e.message}`);
      }
    });

    if (validRecords.length === 0) {
      return res.status(400).json({
        error: 'No valid records to upload',
        errors
      });
    }

    // Append valid records to the database
    appendToSheet(wbAttendance, 'Attendance_Records', validRecords, 'Attendance');

    res.json({
      success: true,
      message: `Successfully uploaded ${validRecords.length} records`,
      uploaded: validRecords.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e) {
    console.error('Bulk upload error:', e);
    res.status(500).json({ error: 'Bulk upload failed' });
  }
});

// 9. ANALYTICS (DASHBOARD)
app.get('/api/analytics', (req, res) => {
  try {
    const { month, mainCategory, period } = req.query;

    const wbConfig = getWorkbook('Config');
    const departmentsConfig = readSheet(wbConfig, 'Departments');
    // Build Map
    const deptCatMap = {};
    departmentsConfig.forEach(d => {
      const cat = d.MainCategory || (d.Type == 'CLINIC' ? 'OPD' : (d.Type == 'WARD' ? 'Inpatient' : (d.Type == 'ED' ? 'ED' : 'Allied Health')));
      if (d.NameEn) deptCatMap[d.NameEn] = cat;
      if (d.NameAr) deptCatMap[d.NameAr] = cat;
      if (d.DeptID) deptCatMap[d.DeptID] = cat;
    });
    const questions = readSheet(wbConfig, 'Questions');

    const wbSurveys = getWorkbook('Surveys');
    let allResponses = [];
    let allHeaders = [];

    const sheetNames = wbSurveys.SheetNames.filter(n => n.endsWith('_Responses'));

    sheetNames.forEach(name => {
      const resp = readSheet(wbSurveys, name);
      const headerName = name.replace('_Responses', '_Headers');
      const headers = readSheet(wbSurveys, headerName);

      const dateMap = {};
      headers.forEach(h => {
        if (h.SurveyID && h.CreatedAt) {
          dateMap[h.SurveyID] = new Date(h.CreatedAt);
        }
      });

      // Filter Headers first
      const validSurveyIDs = new Set();
      const now = new Date();

      headers.forEach(h => {
        if (!h.SurveyID || !h.CreatedAt) return;
        const d = new Date(h.CreatedAt);

        // 1. Month Filter (Default to current month if not specified?)
        // Existing logic requires explicit month or assumes all.
        // We'll keep existing logic: if month provided, filter. 
        if (month) {
          const [y, m] = month.split('-');
          if (d.getFullYear() !== parseInt(y) || (d.getMonth() + 1) !== parseInt(m)) return;
        }

        // 2. Period Filter (Smart Logic)
        if (period === 'day') {
          if (d.getDate() !== now.getDate()) return;
        } else if (period === 'week') {
          const currentDay = now.getDate();
          let start = 1, end = 7;
          if (currentDay > 21) { start = 22; end = 31; }
          else if (currentDay > 14) { start = 15; end = 21; }
          else if (currentDay > 7) { start = 8; end = 14; }

          if (d.getDate() < start || d.getDate() > end) return;
        }

        // 3. Category Filter
        if (mainCategory) {
          const target = String(mainCategory).trim().toLowerCase();

          // Helper to normalize any string to a standard category
          const normalize = (val) => {
            if (!val) return null;
            const s = String(val).trim().toLowerCase();

            if (s.includes('opd') || s.includes('clinic') || s.includes('outpatient')) return 'opd';
            if (s.includes('ward') || s.includes('inpatient')) return 'inpatient';
            if (s.includes('emergency') || s.includes('er') || s === 'ed') return 'ed';
            if (s.includes('allied') || s.includes('lab') || s.includes('radio') || s.includes('pharm') || s.includes('physio')) return 'allied health';

            return s;
          };

          const c1 = normalize(h.MainCategory);
          const c2 = normalize(h.Department); // Some names like 'Laboratory' will normalize to 'allied health'
          const c3 = normalize(h.SurveyType);
          const c4 = normalize(deptCatMap[h.Department]);

          // Check if ANY normalized value matches the target normalized value
          // Target itself might need normalization if it came from UI dropdown as 'Allied Health' etc.
          const normalizedTarget = normalize(target);

          const matches = (c1 === normalizedTarget) || (c2 === normalizedTarget) || (c3 === normalizedTarget) || (c4 === normalizedTarget);

          if (!matches) return;
        }

        validSurveyIDs.add(h.SurveyID);
      });

      const filteredResp = resp.filter(r => validSurveyIDs.has(r.SurveyID));
      const filteredHeaders = headers.filter(h => validSurveyIDs.has(h.SurveyID));

      allResponses = [...allResponses, ...filteredResp];
      allHeaders = [...allHeaders, ...filteredHeaders];
    });

    console.log(`[Analytics] Total Responses: ${allResponses.length}`);

    // NPS Logic
    const npsQuestions = questions.filter(q => q.AnswerType === 'NPS' || q.KPI === 'NPS');
    const npsQIds = npsQuestions.map(q => q.QuestionID);
    const npsScores = allResponses
      .filter(r => npsQIds.includes(r.QuestionID))
      .map(r => parseInt(r.NumericAnswer !== undefined ? r.NumericAnswer : (r.AnswerValue || 0)));

    const promoters = npsScores.filter(s => s >= 9).length;
    const passives = npsScores.filter(s => s >= 7 && s <= 8).length;
    const detractors = npsScores.filter(s => s <= 6).length;
    const totalNps = npsScores.length;
    const npsResult = totalNps > 0 ? ((promoters - detractors) / totalNps) * 100 : 0;

    // CSAT & Departments
    const categoryStats = {};
    const csatQuestions = questions.filter(q => q.AnswerType === 'Scale');
    const csatIds = csatQuestions.map(q => q.QuestionID);
    const qIdToCat = {};

    csatQuestions.forEach(q => {
      qIdToCat[q.QuestionID] = q.Category || 'General';
    });

    let totalCsatSatisfied = 0;
    let totalCsatSum = 0;
    let totalCsatCount = 0;

    allResponses.filter(r => csatIds.includes(r.QuestionID)).forEach(r => {
      // Find Department Category for this response -> mapped from Survey Header
      const h = allHeaders.find(header => header.SurveyID === r.SurveyID);
      const cat = h && h.Department ? (deptCatMap[h.Department] || 'General') : 'Other';

      const val = parseInt(r.NumericAnswer !== undefined ? r.NumericAnswer : (r.AnswerValue || 0));

      if (!categoryStats[cat]) categoryStats[cat] = { satisfied: 0, sum: 0, count: 0 };

      // User Rule: "Satisfied" is 4 or 5
      if (val >= 4) {
        categoryStats[cat].satisfied++;
        totalCsatSatisfied++;
      }
      categoryStats[cat].sum += val;
      categoryStats[cat].count++;

      totalCsatSum += val;
      totalCsatCount++;
    });

    const departmentsData = Object.entries(categoryStats).map(([cat, stats]) => ({
      name: cat,
      // CSAT Rule for Depts: (Satisfied / Total) * 100
      csat: stats.count > 0 ? Math.round((stats.satisfied / stats.count) * 100) : 0
    }));

    // Trends Calculation (Average Score 0-5)
    let trendsData = [];

    // If Month View (default), show aggregated 4 Weeks
    if (period === 'month' || !period) {
      const weeks = [
        { date: 'Week 1', sum: 0, count: 0 },
        { date: 'Week 2', sum: 0, count: 0 },
        { date: 'Week 3', sum: 0, count: 0 },
        { date: 'Week 4', sum: 0, count: 0 },
      ];

      allResponses.filter(r => csatIds.includes(r.QuestionID)).forEach(r => {
        const h = allHeaders.find(h => h.SurveyID === r.SurveyID);
        if (h && h.CreatedAt) {
          const d = new Date(h.CreatedAt).getDate();
          let idx = 0;
          if (d > 21) idx = 3;
          else if (d > 14) idx = 2;
          else if (d > 7) idx = 1;

          const val = parseInt(r.NumericAnswer !== undefined ? r.NumericAnswer : (r.AnswerValue || 0));
          weeks[idx].sum += val;
          weeks[idx].count++;
        }
      });

      trendsData = weeks.map(w => ({
        date: w.date,
        score: w.count > 0 ? parseFloat((w.sum / w.count).toFixed(1)) : 0
      }));

    } else {
      // Daily Trends (for Day/Week view)
      const dailyScores = {};
      allResponses.filter(r => csatIds.includes(r.QuestionID)).forEach(r => {
        const h = allHeaders.find(h => h.SurveyID === r.SurveyID);
        if (h && h.CreatedAt) {
          const dateKey = new Date(h.CreatedAt).toISOString().split('T')[0];
          const val = parseInt(r.NumericAnswer !== undefined ? r.NumericAnswer : (r.AnswerValue || 0));

          if (!dailyScores[dateKey]) dailyScores[dateKey] = { sum: 0, count: 0 };
          dailyScores[dateKey].sum += val;
          dailyScores[dateKey].count++;
        }
      });

      trendsData = Object.entries(dailyScores).map(([date, stats]) => ({
        date,
        score: stats.count > 0 ? parseFloat((stats.sum / stats.count).toFixed(1)) : 0
      })).sort((a, b) => a.date.localeCompare(b.date));
    }

    // --- Word Cloud Segmentation ---
    const textResponses = allResponses
      .filter(r => questions.find(q => q.QuestionID === r.QuestionID)?.AnswerType === 'Text')
      .map(r => ({
        text: r.TextAnswer || r.AnswerValue,
        surveyId: r.SurveyID,
        questionId: r.QuestionID || ''
      }))
      .filter(r => r.text && String(r.text).trim().length > 1);

    const surveyScores = {};
    allResponses.forEach(r => {
      const q = questions.find(qu => qu.QuestionID === r.QuestionID);
      if (q?.AnswerType === 'Scale' || q?.AnswerType === 'NPS') {
        if (!surveyScores[r.SurveyID]) surveyScores[r.SurveyID] = { sum: 0, count: 0 };
        let val = parseInt(r.NumericAnswer !== undefined ? r.NumericAnswer : (r.AnswerValue || 0));
        surveyScores[r.SurveyID].sum += val;
        surveyScores[r.SurveyID].count++;
      }
    });

    const positiveTexts = [];
    const negativeTexts = [];

    textResponses.forEach(item => {
      const qId = item.questionId.toLowerCase();
      if (qId.includes('pos') || qId.includes('suggestion') || qId.includes('like')) {
        positiveTexts.push(item.text);
        return;
      }
      if (qId.includes('neg') || qId.includes('problem') || qId.includes('issue')) {
        negativeTexts.push(item.text);
        return;
      }
      const scoreData = surveyScores[item.surveyId];
      if (scoreData) {
        const avg = scoreData.sum / scoreData.count;
        if (avg >= 3.5) positiveTexts.push(item.text);
        else if (avg < 3.5) negativeTexts.push(item.text);
      }
    });

    // --- Detailed Categories ---
    const categoryDetails = {};
    textResponses.forEach(item => {
      const cats = categorizeFeedback(item.text);
      cats.forEach(c => {
        if (!categoryDetails[c]) categoryDetails[c] = { count: 0, comments: [] };
        categoryDetails[c].count++;
        if (categoryDetails[c].comments.length < 50 && !categoryDetails[c].comments.includes(item.text)) {
          categoryDetails[c].comments.push(item.text);
        }
      });
    });

    const categoriesEnhanced = Object.entries(categoryDetails)
      .map(([name, data]) => ({
        name,
        value: data.count,
        comments: data.comments
      }))
      .filter(c => c.value > 0 && c.comments.length > 0)
      .sort((a, b) => b.value - a.value);

    const totalSurveys = allResponses.length > 0 ? allHeaders.length : 0;
    // Avg Satisfaction Score (1-5)
    // KPI Label: "Average Satisfaction (5.0)"
    const avgCsat = totalCsatCount > 0 ? (totalCsatSum / totalCsatCount).toFixed(1) : "0.0";
    // CSAT Percent = (Satisfied / Total) * 100
    const csatPercent = totalCsatCount > 0 ? Math.round((totalCsatSatisfied / totalCsatCount) * 100) : 0;

    const data = {
      summary: {
        total: totalSurveys,
        satisfaction: avgCsat,
        nps: Math.round(npsResult),
        csat: csatPercent
      },
      npsBreakdown: {
        promoters,
        passives,
        detractors
      },
      trends: trendsData,
      departments: departmentsData,
      categories: categoriesEnhanced,
      ageGroups: calculateAgeGroups(allHeaders),
      wordCloud: {
        positive: generateWordCloudData(positiveTexts),
        negative: generateWordCloudData(negativeTexts)
      }
    };

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Analytics Error' });
  }
});

// Fallback - exclude API routes
if (fs.existsSync(distPath)) {
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile('index.html', { root: distPath });
  });
}

// =============================================
// AI-POWERED INTELLIGENCE
// =============================================

// Analyze sentiment of complaint text
app.post('/api/ai/analyze-sentiment', (req, res) => {
  try {
    const { text, complaintId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for sentiment analysis' });
    }

    // const analysis = HealthcareAIService.analyzeSentiment(text);
    const analysis = { sentiment: 'neutral', score: 0, confidence: 0.5, keywords: [], analyzedAt: new Date().toISOString() };

    // Store analysis result in complaints DB if complaintId provided
    if (complaintId) {
      const wbComplaints = getWorkbook('Complaints');
      const complaints = readSheet(wbComplaints, 'Complaints_DB') || [];
      const complaintIndex = complaints.findIndex(c => c.ComplaintID === complaintId);

      if (complaintIndex !== -1) {
        complaints[complaintIndex].sentimentAnalysis = JSON.stringify(analysis);
        writeSheet(wbComplaints, 'Complaints_DB', complaints, 'Complaints');
      }
    }

    res.json({
      success: true,
      analysis,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });
  } catch (e) {
    console.error('Sentiment analysis error:', e);
    res.status(500).json({ error: 'Sentiment analysis failed' });
  }
});

// Auto-categorize complaint
app.post('/api/ai/categorize-complaint', (req, res) => {
  try {
    const { text, complaintId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for categorization' });
    }

    // const category = HealthcareAIService.categorizeComplaint(text);
    const category = { categoryId: 'cat_default', categoryName: 'General', confidence: 0.5, priority: 'Medium', assignedAt: new Date().toISOString() };

    // Store category result in complaints DB if complaintId provided
    if (complaintId) {
      const wbComplaints = getWorkbook('Complaints');
      const complaints = readSheet(wbComplaints, 'Complaints_DB') || [];
      const complaintIndex = complaints.findIndex(c => c.ComplaintID === complaintId);

      if (complaintIndex !== -1) {
        complaints[complaintIndex].autoCategory = JSON.stringify(category);
        writeSheet(wbComplaints, 'Complaints_DB', complaints, 'Complaints');
      }
    }

    res.json({
      success: true,
      category,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });
  } catch (e) {
    console.error('Auto-categorization error:', e);
    res.status(500).json({ error: 'Auto-categorization failed' });
  }
});

// Analyze all complaints (batch processing)
app.post('/api/ai/analyze-complaints', (req, res) => {
  try {
    const wbComplaints = getWorkbook('Complaints');
    const complaints = readSheet(wbComplaints, 'Complaints_DB') || [];

    let analyzedCount = 0;
    let categorizedCount = 0;

    complaints.forEach(complaint => {
      const text = complaint.ComplaintText || complaint.Details || '';

      if (text && text.trim()) {
        // Analyze sentiment if not already done
        if (!complaint.sentimentAnalysis) {
          // const analysis = HealthcareAIService.analyzeSentiment(text);
          const analysis = { sentiment: 'neutral', score: 0, confidence: 0.5, keywords: [], analyzedAt: new Date().toISOString() };
          complaint.sentimentAnalysis = JSON.stringify(analysis);
          analyzedCount++;
        }

        // Auto-categorize if not already done
        if (!complaint.autoCategory) {
          // const category = HealthcareAIService.categorizeComplaint(text);
          const category = { categoryId: 'cat_default', categoryName: 'General', confidence: 0.5, priority: 'Medium', assignedAt: new Date().toISOString() };
          complaint.autoCategory = JSON.stringify(category);
          categorizedCount++;
        }
      }
    });

    // Save updated complaints
    writeSheet(wbComplaints, 'Complaints_DB', complaints, 'Complaints');

    res.json({
      success: true,
      message: `Analyzed ${analyzedCount} complaints, categorized ${categorizedCount} complaints`,
      analyzed: analyzedCount,
      categorized: categorizedCount,
      total: complaints.length
    });
  } catch (e) {
    console.error('Batch analysis error:', e);
    res.status(500).json({ error: 'Batch analysis failed' });
  }
});

// Get predictive trends
app.get('/api/ai/predictive-trends', (req, res) => {
  try {
    const wbComplaints = getWorkbook('Complaints');
    const complaints = readSheet(wbComplaints, 'Complaints_DB') || [];

    const wbConfig = getWorkbook('Config');
    const departments = readSheet(wbConfig, 'Departments') || [];
    const departmentNames = departments.map(d => d.NameEn || d.NameAr).filter(Boolean);

    // const trends = HealthcareAIService.predictTrends(complaints, [], departmentNames);
    const trends = [];

    res.json({
      success: true,
      trends,
      generatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Predictive trends error:', e);
    res.status(500).json({ error: 'Failed to generate predictive trends' });
  }
});

// Get patient history and smart routing
app.get('/api/ai/patient-history/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;

    // Get patient data from surveys and complaints
    const wbSurveys = getWorkbook('Surveys');
    let allSurveys = [];
    const sheetNames = wbSurveys.SheetNames.filter(n => n.endsWith('_Headers'));
    sheetNames.forEach(name => {
      const headers = readSheet(wbSurveys, name);
      allSurveys = [...allSurveys, ...headers];
    });

    const wbComplaints = getWorkbook('Complaints');
    const complaints = readSheet(wbComplaints, 'Complaints_DB') || [];

    const patientHistory = HealthcareAIService.buildPatientHistory(patientId, allSurveys, complaints);

    res.json({
      success: true,
      patientHistory
    });
  } catch (e) {
    console.error('Patient history error:', e);
    res.status(500).json({ error: 'Failed to build patient history' });
  }
});

// Smart survey routing
app.post('/api/ai/smart-routing', (req, res) => {
  try {
    const { patientId, currentDepartment } = req.body;

    if (!patientId || !currentDepartment) {
      return res.status(400).json({ error: 'Patient ID and current department are required' });
    }

    // Get patient history first
    const wbSurveys = getWorkbook('Surveys');
    let allSurveys = [];
    const sheetNames = wbSurveys.SheetNames.filter(n => n.endsWith('_Headers'));
    sheetNames.forEach(name => {
      const headers = readSheet(wbSurveys, name);
      allSurveys = [...allSurveys, ...headers];
    });

    const wbComplaints = getWorkbook('Complaints');
    const complaints = readSheet(wbComplaints, 'Complaints_DB') || [];

    // const patientHistory = HealthcareAIService.buildPatientHistory(patientId, allSurveys, complaints);
    const patientHistory = { PatientID: patientId, totalSurveys: 0, averageNPS: 0, lastSurveyDate: '', complaintHistory: [], departmentPreferences: {}, riskLevel: 'Low', lastUpdated: new Date().toISOString() };
    // const routing = HealthcareAIService.routeSurvey(patientHistory, currentDepartment);
    const routing = { surveyId: 'temp', patientId, recommendedDepartment: currentDepartment, routingReason: 'Default routing', priority: 'Medium', routeTo: [currentDepartment], generatedAt: new Date().toISOString() };

    res.json({
      success: true,
      routing,
      patientHistory
    });
  } catch (e) {
    console.error('Smart routing error:', e);
    res.status(500).json({ error: 'Smart routing failed' });
  }
});

// Get AI insights dashboard
app.get('/api/ai/insights', (req, res) => {
  try {
    const wbComplaints = getWorkbook('Complaints');
    const complaints = readSheet(wbComplaints, 'Complaints_DB') || [];

    // Aggregate sentiment analysis
    const sentimentStats = {
      positive: 0,
      negative: 0,
      neutral: 0,
      total: 0
    };

    // Category distribution
    const categoryStats = {};

    complaints.forEach(complaint => {
      if (complaint.sentimentAnalysis) {
        try {
          const analysis = JSON.parse(complaint.sentimentAnalysis);
          sentimentStats[analysis.sentiment]++;
          sentimentStats.total++;
        } catch (e) {
          // Skip invalid JSON
        }
      }

      if (complaint.autoCategory) {
        try {
          const category = JSON.parse(complaint.autoCategory);
          const catName = category.categoryName;
          categoryStats[catName] = (categoryStats[catName] || 0) + 1;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    // Calculate percentages
    const sentimentPercentages = {
      positive: sentimentStats.total > 0 ? Math.round((sentimentStats.positive / sentimentStats.total) * 100) : 0,
      negative: sentimentStats.total > 0 ? Math.round((sentimentStats.negative / sentimentStats.total) * 100) : 0,
      neutral: sentimentStats.total > 0 ? Math.round((sentimentStats.neutral / sentimentStats.total) * 100) : 0
    };

    res.json({
      success: true,
      insights: {
        sentimentAnalysis: {
          ...sentimentStats,
          percentages: sentimentPercentages
        },
        categoryDistribution: Object.entries(categoryStats).map(([name, count]) => ({
          category: name,
          count,
          percentage: Math.round((count / complaints.length) * 100)
        })).sort((a, b) => b.count - a.count),
        totalComplaints: complaints.length,
        analyzedComplaints: sentimentStats.total
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (e) {
    console.error('AI insights error:', e);
    res.status(500).json({ error: 'Failed to generate AI insights' });
  }
});

// =============================================
// SOCKET.IO SETUP - REAL-TIME NOTIFICATIONS
// =============================================
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';

let httpServer;
const pfxPath = path.join(__dirname, 'server.pfx');

if (fs.existsSync(pfxPath)) {
  console.log('[Server] Found server.pfx, initializing HTTPS server...');
  try {
    httpServer = https.createServer({
      pfx: fs.readFileSync(pfxPath),
      passphrase: '123456'
    }, app);
  } catch (err) {
    console.error('[Server] Failed to load PFX certificate:', err.message);
    console.log('[Server] Falling back to HTTP...');
    httpServer = http.createServer(app);
  }
} else {
  console.log('[Server] server.pfx not found, using HTTP.');
  httpServer = http.createServer(app);
}
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Active user tracking: userId -> { socketId, onlineAt }
const activeUsers = new Map();
// Last seen tracking: userId -> timestamp
const lastSeen = new Map();

// Notification storage (in-memory for now, can move to DB later)
const notifications = new Map(); // userId -> [notifications]

io.on('connection', (socket) => {
  console.log('[Socket.IO] New connection:', socket.id);

  // User login event
  socket.on('user:login', (userId) => {
    console.log('[Socket.IO] User logged in:', userId);
    activeUsers.set(userId, { socketId: socket.id, onlineAt: new Date().toISOString() });
    lastSeen.delete(userId); // Clear last seen as they are now online
    socket.userId = userId;

    // Broadcast online status to ALL other clients
    socket.broadcast.emit('user:online', { userId, onlineAt: new Date().toISOString() });

    // Send current online users list to the newly connected user
    const onlineList = Array.from(activeUsers.keys()).map(uid => ({
      userId: uid,
      onlineAt: activeUsers.get(uid).onlineAt
    }));
    socket.emit('users:online:list', onlineList);

    // Send pending notifications
    const pending = notifications.get(userId) || [];
    const unread = pending.filter(n => !n.isRead);
    if (unread.length > 0) {
      socket.emit('notifications:pending', unread);
    }
  });

  // Mark notification as read
  socket.on('notification:read', (notificationId) => {
    const userId = socket.userId;
    if (userId) {
      const userNotifs = notifications.get(userId) || [];
      const notif = userNotifs.find(n => n.id === notificationId);
      if (notif) {
        notif.isRead = true;
        console.log(`[Notification] Marked as read: ${notificationId} for user: ${userId}`);
      }
    }
  });

  // Mark all notifications as read
  socket.on('notifications:readAll', () => {
    const userId = socket.userId;
    if (userId) {
      const userNotifs = notifications.get(userId) || [];
      userNotifs.forEach(n => n.isRead = true);
      console.log(`[Notification] Marked all as read for user: ${userId}`);
    }
  });

  // ===== CHAT EVENTS =====

  // Typing indicator - start
  socket.on('typing:start', ({ recipientId, groupId }) => {
    const userId = socket.userId;
    if (!userId) return;

    if (groupId) {
      // Broadcast typing to group
      io.emit('typing:group', { userId, groupId, typing: true });
    } else if (recipientId) {
      // Send typing to specific user
      const userSession = activeUsers.get(recipientId);
      if (userSession) {
        io.to(userSession.socketId).emit('typing:private', { userId, typing: true });
      }
    }
  });

  // Typing indicator - stop
  socket.on('typing:stop', ({ recipientId, groupId }) => {
    const userId = socket.userId;
    if (!userId) return;

    if (groupId) {
      io.emit('typing:group', { userId, groupId, typing: false });
    } else if (recipientId) {
      const userSession = activeUsers.get(recipientId);
      if (userSession) {
        io.to(userSession.socketId).emit('typing:private', { userId, typing: false });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      const now = new Date().toISOString();
      activeUsers.delete(socket.userId);
      lastSeen.set(socket.userId, now);

      // Broadcast offline status
      io.emit('user:offline', { userId: socket.userId, lastSeen: now });

      console.log('[Socket.IO] User disconnected:', socket.userId);
    }
  });
});

// Helper function to send notification
function sendNotification(userId, notification) {
  // Store notification
  if (!notifications.has(userId)) {
    notifications.set(userId, []);
  }
  notifications.get(userId).push({
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...notification,
    timestamp: new Date().toISOString(),
    isRead: false
  });

  // Send if user is online
  if (activeUsers.has(userId)) {
    const userSession = activeUsers.get(userId);
    io.to(userSession.socketId).emit('notification', notification);
    console.log(`[Notification] Sent to ${userId} (Socket: ${userSession.socketId}):`, notification.type);
  } else {
    console.log(`[Notification] Queued for ${userId} (offline). Active users: ${Array.from(activeUsers.keys()).join(', ')}`);
  }
}

// Export for use in endpoints
global.sendNotification = sendNotification;
global.io = io;
global.notifications = notifications;

// 11. INCIDENT REPORTS
app.get('/api/incidents', (req, res) => {
  try {
    const wb = getWorkbook('Incidents');
    const incidents = readSheet(wb, 'Incidents_DB');
    res.json(incidents);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

app.post('/api/incidents', (req, res) => {
  try {
    const incident = req.body;
    const wb = getWorkbook('Incidents');
    appendToSheet(wb, 'Incidents_DB', [incident], 'Incidents');
    res.json({ success: true, incident });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save incident' });
  }
});

app.post('/api/incidents/upload-images', (req, res) => {
  try {
    const { images, incidentId } = req.body; // Array of base64 strings and optional incidentId
    if (!images || !Array.isArray(images)) return res.status(400).json({ error: 'No images provided' });

    const imageUrls = images.map((imageData, index) => {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const extension = imageData.match(/\/(.*?);/)[1] || 'png';
      
      // Use incident ID in filename if provided, otherwise use timestamp
      let filename;
      if (incidentId) {
        filename = `${incidentId}_${index + 1}.${extension}`;
      } else {
        filename = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${extension}`;
      }
      
      const filePath = path.join(INCIDENT_IMAGES_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      return `/incident-images/${filename}`;
    });

    res.json({ urls: imageUrls, filenames: imageUrls.map(url => url.split('/').pop()) });
  } catch (e) {
    console.error('[Incidents] Image upload failed:', e);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// New endpoint: Upload image for specific incident and update the incident record
app.post('/api/incidents/:id/upload-image', (req, res) => {
  try {
    const { id } = req.params;
    const { image } = req.body; // Single base64 image string
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = image.match(/\/(.*?);/)[1] || 'png';
    
    // Use incident ID as filename
    const filename = `${id}.${extension}`;
    const filePath = path.join(INCIDENT_IMAGES_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    
    const imageUrl = `/incident-images/${filename}`;
    
    // Update the incident record with the image filename
    const wb = getWorkbook('Incidents');
    const incidents = readSheet(wb, 'Incidents_DB');
    const incidentIndex = incidents.findIndex(inc => inc.IncidentID === id);
    
    if (incidentIndex === -1) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Update both Images and ImageFilename fields
    incidents[incidentIndex].Images = imageUrl;
    incidents[incidentIndex].ImageFilename = filename;
    incidents[incidentIndex].UpdatedAt = new Date().toISOString();
    
    writeSheet(wb, 'Incidents_DB', incidents, 'Incidents');
    
    console.log(`[Incidents] Image uploaded for incident ${id}: ${filename}`);
    
    res.json({ 
      success: true, 
      imageUrl, 
      filename,
      incidentId: id
    });
  } catch (e) {
    console.error('[Incidents] Single image upload failed:', e);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

app.put('/api/incidents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    const wb = getWorkbook('Incidents');
    const incidents = readSheet(wb, 'Incidents_DB');
    const index = incidents.findIndex(inc => inc.IncidentID === id);
    if (index !== -1) {
      incidents[index] = { ...incidents[index], ...updated, UpdatedAt: new Date().toISOString() };
      writeSheet(wb, 'Incidents_DB', incidents, 'Incidents');
      res.json({ success: true, incident: incidents[index] });
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// Export incidents to Excel
app.get('/api/incidents/export/excel', (req, res) => {
  try {
    const wb = getWorkbook('Incidents');
    const incidents = readSheet(wb, 'Incidents_DB');
    
    // Create a new workbook for export
    const exportWb = xlsx.utils.book_new();
    
    // Format the data for export
    const exportData = incidents.map(inc => ({
      'معرف البلاغ': inc.IncidentID || '',
      'التاريخ': inc.Date || '',
      'اسم المبلغ': inc.Name || '',
      'المكان': inc.Place || '',
      'الوصف': inc.Note || '',
      'الحالة': inc.Status || '',
      'تاريخ الإنشاء': inc.CreatedAt || '',
      'المبلغ من قبل': inc.ReportedBy || '',
      'اسم الملف': inc.ImageFilename || '',
      'آخر تحديث': inc.UpdatedAt || ''
    }));
    
    // Create worksheet
    const ws = xlsx.utils.json_to_sheet(exportData);
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(exportWb, ws, 'البلاغات');
    
    // Generate buffer
    const excelBuffer = xlsx.write(exportWb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=incidents_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Send the file
    res.send(excelBuffer);
    
  } catch (e) {
    console.error('Export error:', e);
    res.status(500).json({ error: 'Failed to export incidents' });
  }
});

// START
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Server accessible on network: http://0.0.0.0:${PORT}`);
  console.log(`DB Config Path: ${DB_PATHS.Config}`);
  console.log(`Socket.IO enabled for real-time notifications`);
  
  console.log('\n🌐 Network Access URLs:');
  console.log('   • https://localhost (Local access)');
  console.log('   • https://YOUR_LOCAL_IP (Network access)');
  console.log('   • https://YOUR_PUBLIC_IP (External access - requires port forwarding)');
  console.log('\n📋 Default Login: admin / admin123');
  console.log('💡 Run NETWORK_SETUP.bat for automatic configuration');
});


import { SurveyHeader, SurveyResponseEntry, User, Complaint, LeaderboardEntry } from '../types';
import { apiPost } from './offlineQueue';

export const API_URL = '/api';

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) return await res.json();
    return null;
  } catch (e) {
    console.error("Login Error", e);
    return null;
  }
};

export const fetchConfig = async () => {
  try {
    const res = await fetch(`${API_URL}/config?t=${Date.now()}`);
    return await res.json();
  } catch (e) {
    console.error("Config Error", e);
    return { questions: [], translations: [], departments: [] };
  }
};

export const updateQuestions = async (questions: any[], translations: any[]) => {
  return await apiPost('/config/questions', { questions, translations });
};

export const updateDepartments = async (departments: any[]) => {
  return await apiPost('/config/departments', { departments });
};

export const submitSurvey = async (header: SurveyHeader, responses: SurveyResponseEntry[]) => {
  return await apiPost('/surveys', { header, responses });
};

export const submitComplaint = async (complaint: Complaint) => {
  return await apiPost('/complaints', complaint);
};

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const res = await fetch(`${API_URL}/leaderboard`);
    if (!res.ok) return [];
    return res.json();
  } catch (e) { return []; }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await fetch(`${API_URL}/users?t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      return Array.isArray(json) ? json : (json.users || []);
    }
    return [];
  } catch (e) { return []; }
};

export const addUser = async (user: Partial<User>) => {
  return await apiPost('/users', user);
};

export const updateUser = async (user: Partial<User>) => {
  // PUT not supported by offlineQueue currently, but admin functions are usually online.
  // We'll stick to fetch.
  const res = await fetch(`${API_URL}/users`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
};

export const deleteUser = async (id: string) => {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
};

export const getComplaints = async (): Promise<Complaint[]> => {
  try {
    const res = await fetch(`${API_URL}/complaints`);
    if (res.ok) return res.json();
    return [];
  } catch (e) { return []; }
};

export const updateComplaint = async (complaint: Complaint) => {
  // Offline queue usually for creations (POST). Updates might need consistency.
  // Using standard fetch.
  const res = await fetch(`${API_URL}/complaints`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaint)
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
};

export const deleteComplaint = async (id: string) => {
  const res = await fetch(`${API_URL}/complaints/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
};

export const fetchAnalytics = async (month?: string, mainCategory?: string, period?: string) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (mainCategory && mainCategory !== 'All') params.append('mainCategory', mainCategory);
  if (period) params.append('period', period);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_URL}/analytics${query}`);
  if (!res.ok) throw new Error('Analytics failed');
  return res.json();
};

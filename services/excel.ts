import { API_URL } from './db';

export const exportDatabase = () => {
  // Open the backend endpoint to download the file
  window.open(`${API_URL}/export`, '_blank');
};
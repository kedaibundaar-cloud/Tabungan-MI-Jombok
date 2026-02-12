
import { AppState } from '../types';

/**
 * Mengirim data ke Cloud (Google Sheets)
 */
export const syncToRemote = async (url: string, data: AppState): Promise<boolean> => {
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Apps Script membutuhkan mode ini untuk bypass CORS sederhana
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    // Pada mode no-cors, kita tidak bisa membaca response body, 
    // tapi fetch akan selesai jika pengiriman ke server berhasil.
    return true;
  } catch (error) {
    console.error('Push Sync Error:', error);
    return false;
  }
};

/**
 * Mengambil data terbaru dari Cloud (Google Sheets)
 */
export const fetchFromRemote = async (url: string): Promise<AppState | null> => {
  if (!url) return null;
  try {
    const response = await fetch(url + '?t=' + Date.now()); // Tambahkan timestamp agar tidak kena cache browser
    if (!response.ok) return null;
    const data = await response.json();
    
    // Validasi struktur data
    if (data && typeof data === 'object' && data.students) {
      return data as AppState;
    }
    return null;
  } catch (error) {
    console.error('Fetch Sync Error:', error);
    return null;
  }
};

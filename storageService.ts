
import { AppState, ClassName, Student, Transaction, KepsekDeposit } from '../types';

const STORAGE_KEY = 'mi_miftahul_ulum_db';

const defaultClasses: ClassName[] = ['RA A', 'RA B', '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

// Seed Data
const generateInitialData = (): AppState => {
  const students: Student[] = [];
  defaultClasses.forEach((cls) => {
    for (let i = 1; i <= 3; i++) {
      students.push({
        id: `s-${cls}-${i}`,
        nis: `${cls.replace(' ', '')}00${i}`,
        name: `Siswa ${i} Kelas ${cls}`,
        className: cls,
        initialBalance: 50000,
      });
    }
  });

  return {
    students,
    transactions: [],
    kepsekDeposits: [],
    passwords: {
      'Admin Utama': 'admin123',
      'Admin Cabang': 'cabang123',
      'Kepala Sekolah': 'kepsek123',
      ...Object.fromEntries(defaultClasses.map(c => [`Wali Kelas ${c}`, 'wali123']))
    },
  };
};

export const loadData = (): AppState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = generateInitialData();
    saveData(initial);
    return initial;
  }
  return JSON.parse(raw);
};

export const saveData = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

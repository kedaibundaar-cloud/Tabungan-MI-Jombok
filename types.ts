
export enum UserRole {
  ADMIN_UTAMA = 'Admin Utama',
  ADMIN_CABANG = 'Admin Cabang',
  KEPALA_SEKOLAH = 'Kepala Sekolah',
  WALI_KELAS = 'Wali Kelas',
  WALI_MURID = 'Wali Murid'
}

export type ClassName = 'RA A' | 'RA B' | '1A' | '1B' | '2A' | '2B' | '3A' | '3B' | '4A' | '4B' | '5A' | '5B' | '6A' | '6B';

export interface Student {
  id: string;
  nis: string;
  name: string;
  className: ClassName;
  initialBalance: number;
}

export interface Transaction {
  id: string;
  studentId: string;
  type: 'setoran' | 'pengambilan';
  amount: number;
  description: string;
  date: string;
}

export interface KepsekDeposit {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface AppState {
  students: Student[];
  transactions: Transaction[];
  kepsekDeposits: KepsekDeposit[];
  passwords: Record<string, string>; // Role/Class -> Password
}

export interface AuthSession {
  role: UserRole;
  identifier?: string; // Class for Wali Kelas, StudentID for Wali Murid
}

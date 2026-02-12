
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Send, 
  ClipboardList, 
  Settings, 
  LogOut, 
  GraduationCap, 
  Coins, 
  BookOpen, 
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  FileSpreadsheet,
  FileText,
  Lock,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { UserRole, AppState, AuthSession, Student, Transaction, ClassName, KepsekDeposit } from './types';
import { loadData, saveData } from './services/storageService';
import { exportToExcel, exportToPDF } from './utils/exportUtils';

// Fix: Add global declaration for XLSX to resolve "Cannot find name 'XLSX'" errors
declare const XLSX: any;

const ALL_CLASSES: ClassName[] = ['RA A', 'RA B', '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

const App: React.FC = () => {
  const [db, setDb] = useState<AppState>(loadData());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Auth Form State
  const [loginRole, setLoginRole] = useState<UserRole>(UserRole.ADMIN_UTAMA);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginClass, setLoginClass] = useState<ClassName>('1A');
  const [loginStudentId, setLoginStudentId] = useState('');

  // Persist DB changes
  useEffect(() => {
    saveData(db);
  }, [db]);

  // Handle Logout
  const handleLogout = () => {
    setSession(null);
    setLoginPassword('');
    setActiveTab('dashboard');
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let identifier = '';
    let targetKey = loginRole as string;

    if (loginRole === UserRole.WALI_KELAS) {
      identifier = loginClass;
      targetKey = `Wali Kelas ${loginClass}`;
    } else if (loginRole === UserRole.WALI_MURID) {
      if (!loginStudentId) return alert('Pilih siswa terlebih dahulu!');
      setSession({ role: UserRole.WALI_MURID, identifier: loginStudentId });
      return;
    }

    if (db.passwords[targetKey] === loginPassword) {
      setSession({ role: loginRole, identifier });
    } else {
      alert('Password salah!');
    }
  };

  // Helper: Get student balance
  const getBalance = (studentId: string) => {
    const student = db.students.find(s => s.id === studentId);
    if (!student) return 0;
    const studentTransactions = db.transactions.filter(t => t.studentId === studentId);
    const deposits = studentTransactions.filter(t => t.type === 'setoran').reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = studentTransactions.filter(t => t.type === 'pengambilan').reduce((sum, t) => sum + t.amount, 0);
    return student.initialBalance + deposits - withdrawals;
  };

  // Helper: Check Permissions
  const canAccess = (tab: string) => {
    if (!session) return false;
    const { role } = session;
    switch (tab) {
      case 'dashboard': return true;
      case 'siswa': return [UserRole.ADMIN_UTAMA, UserRole.ADMIN_CABANG, UserRole.KEPALA_SEKOLAH, UserRole.WALI_KELAS].includes(role);
      case 'setoran':
      case 'pengambilan': return [UserRole.ADMIN_UTAMA, UserRole.ADMIN_CABANG].includes(role);
      case 'setor-kepsek': return [UserRole.ADMIN_UTAMA, UserRole.ADMIN_CABANG, UserRole.KEPALA_SEKOLAH].includes(role);
      case 'rekap': return true;
      case 'rekap-kepsek': return [UserRole.ADMIN_UTAMA, UserRole.ADMIN_CABANG, UserRole.KEPALA_SEKOLAH].includes(role);
      case 'settings': return role === UserRole.ADMIN_UTAMA;
      default: return false;
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950">
        <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-3xl p-8 border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/50">
              <GraduationCap size={48} className="text-white" />
            </div>
            <h1 className="heading-font text-3xl text-white mb-2 tracking-wide">TABUNGAN SEKOLAH</h1>
            <p className="text-blue-300 font-bold tracking-tighter uppercase">MI MIFTAHUL ULUM JOMBOK</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-blue-300 text-xs font-bold mb-2 uppercase tracking-widest">Pilih Akses</label>
              <select 
                value={loginRole} 
                onChange={(e) => setLoginRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border-2 border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
              >
                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            {loginRole === UserRole.WALI_KELAS && (
              <div>
                <label className="block text-blue-300 text-xs font-bold mb-2 uppercase tracking-widest">Pilih Kelas</label>
                <select 
                  value={loginClass} 
                  onChange={(e) => setLoginClass(e.target.value as ClassName)}
                  className="w-full bg-slate-900 border-2 border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                >
                  {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {loginRole === UserRole.WALI_MURID && (
              <div>
                <label className="block text-blue-300 text-xs font-bold mb-2 uppercase tracking-widest">Pilih Siswa (NIS - Nama)</label>
                <select 
                  value={loginStudentId} 
                  onChange={(e) => setLoginStudentId(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {db.students.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                    <option key={s.id} value={s.id}>{s.nis} - {s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {loginRole !== UserRole.WALI_MURID && (
              <div>
                <label className="block text-blue-300 text-xs font-bold mb-2 uppercase tracking-widest">Password</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border-2 border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            )}

            <button type="submit" className="w-full btn-game bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-4 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
              <Lock size={20} />
              MASUK KE SISTEM
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-widest">&copy; 2024 MI Miftahul Ulum Jombok</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100">
      {/* Sidebar - Mobile Game Styled */}
      <aside className="w-72 flex-shrink-0 bg-slate-800/50 backdrop-blur-xl border-r-2 border-blue-500/20 flex flex-col">
        <div className="p-6 border-b-2 border-blue-500/20">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-yellow-400 p-2 rounded-lg shadow-lg shadow-yellow-400/20">
              <GraduationCap className="text-slate-900" size={24} />
            </div>
            <div>
              <h2 className="heading-font text-lg leading-tight tracking-tight text-white">MIMUJ</h2>
              <p className="text-[10px] text-yellow-400 font-black tracking-widest uppercase">Tabungan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[10px] text-slate-500 font-bold px-3 mb-2 uppercase tracking-widest">Menu Utama</p>
          
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          {canAccess('siswa') && <SidebarItem icon={<Users size={20}/>} label="Data Siswa" active={activeTab === 'siswa'} onClick={() => setActiveTab('siswa')} />}
          {canAccess('setoran') && <SidebarItem icon={<ArrowUpCircle size={20}/>} label="Setoran" active={activeTab === 'setoran'} onClick={() => setActiveTab('setoran')} />}
          {canAccess('pengambilan') && <SidebarItem icon={<ArrowDownCircle size={20}/>} label="Pengambilan" active={activeTab === 'pengambilan'} onClick={() => setActiveTab('pengambilan')} />}
          {canAccess('setor-kepsek') && <SidebarItem icon={<Send size={20}/>} label="Setor Kepsek" active={activeTab === 'setor-kepsek'} onClick={() => setActiveTab('setor-kepsek')} />}
          
          <div className="pt-4 mt-4 border-t border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-bold px-3 mb-2 uppercase tracking-widest">Laporan & Rekap</p>
            <SidebarItem icon={<ClipboardList size={20}/>} label="Rekap Tabungan" active={activeTab === 'rekap'} onClick={() => setActiveTab('rekap')} />
            {canAccess('rekap-kepsek') && <SidebarItem icon={<BookOpen size={20}/>} label="Rekap Kepsek" active={activeTab === 'rekap-kepsek'} onClick={() => setActiveTab('rekap-kepsek')} />}
          </div>

          {canAccess('settings') && (
            <div className="pt-4">
              <p className="text-[10px] text-slate-500 font-bold px-3 mb-2 uppercase tracking-widest">Konfigurasi</p>
              <SidebarItem icon={<Settings size={20}/>} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>
          )}
        </nav>

        <div className="p-4 bg-slate-900/50 border-t-2 border-blue-500/20">
          <div className="flex items-center gap-3 p-3 bg-blue-600/10 rounded-xl mb-4 border border-blue-500/20">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <UserCircle size={24} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{session.role}</p>
              <p className="text-[10px] text-blue-300 truncate uppercase">{session.identifier || 'Global'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full btn-game bg-red-500/10 border border-red-500/40 text-red-500 py-3 rounded-xl flex items-center justify-center gap-2 text-xs">
            <LogOut size={16} /> KELUAR GAME
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {/* Header */}
        <header className="h-16 flex-shrink-0 bg-slate-800/30 backdrop-blur-md border-b-2 border-blue-500/20 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="heading-font text-xl tracking-wider text-white uppercase">{activeTab.replace('-', ' ')}</h1>
            <div className="h-4 w-[2px] bg-slate-700"></div>
            <p className="text-xs text-slate-400 font-medium tracking-widest">MENU ACTIVE</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-900 px-4 py-2 rounded-full border border-blue-500/30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">System Online</span>
             </div>
          </div>
        </header>

        {/* Dynamic View Area */}
        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && <DashboardView db={db} session={session} getBalance={getBalance} />}
          {activeTab === 'siswa' && <SiswaView db={db} setDb={setDb} session={session} getBalance={getBalance} />}
          {activeTab === 'setoran' && <TransactionView db={db} setDb={setDb} type="setoran" getBalance={getBalance} />}
          {activeTab === 'pengambilan' && <TransactionView db={db} setDb={setDb} type="pengambilan" getBalance={getBalance} />}
          {activeTab === 'setor-kepsek' && <SetorKepsekView db={db} setDb={setDb} />}
          {activeTab === 'rekap' && <RekapView db={db} session={session} getBalance={getBalance} />}
          {activeTab === 'rekap-kepsek' && <RekapKepsekView db={db} />}
          {activeTab === 'settings' && <SettingsView db={db} setDb={setDb} />}
        </section>
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SidebarItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border-l-4 border-yellow-400' 
        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
    }`}
  >
    <div className={`${active ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'}`}>{icon}</div>
    <span className="text-sm font-bold tracking-wide uppercase">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto text-yellow-400" />}
  </button>
);

const StatCard = ({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className={`card-glow bg-slate-800/60 p-6 rounded-2xl flex items-center justify-between border-b-4 border-${color}-500 transition-all`}>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="game-font text-2xl font-black text-white">{value}</h3>
    </div>
    <div className={`bg-${color}-500/20 p-4 rounded-xl text-${color}-400 shadow-inner`}>
      {icon}
    </div>
  </div>
);

// --- VIEW COMPONENTS ---

const DashboardView = ({ db, session, getBalance }: { db: AppState, session: AuthSession, getBalance: (id: string) => number }) => {
  const filteredStudents = session.role === UserRole.WALI_KELAS 
    ? db.students.filter(s => s.className === session.identifier)
    : session.role === UserRole.WALI_MURID 
      ? db.students.filter(s => s.id === session.identifier)
      : db.students;

  const totalSiswa = filteredStudents.length;
  
  const relevantTransactions = db.transactions.filter(t => 
    filteredStudents.some(s => s.id === t.studentId)
  );

  const totalSetoran = relevantTransactions.filter(t => t.type === 'setoran').reduce((sum, t) => sum + t.amount, 0);
  const totalPengambilan = relevantTransactions.filter(t => t.type === 'pengambilan').reduce((sum, t) => sum + t.amount, 0);
  
  const totalSaldo = filteredStudents.reduce((sum, s) => sum + getBalance(s.id), 0);

  // Chart Data
  const chartData = useMemo(() => {
    const days = [...new Set(relevantTransactions.map(t => t.date))].sort().slice(-7);
    return days.map(d => ({
      name: d,
      setoran: relevantTransactions.filter(t => t.date === d && t.type === 'setoran').reduce((sum, t) => sum + t.amount, 0),
      pengambilan: relevantTransactions.filter(t => t.date === d && t.type === 'pengambilan').reduce((sum, t) => sum + t.amount, 0)
    }));
  }, [relevantTransactions]);

  const handleExport = (type: 'xlsx' | 'pdf-a4' | 'pdf-f4') => {
    const data = [
      { Kategori: 'Total Siswa', Nilai: totalSiswa },
      { Kategori: 'Total Setoran', Nilai: `Rp ${totalSetoran.toLocaleString()}` },
      { Kategori: 'Total Pengambilan', Nilai: `Rp ${totalPengambilan.toLocaleString()}` },
      { Kategori: 'Total Saldo', Nilai: `Rp ${totalSaldo.toLocaleString()}` },
    ];
    if (type === 'xlsx') exportToExcel(data, "Dashboard_Summary");
    else exportToPDF("Ringkasan Dashboard", [["Kategori", "Nilai"]], data.map(d => [d.Kategori, d.Nilai]), "Dashboard_Summary", type === 'pdf-f4' ? 'f4' : 'a4');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="heading-font text-3xl text-white mb-1 uppercase">WAR ROOM DASHBOARD</h2>
          <p className="text-blue-400 font-bold tracking-widest text-xs uppercase">Statistik Tabungan Sekolah</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('xlsx')} className="btn-game bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs">
            <FileSpreadsheet size={16} /> EXCEL
          </button>
          <button onClick={() => handleExport('pdf-a4')} className="btn-game bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs">
            <FileText size={16} /> PDF A4
          </button>
          <button onClick={() => handleExport('pdf-f4')} className="btn-game bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs">
            <FileText size={16} /> PDF F4
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Siswa" value={totalSiswa.toString()} icon={<Users size={28}/>} color="blue" />
        <StatCard label="Total Setoran" value={`Rp ${totalSetoran.toLocaleString()}`} icon={<ArrowUpCircle size={28}/>} color="green" />
        <StatCard label="Total Pengambilan" value={`Rp ${totalPengambilan.toLocaleString()}`} icon={<ArrowDownCircle size={28}/>} color="red" />
        <StatCard label="Total Saldo" value={`Rp ${totalSaldo.toLocaleString()}`} icon={<Coins size={28}/>} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-glow bg-slate-800/40 p-6 rounded-2xl border border-blue-500/20">
          <h3 className="game-font text-sm text-blue-300 mb-6 uppercase tracking-widest">Aktivitas Transaksi (7 Hari Terakhir)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="setoran" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pengambilan" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glow bg-slate-800/40 p-6 rounded-2xl border border-blue-500/20 flex flex-col items-center justify-center">
           <h3 className="game-font text-sm text-blue-300 mb-6 uppercase tracking-widest text-center">Komposisi Kas</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={[
                     { name: 'Setoran', value: totalSetoran },
                     { name: 'Pengambilan', value: totalPengambilan }
                   ]}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   <Cell fill="#22c55e" />
                   <Cell fill="#ef4444" />
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="w-full space-y-3 mt-4">
             <div className="flex justify-between items-center text-xs">
               <span className="text-green-400 font-bold uppercase">Setoran</span>
               <span className="font-black">Rp {totalSetoran.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
               <span className="text-red-400 font-bold uppercase">Pengambilan</span>
               <span className="font-black">Rp {totalPengambilan.toLocaleString()}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const SiswaView = ({ db, setDb, session, getBalance }: { db: AppState, setDb: any, session: AuthSession, getBalance: (id: string) => number }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    className: '1A' as ClassName,
    initialBalance: 0
  });

  const filtered = db.students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm);
    if (session.role === UserRole.WALI_KELAS) return matchesSearch && s.className === session.identifier;
    return matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSiswa) {
      setDb({
        ...db,
        students: db.students.map(s => s.id === editingSiswa.id ? { ...editingSiswa, ...formData } : s)
      });
    } else {
      const newSiswa: Student = {
        id: `s-${Date.now()}`,
        ...formData
      };
      setDb({ ...db, students: [...db.students, newSiswa] });
    }
    setShowModal(false);
    setEditingSiswa(null);
    setFormData({ nis: '', name: '', className: '1A', initialBalance: 0 });
  };

  const handleEdit = (s: Student) => {
    setEditingSiswa(s);
    setFormData({ nis: s.nis, name: s.name, className: s.className, initialBalance: s.initialBalance });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus siswa ini? Semua transaksi juga akan terpengaruh.')) {
      setDb({
        ...db,
        students: db.students.filter(s => s.id !== id),
        transactions: db.transactions.filter(t => t.studentId !== id)
      });
    }
  };

  const handleExport = (type: 'xlsx' | 'pdf-a4' | 'pdf-f4') => {
    const data = filtered.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      Nama: s.name,
      Kelas: s.className,
      Saldo: getBalance(s.id)
    }));
    if (type === 'xlsx') exportToExcel(data, "Data_Siswa");
    else exportToPDF("Data Siswa", [["No", "NIS", "Nama", "Kelas", "Saldo"]], data.map(d => [d.No, d.NIS, d.Nama, d.Kelas, `Rp ${d.Saldo.toLocaleString()}`]), "Data_Siswa", type === 'pdf-f4' ? 'f4' : 'a4');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      // Fix: Use global XLSX object for parsing imported file
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet) as any[];
      
      const newStudents: Student[] = data.map((d, i) => ({
        id: `import-${Date.now()}-${i}`,
        nis: d.NIS || d.nis || '',
        name: d.Nama || d.nama || '',
        className: (d.Kelas || d.kelas || '1A') as ClassName,
        initialBalance: Number(d.SaldoAwal || d.saldo_awal || 0)
      }));

      setDb({ ...db, students: [...db.students, ...newStudents] });
      alert(`${newStudents.length} siswa berhasil diimport!`);
    };
    reader.readAsBinaryString(file);
  };

  const canEdit = [UserRole.ADMIN_UTAMA, UserRole.ADMIN_CABANG].includes(session.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari Nama / NIS Siswa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-blue-500/30 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2">
           {canEdit && (
             <>
               <label className="btn-game bg-indigo-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 text-xs cursor-pointer">
                 <Plus size={16} /> IMPORT
                 <input type="file" accept=".xlsx" onChange={handleImport} className="hidden" />
               </label>
               <button onClick={() => setShowModal(true)} className="btn-game bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
                 <Plus size={16} /> TAMBAH SISWA
               </button>
             </>
           )}
           <button onClick={() => handleExport('xlsx')} className="btn-game bg-green-600/20 border border-green-600/50 text-green-500 p-3 rounded-xl">
             <FileSpreadsheet size={20} />
           </button>
        </div>
      </div>

      <div className="card-glow bg-slate-800/40 rounded-2xl border border-blue-500/20 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 tracking-widest">No</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 tracking-widest">NIS</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 tracking-widest">Nama Siswa</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 tracking-widest">Kelas</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 tracking-widest text-right">Saldo Akhir</th>
              {canEdit && <th className="p-4 text-[10px] font-black uppercase text-blue-400 tracking-widest text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filtered.map((s, idx) => (
              <tr key={s.id} className="hover:bg-blue-500/5 transition-colors">
                <td className="p-4 text-xs text-slate-400">{idx + 1}</td>
                <td className="p-4 text-xs font-bold text-white tracking-wider">{s.nis}</td>
                <td className="p-4 text-xs font-bold text-slate-200">{s.name}</td>
                <td className="p-4 text-xs">
                  <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20 font-black text-[10px]">{s.className}</span>
                </td>
                <td className="p-4 text-xs text-right font-black text-yellow-400">Rp {getBalance(s.id).toLocaleString()}</td>
                {canEdit && (
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(s)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest italic">Tidak ada data siswa</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl border-2 border-blue-500 p-8 shadow-2xl">
            <h3 className="heading-font text-xl text-white mb-6 uppercase tracking-widest">Data Pahlawan (Siswa)</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Nomor Induk Siswa (NIS)</label>
                <input required value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="Contoh: 1A001" />
              </div>
              <div>
                <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Nama Lengkap</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="Nama Siswa" />
              </div>
              <div>
                <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Kelas</label>
                <select value={formData.className} onChange={e => setFormData({...formData, className: e.target.value as ClassName})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none">
                  {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Saldo Awal (Opsional)</label>
                <input type="number" value={formData.initialBalance} onChange={e => setFormData({...formData, initialBalance: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="0" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white">Batal</button>
                <button type="submit" className="flex-1 btn-game bg-blue-600 py-3 rounded-xl text-xs">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionView = ({ db, setDb, type, getBalance }: { db: AppState, setDb: any, type: 'setoran' | 'pengambilan', getBalance: (id: string) => number }) => {
  const [selectedClass, setSelectedClass] = useState<ClassName>('1A');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const studentsInClass = db.students.filter(s => s.className === selectedClass);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || amount <= 0) return alert('Input tidak valid');

    if (type === 'pengambilan') {
      const currentBalance = getBalance(selectedStudentId);
      if (amount > currentBalance) return alert('Saldo tidak mencukupi!');
    }

    const newTransaction: Transaction = {
      id: `t-${Date.now()}`,
      studentId: selectedStudentId,
      type,
      amount,
      description,
      date
    };

    setDb({ ...db, transactions: [...db.transactions, newTransaction] });
    setAmount(0);
    setDescription('');
    alert('Transaksi berhasil disimpan!');
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
      <div className={`card-glow bg-slate-800/60 p-8 rounded-3xl border-l-8 border-${type === 'setoran' ? 'green' : 'red'}-500 shadow-2xl`}>
        <div className="flex items-center gap-4 mb-8">
           <div className={`p-4 rounded-2xl bg-${type === 'setoran' ? 'green' : 'red'}-600/20 text-${type === 'setoran' ? 'green' : 'red'}-400`}>
             {type === 'setoran' ? <ArrowUpCircle size={32}/> : <ArrowDownCircle size={32}/>}
           </div>
           <div>
             <h2 className="heading-font text-2xl text-white uppercase tracking-widest">{type === 'setoran' ? 'INPUT SETORAN' : 'PENGAMBILAN DANA'}</h2>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Kelola dana tabungan siswa dengan aman</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Pilih Kelas</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value as ClassName)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none">
                {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Pilih Siswa</label>
              <select required value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none">
                <option value="">-- Pilih Siswa --</option>
                {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name} (Saldo: Rp {getBalance(s.id).toLocaleString()})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Tanggal</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Jumlah (Rp)</label>
              <input type="number" required value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-yellow-400 focus:border-blue-500 outline-none" placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] text-blue-300 font-black uppercase mb-1 block">Keterangan / Berita</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="Catatan tambahan..."></textarea>
            </div>
            <button type="submit" className={`w-full btn-game ${type === 'setoran' ? 'bg-green-600 shadow-green-600/30' : 'bg-red-600 shadow-red-600/30'} py-4 rounded-xl text-white font-black uppercase tracking-widest`}>
              PROSES {type.toUpperCase()} SEKARANG
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SetorKepsekView = ({ db, setDb }: { db: AppState, setDb: any }) => {
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    const newDep: KepsekDeposit = {
      id: `kd-${Date.now()}`,
      amount,
      description,
      date
    };
    setDb({ ...db, kepsekDeposits: [...db.kepsekDeposits, newDep] });
    setAmount(0);
    setDescription('');
    alert('Setoran ke Kepsek tersimpan!');
  };

  return (
    <div className="max-w-md mx-auto card-glow bg-slate-800/60 p-8 rounded-3xl border border-blue-500/20">
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-yellow-500/20 rounded-2xl mb-4">
          <Send className="text-yellow-500" size={32} />
        </div>
        <h2 className="heading-font text-xl text-white uppercase">SETOR KE KEPSEK</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Tanggal Setor</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Jumlah Dana (Rp)</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-yellow-400 outline-none" placeholder="0" />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Catatan</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Keterangan..."></textarea>
        </div>
        <button className="w-full btn-game bg-blue-600 py-4 rounded-xl font-bold">KIRIM LAPORAN</button>
      </form>
    </div>
  );
};

const RekapView = ({ db, session, getBalance }: { db: AppState, session: AuthSession, getBalance: (id: string) => number }) => {
  const [filterClass, setFilterClass] = useState<ClassName | 'All'>('All');
  const [filterType, setFilterType] = useState<'All' | 'setoran' | 'pengambilan'>('All');
  
  const students = db.students.filter(s => {
    if (session.role === UserRole.WALI_KELAS) return s.className === session.identifier;
    if (session.role === UserRole.WALI_MURID) return s.id === session.identifier;
    if (filterClass !== 'All') return s.className === filterClass;
    return true;
  });

  const studentSummary = students.map(s => {
    const studentTxs = db.transactions.filter(t => t.studentId === s.id && (filterType === 'All' || t.type === filterType));
    const totalSetoran = studentTxs.filter(t => t.type === 'setoran').reduce((sum, t) => sum + t.amount, 0);
    const totalPengambilan = studentTxs.filter(t => t.type === 'pengambilan').reduce((sum, t) => sum + t.amount, 0);
    return {
      name: s.name,
      nis: s.nis,
      class: s.className,
      setoran: totalSetoran,
      pengambilan: totalPengambilan,
      saldo: getBalance(s.id)
    };
  });

  const grandTotalSaldo = studentSummary.reduce((sum, s) => sum + s.saldo, 0);

  const handleExport = (type: 'xlsx' | 'pdf-a4' | 'pdf-f4') => {
    const data = studentSummary.map((s, idx) => ({
      No: idx + 1,
      Nama: s.name,
      NIS: s.nis,
      Kelas: s.class,
      TotalSetoran: s.setoran,
      TotalPengambilan: s.pengambilan,
      SaldoAkhir: s.saldo
    }));
    if (type === 'xlsx') exportToExcel(data, "Rekap_Tabungan");
    else exportToPDF("Rekap Tabungan", [["No", "Nama", "NIS", "Kelas", "Setoran", "Tarik", "Saldo"]], data.map(d => [d.No, d.Nama, d.NIS, d.Kelas, `Rp ${d.TotalSetoran.toLocaleString()}`, `Rp ${d.TotalPengambilan.toLocaleString()}`, `Rp ${d.SaldoAkhir.toLocaleString()}`]), "Rekap_Tabungan", type === 'pdf-f4' ? 'f4' : 'a4');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end bg-slate-800/40 p-6 rounded-2xl border border-blue-500/20">
        {(session.role !== UserRole.WALI_KELAS && session.role !== UserRole.WALI_MURID) && (
          <div>
            <label className="text-[10px] text-blue-300 font-bold uppercase mb-1 block">Filter Kelas</label>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value as any)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option value="All">Semua Kelas</option>
              {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-[10px] text-blue-300 font-bold uppercase mb-1 block">Filter Jenis</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">
            <option value="All">Semua Transaksi</option>
            <option value="setoran">Hanya Setoran</option>
            <option value="pengambilan">Hanya Pengambilan</option>
          </select>
        </div>
        <div className="flex-1"></div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('xlsx')} className="btn-game bg-green-600 px-3 py-2 rounded-lg text-[10px]">EXCEL</button>
          <button onClick={() => handleExport('pdf-a4')} className="btn-game bg-red-600 px-3 py-2 rounded-lg text-[10px]">PDF A4</button>
          <button onClick={() => handleExport('pdf-f4')} className="btn-game bg-slate-700 px-3 py-2 rounded-lg text-[10px]">PDF F4</button>
        </div>
      </div>

      <div className="card-glow bg-slate-800/40 rounded-2xl border border-blue-500/20 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400">Nama Siswa</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400">Kelas</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 text-right">Total Setor</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 text-right">Total Tarik</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 text-right">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {studentSummary.map((s, i) => (
              <tr key={i} className="hover:bg-blue-500/5 transition-colors">
                <td className="p-4 text-xs font-bold text-white">{s.name} <br/> <span className="text-[9px] text-slate-500">{s.nis}</span></td>
                <td className="p-4 text-xs font-bold text-blue-400">{s.class}</td>
                <td className="p-4 text-xs text-right text-green-400">Rp {s.setoran.toLocaleString()}</td>
                <td className="p-4 text-xs text-right text-red-400">Rp {s.pengambilan.toLocaleString()}</td>
                <td className="p-4 text-xs text-right font-black text-yellow-400">Rp {s.saldo.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900/50 font-black">
            <tr>
              <td colSpan={4} className="p-4 text-right text-sm text-blue-400 uppercase tracking-widest">Total Keseluruhan Saldo:</td>
              <td className="p-4 text-right text-lg text-yellow-400">Rp {grandTotalSaldo.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const RekapKepsekView = ({ db }: { db: AppState }) => {
  const total = db.kepsekDeposits.reduce((sum, d) => sum + d.amount, 0);

  const handleExport = (type: 'xlsx' | 'pdf-a4' | 'pdf-f4') => {
    const data = db.kepsekDeposits.map((d, idx) => ({
      No: idx + 1,
      Tanggal: d.date,
      Jumlah: d.amount,
      Keterangan: d.description
    }));
    if (type === 'xlsx') exportToExcel(data, "Rekap_Kepsek");
    else exportToPDF("Rekap Setoran Kepsek", [["No", "Tanggal", "Jumlah", "Keterangan"]], data.map(d => [d.No, d.Tanggal, `Rp ${d.Jumlah.toLocaleString()}`, d.Keterangan]), "Rekap_Kepsek", type === 'pdf-f4' ? 'f4' : 'a4');
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
          <div>
            <h3 className="game-font text-white mb-1 uppercase">ARUS KAS KEPALA SEKOLAH</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Data setoran dari bendahara sekolah</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('xlsx')} className="btn-game bg-green-600 px-3 py-2 rounded-lg text-[10px]">EXCEL</button>
            <button onClick={() => handleExport('pdf-a4')} className="btn-game bg-red-600 px-3 py-2 rounded-lg text-[10px]">PDF A4</button>
          </div>
       </div>

       <div className="card-glow bg-slate-800/40 rounded-2xl border border-blue-500/20 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400">Tanggal</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400">Keterangan</th>
              <th className="p-4 text-[10px] font-black uppercase text-blue-400 text-right">Jumlah Setor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {db.kepsekDeposits.map((d, i) => (
              <tr key={i} className="hover:bg-blue-500/5">
                <td className="p-4 text-xs font-bold text-white">{d.date}</td>
                <td className="p-4 text-xs text-slate-400">{d.description || '-'}</td>
                <td className="p-4 text-xs text-right font-black text-green-400">Rp {d.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900/50 font-black">
            <tr>
              <td colSpan={2} className="p-4 text-right text-xs text-blue-400 uppercase tracking-widest">Total Setoran:</td>
              <td className="p-4 text-right text-lg text-yellow-400">Rp {total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const SettingsView = ({ db, setDb }: { db: AppState, setDb: any }) => {
  const [selectedRole, setSelectedRole] = useState<string>('Admin Cabang');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdate = () => {
    if (!newPassword) return;
    setDb({
      ...db,
      passwords: { ...db.passwords, [selectedRole]: newPassword }
    });
    setNewPassword('');
    alert('Password diperbarui!');
  };

  const roleOptions = [
    'Admin Cabang',
    'Kepala Sekolah',
    ...ALL_CLASSES.map(c => `Wali Kelas ${c}`)
  ];

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in zoom-in duration-300">
      <div className="card-glow bg-slate-800/60 p-8 rounded-3xl border border-blue-500/20">
        <h3 className="heading-font text-xl text-white mb-6 uppercase tracking-widest text-center">Ganti Kunci Akses (Password)</h3>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] text-blue-300 font-bold uppercase mb-1 block">Pilih Akun</label>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none">
              {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-blue-300 font-bold uppercase mb-1 block">Password Baru</label>
            <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Ketik password baru..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
            <p className="text-[9px] text-slate-500 mt-2 italic">* Password saat ini untuk {selectedRole}: {db.passwords[selectedRole]}</p>
          </div>
          <button onClick={handleUpdate} className="w-full btn-game bg-indigo-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
            <Lock size={18} /> PERBARUI KUNCI
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;

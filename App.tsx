import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AttendanceCam from './components/AttendanceCam';
import StatsCard from './components/StatsCard';
import AttendanceHistory from './components/AttendanceHistory';
import AnalysisPanel from './components/AnalysisPanel';
import RulesModal from './components/RulesModal';
import { ViewState, AttendanceRecord, AttendanceType, LocationData, Volunteer, AttendanceStatus } from './types';
import { Users, Clock, CheckCircle, Package, UserPlus, Phone, X, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { JOB_SCHEDULES } from './constants/JobSchedules';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // UI States
  const [showRules, setShowRules] = useState(false);
  const [showAddVolunteer, setShowAddVolunteer] = useState(false);

  // Form State
  const [newVolName, setNewVolName] = useState('');
  const [newVolPhone, setNewVolPhone] = useState('');
  const [newVolRole, setNewVolRole] = useState('Helper');

  // Load Initial Data
  useEffect(() => {
    const savedRecords = localStorage.getItem('attendance_records');
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedVolunteers = localStorage.getItem('volunteers');
    if (savedVolunteers) {
      setVolunteers(JSON.parse(savedVolunteers));
    } else {
      // Seed default data if empty
      const initialVols: Volunteer[] = [
        { id: '1', name: 'Budi Santoso', phone: '08123456789', defaultRole: 'Cook', joinDate: Date.now() },
        { id: '2', name: 'Siti Aminah', phone: '08129876543', defaultRole: 'Pemorsian', joinDate: Date.now() }
      ];
      setVolunteers(initialVols);
      localStorage.setItem('volunteers', JSON.stringify(initialVols));
    }

    const rulesAccepted = localStorage.getItem('rules_accepted');
    if (!rulesAccepted) setShowRules(true);
  }, []);

  const acceptRules = () => {
    localStorage.setItem('rules_accepted', 'true');
    setShowRules(false);
  };

  const addVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName || !newVolPhone) return;

    const newVol: Volunteer = {
      id: Date.now().toString(),
      name: newVolName,
      phone: newVolPhone,
      defaultRole: newVolRole,
      joinDate: Date.now()
    };

    const updated = [...volunteers, newVol];
    setVolunteers(updated);
    localStorage.setItem('volunteers', JSON.stringify(updated));
    
    // Reset form
    setNewVolName('');
    setNewVolPhone('');
    setShowAddVolunteer(false);
  };

  const handleAttendance = (
    type: AttendanceType, 
    status: AttendanceStatus,
    photo: string, 
    location: LocationData, 
    aiNote: string,
    verified: boolean,
    activity: string,
    volunteer: Volunteer
  ) => {
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: volunteer.id,
      userName: volunteer.name,
      type,
      status, 
      timestamp: Date.now(),
      photoUrl: photo,
      location,
      aiVerificationNote: aiNote,
      isVerified: verified,
      activity
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('attendance_records', JSON.stringify(updatedRecords));
    
    setTimeout(() => setView('history'), 1000);
  };

  // Stats Calculation
  const today = new Date().setHours(0,0,0,0);
  const todaysRecords = records.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === today);
  const activeVolunteersCount = new Set(todaysRecords.filter(r => r.type === AttendanceType.CLOCK_IN).map(r => r.userId)).size;
  const lateCount = todaysRecords.filter(r => r.status === AttendanceStatus.LATE).length;

  // Chart Data
  const chartData = [
    { name: 'Sen', meals: 1200 },
    { name: 'Sel', meals: 1350 },
    { name: 'Rab', meals: 1280 },
    { name: 'Kam', meals: 1400 },
    { name: 'Jum', meals: 1550 },
  ];

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard MBG</h1>
                <p className="text-slate-500">Pantau operasional Dapur Kalibata 2 hari ini.</p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                 <button 
                  onClick={() => setShowAddVolunteer(true)}
                  className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-all flex items-center gap-2"
                >
                  <UserPlus size={18} /> Tambah Relawan
                </button>
                <button 
                  onClick={() => setView('attendance')}
                  className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all"
                >
                  Mulai Absen
                </button>
              </div>
            </div>

            {/* AI Analysis Panel - NEW */}
            <AnalysisPanel records={records} volunteers={volunteers} />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Hadir Hari Ini" value={`${activeVolunteersCount} Orang`} icon={<Users size={24} />} color="blue" />
              <StatsCard title="Datang Terlambat" value={`${lateCount} Orang`} trend="Perlu Evaluasi" icon={<Clock size={24} />} color="purple" />
              <StatsCard title="Target Porsi" value="1,500" trend="Makan Bergizi Gratis" icon={<Package size={24} />} color="orange" />
              <StatsCard title="Total Relawan" value={volunteers.length} trend="Terdaftar" icon={<CheckCircle size={24} />} color="green" />
            </div>

            {/* Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Output Dapur (Mingguan)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#fff7ed' }} />
                        <Bar dataKey="meals" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Volunteers List */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Relawan Terbaru</h3>
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                  {volunteers.map((vol) => (
                    <div key={vol.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                            {vol.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{vol.name}</p>
                            <p className="text-xs text-slate-500">{vol.defaultRole}</p>
                          </div>
                       </div>
                       <div className="text-xs text-slate-400">
                          {new Date(vol.joinDate).toLocaleDateString()}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'attendance':
        return <AttendanceCam 
            onAttendance={handleAttendance} 
            volunteers={volunteers} 
            onAddVolunteerReq={() => {
              setView('dashboard');
              setShowAddVolunteer(true);
            }}
          />;
      case 'history':
      case 'reports':
        return <AttendanceHistory records={records} />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar currentView={view} setView={setView} />

      {/* Rules Modal */}
      {showRules && <RulesModal onClose={acceptRules} />}

      {/* Add Volunteer Modal */}
      {showAddVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Registrasi Relawan Baru</h3>
                <button onClick={() => setShowAddVolunteer(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={addVolunteer} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                   <input 
                     required 
                     type="text" 
                     className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                     placeholder="Contoh: Siti Aminah"
                     value={newVolName}
                     onChange={(e) => setNewVolName(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
                   <div className="relative">
                     <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                     <input 
                      required 
                      type="tel" 
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="0812..."
                      value={newVolPhone}
                      onChange={(e) => setNewVolPhone(e.target.value)}
                    />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Role / Tugas</label>
                   <div className="relative">
                     <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={18} />
                     <select 
                        value={newVolRole}
                        onChange={(e) => setNewVolRole(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none appearance-none bg-white"
                     >
                       {Object.keys(JOB_SCHEDULES).map(role => (
                         <option key={role} value={role}>{role}</option>
                       ))}
                       <option value="Umum">Umum / Admin</option>
                     </select>
                   </div>
                   <p className="text-xs text-slate-500 mt-1">Pastikan role sesuai dengan jadwal operasional.</p>
                </div>
                <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 mt-2">
                  Simpan Data Relawan
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-20 p-4 flex justify-between items-center shadow-md">
        <span className="font-bold">Dapur Kalibata 2</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-sm font-medium bg-slate-800 px-3 py-1 rounded">
           {isMobileMenuOpen ? 'Tutup' : 'Menu'}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed top-14 left-0 w-full bg-slate-800 z-10 p-4 flex flex-col space-y-2 md:hidden text-white shadow-xl">
           <button className="text-left p-2 hover:bg-slate-700 rounded" onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }}>Dashboard</button>
           <button className="text-left p-2 hover:bg-slate-700 rounded" onClick={() => { setView('attendance'); setIsMobileMenuOpen(false); }}>Absensi</button>
           <button className="text-left p-2 hover:bg-slate-700 rounded" onClick={() => { setView('history'); setIsMobileMenuOpen(false); }}>Riwayat</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-6 md:p-8 mt-14 md:mt-0 transition-all">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
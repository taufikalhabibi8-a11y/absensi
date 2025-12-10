import React from 'react';
import { AlertTriangle, Clock, ShieldCheck, CheckCircle, Calendar } from 'lucide-react';
import { JOB_SCHEDULES } from '../constants/JobSchedules';

interface RulesModalProps {
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-orange-600 p-6 text-white shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck size={24} />
            Peraturan & Jadwal Operasional
          </h2>
          <p className="text-orange-100 text-sm mt-1">Dapur Kalibata 2 - Program MBG</p>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
             <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
               <AlertTriangle size={18} /> PERATURAN WAJIB
             </h3>
             <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
               <li>Relawan <strong>WAJIB HADIR 30 MENIT SEBELUM</strong> jam operasional role masing-masing.</li>
               <li>Jika nama Anda tidak ada di database, wajib lapor admin untuk input data baru.</li>
               <li>APD (Masker, Apron, Hairnet) wajib dipakai sebelum foto absensi.</li>
             </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-orange-600" size={18} />
              Jadwal Operasional Per Role
            </h3>
            <div className="border rounded-lg overflow-hidden text-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Jam Kerja</th>
                    <th className="px-4 py-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(JOB_SCHEDULES).map(([key, schedule]) => (
                    <tr key={key}>
                      <td className="px-4 py-2 font-medium text-slate-900">{key}</td>
                      <td className="px-4 py-2 text-indigo-600 font-bold whitespace-nowrap">
                        {schedule.start} - {schedule.end}
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-xs">
                        {schedule.description}
                        <div className="mt-1 opacity-75">
                          {schedule.tasks.join(', ')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-orange-600" size={18} />
              Kebijakan Kehadiran
            </h3>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-1">
              <li>Kehadiran minimal <strong>80%</strong> untuk bonus insentif.</li>
              <li>Sistem AI akan mendeteksi otomatis jika Anda terlambat atau pulang awal.</li>
            </ul>
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Saya Mengerti & Setuju
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
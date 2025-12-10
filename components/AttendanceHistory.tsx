import React, { useState } from 'react';
import { AttendanceRecord, AttendanceType, AttendanceStatus } from '../types';
import { Sparkles, Clock, FileText, Utensils, AlertTriangle } from 'lucide-react';
import { generateAttendanceReport } from '../services/geminiService';

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ records }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    const result = await generateAttendanceReport(records);
    setReport(result);
    setLoadingReport(false);
  };

  const getStatusBadge = (status: AttendanceStatus, type: AttendanceType) => {
    if (type === AttendanceType.CLOCK_IN) {
      if (status === AttendanceStatus.LATE) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            TERLAMBAT
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
          TEPAT WAKTU
        </span>
      );
    } else {
      if (status === AttendanceStatus.EARLY_LEAVE) {
        return (
           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
            PULANG CEPAT
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
          SELESAI
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Riwayat Absensi Relawan</h2>
        <button 
          onClick={handleGenerateReport}
          disabled={loadingReport || records.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loadingReport ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Sparkles size={16} />
          )}
          Buat Laporan Harian (AI)
        </button>
      </div>

      {report && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-4 text-orange-800 font-semibold border-b border-orange-200 pb-2">
            <FileText size={20} />
            Laporan Operasional Dapur MBG
          </div>
          <div className="prose prose-orange max-w-none text-slate-700 whitespace-pre-line text-sm leading-relaxed">
            {report}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Relawan</th>
                <th className="px-6 py-4 font-semibold">Tugas</th>
                <th className="px-6 py-4 font-semibold">Tipe</th>
                <th className="px-6 py-4 font-semibold">Status Validasi</th>
                <th className="px-6 py-4 font-semibold">Waktu</th>
                <th className="px-6 py-4 font-semibold">Bukti AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Belum ada data relawan hari ini.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{record.userName}</div>
                      <div className="text-xs text-slate-500">Relawan</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                        <Utensils size={12} />
                        {record.activity || 'Umum'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold text-xs ${record.type === AttendanceType.CLOCK_IN ? 'text-blue-600' : 'text-slate-600'}`}>
                        {record.type === AttendanceType.CLOCK_IN ? 'MASUK' : 'PULANG'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(record.status, record.type)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                         <div className="text-xs text-slate-600 mb-1 line-clamp-2">
                           {record.aiVerificationNote}
                         </div>
                         {record.photoUrl && (
                             <img src={record.photoUrl} alt="Proof" className="h-10 w-10 rounded-md object-cover border border-slate-200" />
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
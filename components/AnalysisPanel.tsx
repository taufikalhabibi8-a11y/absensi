import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle, Utensils, PieChart } from 'lucide-react';
import { AttendanceRecord, AiAnalysisData, Volunteer } from '../types';
import { generateDashboardAnalysis } from '../services/geminiService';

interface AnalysisPanelProps {
  records: AttendanceRecord[];
  volunteers: Volunteer[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ records, volunteers }) => {
  const [data, setData] = useState<AiAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await generateDashboardAnalysis(records, volunteers.length);
      setData(result);
      setLoading(false);
    };

    if (records.length > 0) {
      fetchData();
    }
  }, [records, volunteers.length]);

  if (records.length === 0) {
     return (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white mb-6">
           <div className="flex items-center gap-2 mb-2">
             <Sparkles className="text-yellow-400" />
             <h3 className="font-bold">Analisis Operasional AI</h3>
           </div>
           <p className="text-slate-300 text-sm">Belum ada data absensi hari ini untuk dianalisis.</p>
        </div>
     );
  }

  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6 flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3 text-slate-400">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
           <p className="text-sm font-medium">Gemini AI sedang menganalisis data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6 animate-in fade-in">
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Analisis Cerdas AI</h3>
              <p className="text-xs text-slate-500">Real-time operational insights</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{data.predictedPortions}</p>
            <p className="text-xs text-slate-500">Estimasi Porsi</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Summary */}
         <div className="col-span-1 md:col-span-2">
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
              "{data.summary}"
            </p>
            
            {data.anomalies && data.anomalies.length > 0 && (
               <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                     <AlertCircle size={12} className="text-red-500" /> Perhatian
                  </h4>
                  {data.anomalies.map((alert, idx) => (
                    <div key={idx} className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                       {alert}
                    </div>
                  ))}
               </div>
            )}
         </div>

         {/* Stats */}
         <div className="space-y-4">
            <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-slate-500">Tingkat Kehadiran</span>
                 <span className="font-bold text-slate-800">{Math.round(data.attendanceRate)}%</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2">
                 <div 
                   className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                   style={{ width: `${data.attendanceRate}%` }}
                 ></div>
               </div>
            </div>

            <div className="space-y-2">
               <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                 <PieChart size={12} /> Role Breakdown
               </h4>
               {Object.entries(data.roleBreakdown || {}).map(([role, count]) => (
                 <div key={role} className="flex justify-between text-xs items-center bg-slate-50 p-2 rounded">
                    <span className="text-slate-700 font-medium">{role}</span>
                    <span className="bg-white px-2 py-0.5 rounded shadow-sm text-slate-900 font-bold">{count}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
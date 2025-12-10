import React, { useRef, useState, useEffect } from 'react';
import { MapPin, CheckCircle, AlertTriangle, Loader2, User, ChevronLeft, Search, UserPlus, Clock } from 'lucide-react';
import { AttendanceType, LocationData, Volunteer, AttendanceStatus } from '../types';
import { verifyCheckInPhoto } from '../services/geminiService';
import { JOB_SCHEDULES, getShiftStatus } from '../constants/JobSchedules';

interface AttendanceCamProps {
  onAttendance: (
    type: AttendanceType, 
    status: AttendanceStatus,
    photo: string, 
    location: LocationData, 
    aiNote: string, 
    verified: boolean, 
    activity: string,
    volunteer: Volunteer
  ) => void;
  onAddVolunteerReq: () => void;
  volunteers: Volunteer[];
}

const AttendanceCam: React.FC<AttendanceCamProps> = ({ onAttendance, onAddVolunteerReq, volunteers }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locError, setLocError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ verified: boolean; note: string } | null>(null);
  
  // Selection States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  
  // Initialize Camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLocError('');
      },
      (err) => setLocError(err.message),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (selectedVolunteer) {
      startCamera();
      getLocation();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVolunteer]);

  const captureAndVerify = async (type: AttendanceType) => {
    if (!videoRef.current || !canvasRef.current || !location || !selectedVolunteer) {
      alert("Sistem belum siap. Pastikan kamera & lokasi aktif.");
      return;
    }

    // Strict Role Time Validation for Clock In
    let finalStatus = AttendanceStatus.ON_TIME;
    let timeNote = '';

    if (type === AttendanceType.CLOCK_IN) {
       const roleValidation = getShiftStatus(selectedVolunteer.defaultRole);
       
       if (roleValidation.status === 'TOO_EARLY') {
          alert(roleValidation.message);
          return;
       }
       
       if (roleValidation.status === 'LATE') {
          finalStatus = AttendanceStatus.LATE;
          timeNote = ` [${roleValidation.message}]`;
       }
    }

    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(dataUrl);

      const analysis = await verifyCheckInPhoto(dataUrl);
      setAiAnalysis(analysis);

      // Append time validation note to AI note
      const fullNote = analysis.note + timeNote;

      onAttendance(
        type, 
        finalStatus,
        dataUrl, 
        location, 
        fullNote, 
        analysis.isVerified, 
        selectedVolunteer.defaultRole,
        selectedVolunteer
      );
    }
    
    setIsProcessing(false);
  };

  const reset = () => {
    setCapturedImage(null);
    setAiAnalysis(null);
    if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
    }
  };

  const filteredVolunteers = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- VIEW: SELECT VOLUNTEER (SEARCHABLE) ---
  if (!selectedVolunteer) {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <User size={24} className="text-orange-600"/>
          Absensi Relawan
        </h2>
        
        {/* Search Bar */}
        <div className="relative mb-6">
           <Search className="absolute left-3 top-3 text-slate-400" size={20} />
           <input 
              type="text"
              placeholder="Ketik nama Anda..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
           />
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {filteredVolunteers.length > 0 ? (
            filteredVolunteers.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVolunteer(v)}
                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                    {v.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{v.name}</div>
                    <div className="text-xs text-slate-500">{v.defaultRole}</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-400 group-hover:text-orange-600">
                   Pilih &rarr;
                </div>
              </button>
            ))
          ) : (
            // NOT FOUND STATE
            <div className="text-center p-8 bg-red-50 rounded-xl border border-red-100 animate-in zoom-in-95">
               <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={28} />
               </div>
               <h3 className="font-bold text-red-900 mb-2">Nama "{searchTerm}" Tidak Ditemukan</h3>
               <p className="text-red-700 text-sm mb-6">
                 Anda tidak dapat melakukan absensi jika nama belum terdaftar di database Dapur Kalibata 2.
               </p>
               <div className="flex flex-col gap-2">
                 <button 
                   onClick={onAddVolunteerReq}
                   className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                 >
                   + Daftar Relawan Baru
                 </button>
                 <button 
                   onClick={() => setSearchTerm('')}
                   className="w-full py-3 bg-white text-slate-600 font-medium rounded-lg hover:bg-slate-50 border border-slate-200"
                 >
                   Cari Nama Lain
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW: CAMERA & PROCESS ---
  const schedule = JOB_SCHEDULES[selectedVolunteer.defaultRole];
  const shiftInfo = schedule 
      ? `${schedule.start} - ${schedule.end}` 
      : 'Jadwal Umum';

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in slide-in-from-right-4">
      <button 
        onClick={() => setSelectedVolunteer(null)}
        className="mb-4 text-sm text-slate-500 hover:text-orange-600 flex items-center gap-1"
      >
        <ChevronLeft size={16} /> Ganti Orang
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{selectedVolunteer.name}</h2>
            <div className="flex items-center gap-2 text-xs text-orange-800 mt-1">
               <span className="font-bold bg-orange-200 px-2 py-0.5 rounded text-orange-900">{selectedVolunteer.defaultRole}</span>
               <span className="flex items-center gap-1 opacity-80"><Clock size={10} /> {shiftInfo}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-white text-orange-700 border border-orange-200 rounded-full">
            <MapPin size={12} />
            {location ? `Lokasi Terkunci` : `Mencari Lokasi...`}
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {!capturedImage ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
          ) : (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
          )}

          {!capturedImage && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
               <div className="w-48 h-64 border-2 border-white/50 rounded-full border-dashed mb-4"></div>
               <p className="text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm text-center">
                 Pastikan APD Lengkap<br/>(Masker, Apron, Hairnet)
               </p>
            </div>
          )}

          {isProcessing && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-white">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="font-medium animate-pulse">AI Memvalidasi Kelengkapan...</p>
             </div>
          )}
        </div>

        {/* Action Area */}
        <div className="p-6">
          {capturedImage && aiAnalysis ? (
            <div className="space-y-4">
               <div className={`p-4 rounded-lg border ${aiAnalysis.verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-start gap-3">
                    {aiAnalysis.verified ? <CheckCircle className="text-green-600 mt-1" /> : <AlertTriangle className="text-yellow-600 mt-1" />}
                    <div>
                      <h4 className={`font-semibold ${aiAnalysis.verified ? 'text-green-800' : 'text-yellow-800'}`}>
                        {aiAnalysis.verified ? 'Verifikasi Selesai' : 'Perlu Cek Ulang'}
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">{aiAnalysis.note}</p>
                    </div>
                  </div>
               </div>
               <button onClick={reset} className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors">
                 Scan Ulang
               </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
                 Info: Anda wajib hadir 30 menit sebelum jam operasional <strong>{selectedVolunteer.defaultRole}</strong>.
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => captureAndVerify(AttendanceType.CLOCK_IN)}
                  disabled={!location || isProcessing}
                  className="py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold text-lg shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                >
                  MASUK KERJA
                  <span className="text-xs font-normal opacity-80">Check-in</span>
                </button>
                
                <button 
                  onClick={() => captureAndVerify(AttendanceType.CLOCK_OUT)}
                  disabled={!location || isProcessing}
                  className="py-4 bg-slate-700 text-white rounded-xl hover:bg-slate-800 font-bold text-lg shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                >
                  PULANG
                  <span className="text-xs font-normal opacity-80">Check-out</span>
                </button>
              </div>
            </div>
          )}
          
          {locError && <p className="text-red-500 text-xs text-center mt-3">{locError}</p>}
        </div>
      </div>
      
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AttendanceCam;
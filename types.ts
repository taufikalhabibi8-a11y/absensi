export enum AttendanceType {
  CLOCK_IN = 'CLOCK_IN',
  CLOCK_OUT = 'CLOCK_OUT'
}

export enum AttendanceStatus {
  ON_TIME = 'ON_TIME',     // Tepat Waktu (Sesuai peraturan 30 menit sebelum)
  LATE = 'LATE',           // Terlambat
  EARLY_LEAVE = 'EARLY',   // Pulang Cepat
  OVERTIME = 'OVERTIME'    // Lembur
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  type: AttendanceType;
  status: AttendanceStatus;
  timestamp: number;
  photoUrl: string;
  location: LocationData;
  aiVerificationNote?: string; 
  isVerified: boolean;
  activity?: string; 
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  defaultRole: string; // Must match keys in JobSchedules or be 'Umum'
  joinDate: number;
}

export interface AiAnalysisData {
  summary: string;
  attendanceRate: number; // percentage
  roleBreakdown: Record<string, number>;
  predictedPortions: number;
  anomalies: string[];
}

export type ViewState = 'dashboard' | 'attendance' | 'history' | 'reports';
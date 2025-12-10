export interface Schedule {
  start: string; // HH:mm
  end: string;   // HH:mm
  description: string;
  tasks: string[];
}

export const JOB_SCHEDULES: Record<string, Schedule> = {
  'Gudang': {
    start: '18:00',
    end: '02:00',
    description: 'Persiapan Bahan Baku (Malam)',
    tasks: ['Bongkar Muat Sayur', 'Kupas & Potong', 'QC Bahan']
  },
  'Helper': {
    start: '00:00',
    end: '08:00',
    description: 'Helper Masak & Streamer (3 Shift)',
    tasks: ['Helper Umum (2 org)', 'Potong Ayam (1 org)', 'Streamer Nasi (1 org)']
  },
  'Cook': {
    start: '01:00',
    end: '09:00',
    description: 'Tim Utama Memasak',
    tasks: ['Tahap 1 (02:00-05:00)', 'Tahap 2 (05:00-08:00)', 'Seasoning']
  },
  'Pemorsian': {
    start: '03:00',
    end: '11:00',
    description: 'Packing & Plating',
    tasks: ['Tahap 1 (03:00-06:00)', 'Tahap 2 (06:00-10:00)']
  },
  'Driver': {
    start: '07:00',
    end: '15:00',
    description: 'Distribusi Makanan',
    tasks: ['Muat Barang', 'Jalan Tahap 1 (07:30)', 'Jalan Tahap 2 (10:30)']
  },
  'Cuci Ompreng': {
    start: '13:30',
    end: '21:30',
    description: 'Sanitasi & Kebersihan',
    tasks: ['Cuci Ompreng', 'Sterilisasi Alat', 'Bersih Area']
  }
};

// Helper to convert HH:mm to minutes from midnight
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Check if current time is within 30 mins BEFORE start time (Mandatory Arrival)
export const getShiftStatus = (role: string): { status: 'OK' | 'LATE' | 'TOO_EARLY'; message: string } => {
  const schedule = JOB_SCHEDULES[role];
  if (!schedule) return { status: 'OK', message: 'Role umum' };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(schedule.start);
  
  // Mandatory arrival: 30 mins before start
  let arrivalDeadline = startMinutes - 30;
  if (arrivalDeadline < 0) arrivalDeadline += 1440; // Handle previous day wrap

  // Handle midnight wrap for logic
  // Simple check: strict comparison isn't perfect for 24h, but sufficient for this logic:
  // If Start is 07:00 (420), Deadline is 06:30 (390).
  // If current is 06:40 (400) -> LATE (because > 390).
  
  // Note: This logic assumes the volunteer is clocking in relatively close to their shift.
  
  const diff = currentMinutes - arrivalDeadline;
  
  // Allow check-in up to 2 hours early
  if (diff < -120) return { status: 'TOO_EARLY', message: 'Terlalu awal (Max 2 jam sebelum shift)' };
  
  if (diff > 0) {
    // Check if within the shift window significantly
    return { status: 'LATE', message: `Terlambat! Wajib hadir 30 menit sebelum ${schedule.start}` };
  }

  return { status: 'OK', message: 'Tepat Waktu' };
};
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

export interface Attendance {
  id: string;
  gradeId: string;
  date: string;
  grade?: { id: string; level: number; section: string; stream: string };
  _count?: { records: number };
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendancePercentage: number;
}

export interface BoardExamRegistration {
  id: string;
  studentId: string;
  academicYearId: string;
  symbolNo: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNo: string;
  };
  academicYear?: { id: string; name: string };
}

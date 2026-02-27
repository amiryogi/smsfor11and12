import type { AttendanceStatus } from "./api.types";

export interface Attendance {
  id: string;
  schoolId: string;
  gradeId: string;
  academicYearId: string;
  date: string;
  takenBy: string | null;
  grade?: { id: string; level: number; section: string; stream: string };
  academicYear?: { id: string; name: string };
  records?: AttendanceRecord[];
  _count?: { records: number };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  attendanceId: string;
  studentId: string;
  status: AttendanceStatus;
  remarks: string | null;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNo: string;
  };
  createdAt: string;
}

export interface TakeAttendanceInput {
  gradeId: string;
  academicYearId: string;
  date: string;
  records: AttendanceRecordEntry[];
}

export interface AttendanceRecordEntry {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface UpdateAttendanceInput {
  records: AttendanceRecordEntry[];
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
  schoolId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardExamRegistrationInput {
  studentId: string;
  academicYearId: string;
  symbolNo: string;
}

export interface UpdateBoardExamRegistrationInput {
  symbolNo?: string;
}

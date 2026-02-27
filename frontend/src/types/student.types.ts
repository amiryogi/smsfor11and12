import type { Gender, StudentStatus } from "./api.types";

export interface Student {
  id: string;
  schoolId: string;
  registrationNo: string;
  firstName: string;
  lastName: string;
  dob: string;
  dobBsYear: number | null;
  dobBsMonth: number | null;
  dobBsDay: number | null;
  gender: Gender;
  phone: string | null;
  address: string | null;
  citizenshipNo: string | null;
  profilePicS3Key: string | null;
  status: StudentStatus;
  enrollments?: Enrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  registrationNo: string;
  firstName: string;
  lastName: string;
  dob: string;
  dobBsYear?: number;
  dobBsMonth?: number;
  dobBsDay?: number;
  gender: Gender;
  phone?: string;
  address?: string;
  citizenshipNo?: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  citizenshipNo?: string;
  dobBsYear?: number;
  dobBsMonth?: number;
  dobBsDay?: number;
  status?: StudentStatus;
}

export interface Enrollment {
  id: string;
  schoolId: string;
  studentId: string;
  gradeId: string;
  academicYearId: string;
  enrolledAt: string;
  rollNo: number | null;
  grade?: { id: string; level: number; section: string; stream: string };
  academicYear?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentInput {
  studentId: string;
  gradeId: string;
  academicYearId: string;
  rollNo?: number;
}

export interface BulkPromoteInput {
  fromGradeId: string;
  toGradeId: string;
  academicYearId: string;
}

export interface StudentParent {
  id: string;
  studentId: string;
  parentId: string;
  relationship: string;
  parent?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

export interface LinkParentInput {
  parentId: string;
  relationship: string;
}

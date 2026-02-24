import type { Stream } from "./api.types";

export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export interface Term {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTermInput {
  name: string;
  startDate: string;
  endDate: string;
}

export interface Grade {
  id: string;
  schoolId: string;
  level: number;
  section: string;
  stream: Stream;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradeInput {
  level: number;
  section: string;
  stream: Stream;
  capacity?: number;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  creditHours: number;
  hasTheory: boolean;
  hasPractical: boolean;
  theoryFullMarks: number;
  practicalFullMarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  creditHours?: number;
  hasTheory?: boolean;
  hasPractical?: boolean;
  theoryFullMarks?: number;
  practicalFullMarks?: number;
}

export interface GradeSubject {
  id: string;
  schoolId: string;
  gradeId: string;
  subjectId: string;
  teacherId: string | null;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
}

export interface AssignSubjectInput {
  subjectId: string;
  teacherId?: string;
}

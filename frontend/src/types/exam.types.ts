import type { ExamType, ExamStatus } from "./api.types";

export interface Exam {
  id: string;
  schoolId: string;
  academicYearId: string;
  termId: string | null;
  gradeId: string | null;
  name: string;
  examType: ExamType;
  startDate: string | null;
  endDate: string | null;
  status: ExamStatus;
  academicYear?: { id: string; name: string };
  term?: { id: string; name: string } | null;
  grade?: { id: string; level: number; section: string; stream: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamInput {
  name: string;
  examType: ExamType;
  academicYearId: string;
  termId?: string;
  gradeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateExamInput {
  name?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExamResult {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  gradeSubjectId: string;
  theoryMarksObtained: number | null;
  theoryFullMarks: number;
  theoryPercentage: number | null;
  theoryGrade: string | null;
  theoryGradePoint: number | null;
  practicalMarksObtained: number | null;
  practicalFullMarks: number | null;
  practicalPercentage: number | null;
  practicalGrade: string | null;
  practicalGradePoint: number | null;
  totalPercentage: number | null;
  finalGrade: string;
  finalGradePoint: number | null;
  isNg: boolean;
  remarks: string | null;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNo: string;
  };
  gradeSubject?: {
    id: string;
    isOptional?: boolean;
    subject?: { id: string; name: string; code: string; creditHours?: number };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamResultInput {
  studentId: string;
  gradeSubjectId: string;
  theoryMarksObtained?: number;
  practicalMarksObtained?: number;
}

export interface BulkExamResultInput {
  results: CreateExamResultInput[];
}

// ---- NEB GPA / Classification ----

export type NebClassification =
  | "DISTINCTION"
  | "FIRST_DIVISION"
  | "SECOND_DIVISION"
  | "THIRD_DIVISION"
  | "FAIL";

export interface StudentExamSummary {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  totalCreditHours: number;
  weightedGradePointSum: number;
  gpa: number;
  classification: NebClassification;
  rank: number | null;
  hasNg: boolean;
  ngSubjectCount: number;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNo: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExamFinalizationResult extends Exam {
  finalization: {
    resultsRecomputed: number;
    total: number;
    passing: number;
    failing: number;
  };
}

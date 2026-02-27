export interface Exam {
  id: string;
  name: string;
  examType: "UNIT_TEST" | "TERMINAL" | "PREBOARD" | "FINAL";
  status: "DRAFT" | "MARKS_ENTRY" | "FINALIZED" | "PUBLISHED";
  startDate?: string;
  endDate?: string;
  gradeId?: string;
  academicYear?: { id: string; name: string };
  term?: { id: string; name: string };
  grade?: { id: string; level: number; section: string; stream: string };
}

export interface ExamResult {
  id: string;
  subjectName: string;
  subjectCode: string;
  theoryMarksObtained?: number;
  theoryFullMarks: number;
  theoryGrade?: string;
  practicalMarksObtained?: number;
  practicalFullMarks?: number;
  practicalGrade?: string;
  finalGrade: string;
  finalGradePoint?: number;
  isNg: boolean;
  creditHours?: number;
  isOptional?: boolean;
}

export interface BulkMarksEntry {
  studentId: string;
  gradeSubjectId: string;
  theoryMarksObtained: number;
  practicalMarksObtained?: number;
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
  examId: string;
  studentId: string;
  totalCreditHours: number;
  weightedGradePointSum: number;
  gpa: number;
  classification: NebClassification;
  rank: number | null;
  hasNg: boolean;
  ngSubjectCount: number;
}

export interface Exam {
  id: string;
  name: string;
  examType: "UNIT_TEST" | "TERMINAL" | "PREBOARD" | "FINAL";
  status: "DRAFT" | "MARKS_ENTRY" | "FINALIZED" | "PUBLISHED";
  startDate?: string;
  endDate?: string;
  academicYear?: { id: string; name: string };
  term?: { id: string; name: string };
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
}

export interface BulkMarksEntry {
  studentId: string;
  gradeSubjectId: string;
  theoryMarksObtained: number;
  practicalMarksObtained?: number;
}

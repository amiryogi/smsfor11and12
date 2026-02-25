/**
 * NEB Grade Point System (mirrors backend logic).
 *
 * Percentage Range → Grade → Grade Point
 * 90-100  → A+  → 4.0
 * 80-89   → A   → 3.6
 * 70-79   → B+  → 3.2
 * 60-69   → B   → 2.8
 * 50-59   → C+  → 2.4
 * 40-49   → C   → 2.0
 * 30-39   → D   → 1.6
 * 0-29    → NG  → 0.0
 */

interface GradeResult {
  grade: string;
  gradePoint: number;
}

const GRADE_TABLE: Array<{ min: number; grade: string; gradePoint: number }> = [
  { min: 90, grade: "A+", gradePoint: 4.0 },
  { min: 80, grade: "A", gradePoint: 3.6 },
  { min: 70, grade: "B+", gradePoint: 3.2 },
  { min: 60, grade: "B", gradePoint: 2.8 },
  { min: 50, grade: "C+", gradePoint: 2.4 },
  { min: 40, grade: "C", gradePoint: 2.0 },
  { min: 30, grade: "D", gradePoint: 1.6 },
  { min: 0, grade: "NG", gradePoint: 0.0 },
];

/**
 * Calculate NEB grade from percentage.
 */
export function calculateNEBGrade(percentage: number): GradeResult {
  for (const row of GRADE_TABLE) {
    if (percentage >= row.min) {
      return { grade: row.grade, gradePoint: row.gradePoint };
    }
  }
  return { grade: "NG", gradePoint: 0.0 };
}

/**
 * Calculate GPA from an array of grade points.
 */
export function calculateGPA(gradePoints: number[]): number {
  if (gradePoints.length === 0) return 0;
  const sum = gradePoints.reduce((acc, gp) => acc + gp, 0);
  return Number((sum / gradePoints.length).toFixed(2));
}

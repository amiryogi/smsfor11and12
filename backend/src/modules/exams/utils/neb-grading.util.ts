export interface NebGrade {
  letterGrade: string;
  gradePoint: number | null;
  isNg: boolean;
}

/**
 * NEB Grade thresholds (percentage → letter grade + grade point).
 * Theory passing: 35%  |  Practical passing: 40%
 */
export function calculateNebGrade(
  percentage: number,
  isPractical = false,
): NebGrade {
  const passingPercentage = isPractical ? 40 : 35;

  if (percentage < passingPercentage)
    return { letterGrade: 'NG', gradePoint: null, isNg: true };

  if (percentage >= 90)
    return { letterGrade: 'A+', gradePoint: 4.0, isNg: false };
  if (percentage >= 80)
    return { letterGrade: 'A', gradePoint: 3.6, isNg: false };
  if (percentage >= 70)
    return { letterGrade: 'B+', gradePoint: 3.2, isNg: false };
  if (percentage >= 60)
    return { letterGrade: 'B', gradePoint: 2.8, isNg: false };
  if (percentage >= 50)
    return { letterGrade: 'C+', gradePoint: 2.4, isNg: false };
  if (percentage >= 40)
    return { letterGrade: 'C', gradePoint: 2.0, isNg: false };
  if (percentage >= 35 && !isPractical)
    return { letterGrade: 'D', gradePoint: 1.6, isNg: false };

  return { letterGrade: 'NG', gradePoint: null, isNg: true };
}

// =====================================================================
// Credit-hour-weighted GPA & Classification (NEB +2 rules)
// =====================================================================

export interface SubjectResult {
  creditHours: number;
  gradePoint: number | null;
  isNg: boolean;
  isOptional: boolean;
}

export interface GpaResult {
  gpa: number;
  totalCreditHours: number;
  weightedSum: number;
  classification: NebClassification;
  hasNg: boolean;
  /** Number of compulsory subjects with NG */
  ngCompulsoryCount: number;
  /** Number of optional subjects with NG */
  ngOptionalCount: number;
}

export type NebClassification =
  | 'DISTINCTION'
  | 'FIRST_DIVISION'
  | 'SECOND_DIVISION'
  | 'THIRD_DIVISION'
  | 'FAIL';

/**
 * Calculate credit-hour-weighted GPA following NEB +2 rules.
 *
 * Rules:
 * - GPA = Σ(creditHours × gradePoint) / Σ(creditHours)
 * - Optional subject: included only if it raises the GPA (NEB policy)
 * - If ANY compulsory subject has NG → student is classified as FAIL
 *   (GPA is still calculated for record purposes)
 */
export function calculateWeightedGPA(results: SubjectResult[]): GpaResult {
  const compulsory = results.filter((r) => !r.isOptional);
  const optional = results.filter((r) => r.isOptional);

  // Count NG subjects
  const ngCompulsoryCount = compulsory.filter((r) => r.isNg).length;
  const ngOptionalCount = optional.filter((r) => r.isNg).length;
  const hasNg = ngCompulsoryCount > 0;

  // Step 1: Compute GPA from compulsory subjects only
  let totalCreditHours = 0;
  let weightedSum = 0;

  for (const r of compulsory) {
    totalCreditHours += r.creditHours;
    weightedSum += r.creditHours * (r.gradePoint ?? 0);
  }

  const compulsoryGpa =
    totalCreditHours > 0 ? weightedSum / totalCreditHours : 0;

  // Step 2: Check each optional subject — include only if it improves GPA
  for (const r of optional) {
    if (r.isNg || r.gradePoint === null) continue; // skip NG optional

    const newTotal = totalCreditHours + r.creditHours;
    const newWeighted = weightedSum + r.creditHours * r.gradePoint;
    const newGpa = newTotal > 0 ? newWeighted / newTotal : 0;

    if (newGpa >= compulsoryGpa) {
      totalCreditHours = newTotal;
      weightedSum = newWeighted;
    }
    // else: excluding this optional gives a better GPA
  }

  const gpa =
    totalCreditHours > 0
      ? Number((weightedSum / totalCreditHours).toFixed(2))
      : 0;

  // Determine classification
  const classification: NebClassification = hasNg
    ? 'FAIL'
    : classifyGPA(gpa);

  return {
    gpa,
    totalCreditHours,
    weightedSum: Number(weightedSum.toFixed(2)),
    classification,
    hasNg,
    ngCompulsoryCount,
    ngOptionalCount,
  };
}

/**
 * NEB +2 Classification tiers based on GPA.
 */
export function classifyGPA(gpa: number): NebClassification {
  if (gpa >= 3.6) return 'DISTINCTION';
  if (gpa >= 3.2) return 'FIRST_DIVISION';
  if (gpa >= 2.4) return 'SECOND_DIVISION';
  if (gpa >= 1.6) return 'THIRD_DIVISION';
  return 'FAIL';
}

/**
 * Determine if including an optional subject improves a student's GPA.
 * Utility exposed for UI preview before finalization.
 */
export function isOptionalBeneficial(
  currentGpa: number,
  currentCreditHours: number,
  optionalCreditHours: number,
  optionalGradePoint: number,
): boolean {
  const newTotal = currentCreditHours + optionalCreditHours;
  const currentWeighted = currentGpa * currentCreditHours;
  const newGpa =
    (currentWeighted + optionalCreditHours * optionalGradePoint) / newTotal;
  return newGpa >= currentGpa;
}

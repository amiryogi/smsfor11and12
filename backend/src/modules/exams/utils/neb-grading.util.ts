export interface NebGrade {
  letterGrade: string;
  gradePoint: number | null;
  isNg: boolean;
}

/**
 * Calculates NEB Grade based on percentage.
 * Theory passing: 35%, Practical passing: 40%
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

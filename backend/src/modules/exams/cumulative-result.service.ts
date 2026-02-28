import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { ExamWeightageService } from './exam-weightage.service.js';
import { calculateNebGrade } from './utils/neb-grading.util.js';
import { ExamType } from '@prisma/client';

export interface CumulativeSubjectResult {
  gradeSubjectId: string;
  subjectName: string;
  subjectCode: string;
  creditHours: number;
  isOptional: boolean;
  /** Weighted combined percentage across exam types */
  weightedPercentage: number;
  finalGrade: string;
  finalGradePoint: number | null;
  isNg: boolean;
  components: {
    examType: ExamType;
    examName: string;
    percentage: number | null;
    weightPercent: number;
    internalMarks?: number;
    internalFullMarks?: number;
  }[];
}

export interface CumulativeResult {
  studentId: string;
  gradeId: string;
  academicYearId: string;
  subjects: CumulativeSubjectResult[];
  gpa: number;
  totalCreditHours: number;
  classification: string;
  hasNg: boolean;
}

/**
 * Combines weighted results across exam types (e.g., Internal 25% + Terminal 75%)
 * into a final transcript grade per subject.
 *
 * NEB standard: Internal Assessment (25%) + Terminal Exam (75%) for most subjects.
 */
@Injectable()
export class CumulativeResultService {
  private readonly logger = new Logger(CumulativeResultService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly examWeightageService: ExamWeightageService,
  ) {}

  /**
   * Compute cumulative results for a student across all exam types
   * in a given grade and academic year.
   */
  async computeCumulativeResult(
    schoolId: string,
    studentId: string,
    gradeId: string,
    academicYearId: string,
  ): Promise<CumulativeResult> {
    // 1. Get weightage config for this grade/year
    const weightages = await this.examWeightageService.getWeightagesForGrade(
      schoolId,
      gradeId,
      academicYearId,
    );

    if (weightages.length === 0) {
      this.logger.warn(
        `No weightage config found for grade ${gradeId}, year ${academicYearId}. Using equal weights.`,
      );
    }

    const weightMap = new Map<ExamType, number>();
    for (const w of weightages) {
      weightMap.set(w.examType, w.weightPercent);
    }

    // 2. Get all exams for this grade/year
    const exams = await this.prisma.exam.findMany({
      where: {
        schoolId,
        gradeId,
        academicYearId,
        status: { in: ['FINALIZED', 'PUBLISHED'] },
        deletedAt: null,
      },
    });

    // 3. Get all exam results for this student across those exams
    const examIds = exams.map((e) => e.id);
    const results = await this.prisma.examResult.findMany({
      where: {
        schoolId,
        studentId,
        examId: { in: examIds },
      },
      include: {
        exam: { select: { id: true, name: true, examType: true } },
        gradeSubject: {
          include: {
            subject: {
              select: { id: true, name: true, code: true, creditHours: true },
            },
          },
        },
      },
    });

    // 4. Get internal assessments for this student
    const internalAssessments = await this.prisma.internalAssessment.findMany({
      where: {
        schoolId,
        studentId,
        examId: { in: examIds },
        deletedAt: null,
      },
    });
    const iaMap = new Map<string, typeof internalAssessments[0]>();
    for (const ia of internalAssessments) {
      iaMap.set(`${ia.examId}:${ia.gradeSubjectId}`, ia);
    }

    // 5. Group results by gradeSubject
    const subjectMap = new Map<string, {
      gradeSubjectId: string;
      subjectName: string;
      subjectCode: string;
      creditHours: number;
      isOptional: boolean;
      entries: {
        examType: ExamType;
        examName: string;
        percentage: number | null;
        weightPercent: number;
        internalMarks?: number;
        internalFullMarks?: number;
      }[];
    }>();

    for (const r of results) {
      const gsId = r.gradeSubjectId;
      if (!subjectMap.has(gsId)) {
        subjectMap.set(gsId, {
          gradeSubjectId: gsId,
          subjectName: r.gradeSubject.subject.name,
          subjectCode: r.gradeSubject.subject.code,
          creditHours: r.gradeSubject.subject.creditHours,
          isOptional: r.gradeSubject.isOptional,
          entries: [],
        });
      }

      const weight = weightMap.get(r.exam.examType) ?? (100 / Math.max(exams.length, 1));
      const ia = iaMap.get(`${r.examId}:${gsId}`);

      subjectMap.get(gsId)!.entries.push({
        examType: r.exam.examType,
        examName: r.exam.name,
        percentage: r.totalPercentage !== null ? Number(r.totalPercentage) : null,
        weightPercent: weight,
        internalMarks: ia ? Number(ia.totalMarks) : undefined,
        internalFullMarks: ia ? ia.fullMarks : undefined,
      });
    }

    // 6. Compute weighted percentage per subject
    const cumulativeSubjects: CumulativeSubjectResult[] = [];
    let totalCreditHours = 0;
    let weightedGpSum = 0;
    let hasNg = false;

    for (const [, sub] of subjectMap) {
      const totalWeight = sub.entries.reduce((sum, e) => sum + e.weightPercent, 0);

      let weightedPct = 0;
      for (const entry of sub.entries) {
        if (entry.percentage !== null) {
          weightedPct += (entry.percentage * entry.weightPercent) / Math.max(totalWeight, 1);
        }
      }

      const grade = calculateNebGrade(weightedPct, false);

      cumulativeSubjects.push({
        gradeSubjectId: sub.gradeSubjectId,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        creditHours: sub.creditHours,
        isOptional: sub.isOptional,
        weightedPercentage: Number(weightedPct.toFixed(2)),
        finalGrade: grade.letterGrade,
        finalGradePoint: grade.gradePoint,
        isNg: grade.isNg,
        components: sub.entries,
      });

      if (!sub.isOptional) {
        totalCreditHours += sub.creditHours;
        weightedGpSum += sub.creditHours * (grade.gradePoint ?? 0);
        if (grade.isNg) hasNg = true;
      }
    }

    const gpa = totalCreditHours > 0
      ? Number((weightedGpSum / totalCreditHours).toFixed(2))
      : 0;

    const classification = hasNg
      ? 'FAIL'
      : gpa >= 3.6
        ? 'DISTINCTION'
        : gpa >= 3.2
          ? 'FIRST_DIVISION'
          : gpa >= 2.4
            ? 'SECOND_DIVISION'
            : gpa >= 1.6
              ? 'THIRD_DIVISION'
              : 'FAIL';

    this.logger.log(
      `Cumulative result computed for student ${studentId}: GPA ${gpa} (${classification})`,
    );

    return {
      studentId,
      gradeId,
      academicYearId,
      subjects: cumulativeSubjects,
      gpa,
      totalCreditHours,
      classification,
      hasNg,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { CreateExamResultDto } from './dto/create-exam-result.dto.js';
import {
  calculateNebGrade,
  calculateWeightedGPA,
  type SubjectResult,
} from './utils/neb-grading.util.js';
import {
  ExamNotFoundException,
  MarksExceedMaximum,
  MarksEntryNotOpenException,
  SubjectNotAssignedToTeacherException,
  ResourceNotFoundException,
} from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';

/** Minimal subject info needed for grade computation */
interface SubjectInfo {
  hasTheory: boolean;
  hasPractical: boolean;
  theoryFullMarks: number;
  practicalFullMarks: number;
}

@Injectable()
export class ExamResultService {
  private readonly logger = new Logger(ExamResultService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // Queries
  // ==========================================================================

  async findByExam(
    schoolId: string,
    examId: string,
    pagination: PaginationDto,
    gradeSubjectId?: string,
    studentId?: string,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const where: Record<string, unknown> = { schoolId, examId };
    if (gradeSubjectId) where.gradeSubjectId = gradeSubjectId;
    if (studentId) where.studentId = studentId;

    const [data, total] = await Promise.all([
      this.prisma.examResult.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          student: true,
          gradeSubject: { include: { subject: true } },
        },
      }),
      this.prisma.examResult.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findStudentResults(
    schoolId: string,
    examId: string,
    studentId: string,
  ) {
    return this.prisma.examResult.findMany({
      where: { schoolId, examId, studentId },
      include: { gradeSubject: { include: { subject: true } } },
    });
  }

  async findStudentSummary(
    schoolId: string,
    examId: string,
    studentId: string,
  ) {
    return this.prisma.studentExamSummary.findUnique({
      where: { examId_studentId: { examId, studentId } },
    });
  }

  async findExamSummaries(schoolId: string, examId: string) {
    return this.prisma.studentExamSummary.findMany({
      where: { schoolId, examId },
      include: { student: true },
      orderBy: [{ rank: 'asc' }],
    });
  }

  // ==========================================================================
  // Single & Bulk Result Creation (with proper grade computation)
  // ==========================================================================

  async createResult(
    schoolId: string,
    examId: string,
    dto: CreateExamResultDto,
    actor?: { userId: string; role: string },
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
    });
    if (!exam) throw new ExamNotFoundException(examId);

    // ── Marks locking: only allow during MARKS_ENTRY ──
    if (exam.status !== 'MARKS_ENTRY') {
      throw new MarksEntryNotOpenException(examId, exam.status);
    }

    const gradeSubject = await this.prisma.gradeSubject.findFirst({
      where: { id: dto.gradeSubjectId, schoolId },
      include: { subject: true },
    });
    if (!gradeSubject)
      throw new ResourceNotFoundException('GradeSubject', dto.gradeSubjectId);

    // ── Subject lock: teachers only edit their assigned subjects ──
    if (actor?.role === 'TEACHER' && gradeSubject.teacherId !== actor.userId) {
      throw new SubjectNotAssignedToTeacherException(dto.gradeSubjectId);
    }

    return this.buildResultUpsert(
      schoolId,
      examId,
      dto,
      gradeSubject.subject,
    );
  }

  async bulkCreateResults(
    schoolId: string,
    examId: string,
    results: CreateExamResultDto[],
    actor?: { userId: string; role: string },
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
    });
    if (!exam) throw new ExamNotFoundException(examId);

    // ── Marks locking: only allow during MARKS_ENTRY ──
    if (exam.status !== 'MARKS_ENTRY') {
      throw new MarksEntryNotOpenException(examId, exam.status);
    }

    // Pre-fetch all referenced grade-subjects with their subject data
    const gradeSubjectIds = [...new Set(results.map((r) => r.gradeSubjectId))];
    const gradeSubjects = await this.prisma.gradeSubject.findMany({
      where: { id: { in: gradeSubjectIds }, schoolId },
      include: { subject: true },
    });
    const gsMap = new Map(gradeSubjects.map((gs) => [gs.id, gs]));

    for (const dto of results) {
      if (!gsMap.has(dto.gradeSubjectId)) {
        throw new ResourceNotFoundException(
          'GradeSubject',
          dto.gradeSubjectId,
        );
      }

      // ── Subject lock: teachers only edit their assigned subjects ──
      if (actor?.role === 'TEACHER') {
        const gs = gsMap.get(dto.gradeSubjectId)!;
        if (gs.teacherId !== actor.userId) {
          throw new SubjectNotAssignedToTeacherException(dto.gradeSubjectId);
        }
      }
    }

    const operations = results.map((dto) => {
      const gs = gsMap.get(dto.gradeSubjectId)!;
      return this.buildResultUpsert(schoolId, examId, dto, gs.subject);
    });

    return this.prisma.$transaction(operations);
  }

  // ==========================================================================
  // GPA Computation
  // ==========================================================================

  /**
   * Compute credit-hour-weighted GPA for one student in one exam.
   * Upserts the result into StudentExamSummary.
   */
  async computeStudentGPA(
    schoolId: string,
    examId: string,
    studentId: string,
  ) {
    const results = await this.prisma.examResult.findMany({
      where: { schoolId, examId, studentId },
      include: { gradeSubject: { include: { subject: true } } },
    });

    if (results.length === 0) return null;

    const subjectResults: SubjectResult[] = results.map((r) => ({
      creditHours: r.gradeSubject.subject.creditHours,
      gradePoint: r.finalGradePoint !== null ? Number(r.finalGradePoint) : null,
      isNg: r.isNg,
      isOptional: r.gradeSubject.isOptional,
    }));

    const gpa = calculateWeightedGPA(subjectResults);

    return this.prisma.studentExamSummary.upsert({
      where: { examId_studentId: { examId, studentId } },
      update: {
        totalCreditHours: gpa.totalCreditHours,
        weightedGradePointSum: gpa.weightedSum,
        gpa: gpa.gpa,
        classification: gpa.classification,
        hasNg: gpa.hasNg,
        ngSubjectCount: gpa.ngCompulsoryCount + gpa.ngOptionalCount,
      },
      create: {
        schoolId,
        examId,
        studentId,
        totalCreditHours: gpa.totalCreditHours,
        weightedGradePointSum: gpa.weightedSum,
        gpa: gpa.gpa,
        classification: gpa.classification,
        hasNg: gpa.hasNg,
        ngSubjectCount: gpa.ngCompulsoryCount + gpa.ngOptionalCount,
      },
    });
  }

  /**
   * Compute GPA summaries for ALL students in an exam, then assign ranks.
   * Called during finalization.
   */
  async computeAllExamSummaries(schoolId: string, examId: string) {
    this.logger.log(`Computing GPA summaries for exam ${examId}`);

    // Step 1: Get all distinct students with results
    const studentRows = await this.prisma.examResult.findMany({
      where: { schoolId, examId },
      select: { studentId: true },
      distinct: ['studentId'],
    });
    const studentIds = studentRows.map((r) => r.studentId);

    // Step 2: Compute GPA for each student
    const summaries = [];
    for (const studentId of studentIds) {
      const summary = await this.computeStudentGPA(
        schoolId,
        examId,
        studentId,
      );
      if (summary) summaries.push(summary);
    }

    // Step 3: Assign ranks — passing students sorted by GPA descending
    const passing = summaries
      .filter((s) => s.classification !== 'FAIL')
      .sort((a, b) => Number(b.gpa) - Number(a.gpa));

    const rankOps = [];
    for (let i = 0; i < passing.length; i++) {
      rankOps.push(
        this.prisma.studentExamSummary.update({
          where: { id: passing[i].id },
          data: { rank: i + 1 },
        }),
      );
    }

    // Clear rank for FAIL students
    const failing = summaries.filter((s) => s.classification === 'FAIL');
    for (const s of failing) {
      rankOps.push(
        this.prisma.studentExamSummary.update({
          where: { id: s.id },
          data: { rank: null },
        }),
      );
    }

    if (rankOps.length > 0) {
      await this.prisma.$transaction(rankOps);
    }

    this.logger.log(
      `Computed GPA for ${summaries.length} students (${passing.length} passing, ${failing.length} failing)`,
    );

    return {
      total: summaries.length,
      passing: passing.length,
      failing: failing.length,
    };
  }

  /**
   * Re-compute grades for every ExamResult in an exam.
   * Useful when subject full-marks change or results were entered
   * via the broken legacy bulk method.
   */
  async recomputeAllGrades(schoolId: string, examId: string) {
    const results = await this.prisma.examResult.findMany({
      where: { schoolId, examId },
      include: { gradeSubject: { include: { subject: true } } },
    });

    const ops = results.map((r) => {
      const subject = r.gradeSubject.subject;
      const computed = this.computeGrades(
        {
          theoryMarksObtained:
            r.theoryMarksObtained !== null
              ? Number(r.theoryMarksObtained)
              : undefined,
          practicalMarksObtained:
            r.practicalMarksObtained !== null
              ? Number(r.practicalMarksObtained)
              : undefined,
        },
        subject,
      );

      return this.prisma.examResult.update({
        where: { id: r.id },
        data: {
          theoryFullMarks: subject.theoryFullMarks,
          theoryPercentage: computed.theoryPercentage,
          theoryGrade: computed.theoryGrade,
          theoryGradePoint: computed.theoryGradePoint,
          practicalFullMarks: subject.hasPractical
            ? subject.practicalFullMarks
            : null,
          practicalPercentage: computed.practicalPercentage,
          practicalGrade: computed.practicalGrade,
          practicalGradePoint: computed.practicalGradePoint,
          totalPercentage: computed.totalPercentage,
          finalGrade: computed.finalGrade,
          finalGradePoint: computed.finalGradePoint,
          isNg: computed.isNg,
        },
      });
    });

    if (ops.length > 0) {
      await this.prisma.$transaction(ops);
    }

    this.logger.log(`Re-computed grades for ${ops.length} results in exam ${examId}`);
    return ops.length;
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /**
   * Build a Prisma upsert operation for a single exam result.
   * Returns a PrismaPromise (can be awaited directly or batched in $transaction).
   */
  private buildResultUpsert(
    schoolId: string,
    examId: string,
    dto: CreateExamResultDto,
    subject: SubjectInfo,
  ) {
    // Validate marks
    if (
      dto.theoryMarksObtained !== undefined &&
      dto.theoryMarksObtained > subject.theoryFullMarks
    ) {
      throw new MarksExceedMaximum(
        'theoryMarksObtained',
        subject.theoryFullMarks,
      );
    }
    if (
      dto.practicalMarksObtained !== undefined &&
      subject.hasPractical &&
      dto.practicalMarksObtained > subject.practicalFullMarks
    ) {
      throw new MarksExceedMaximum(
        'practicalMarksObtained',
        subject.practicalFullMarks,
      );
    }

    const computed = this.computeGrades(dto, subject);

    const shared = {
      theoryMarksObtained: dto.theoryMarksObtained,
      theoryPercentage: computed.theoryPercentage,
      theoryGrade: computed.theoryGrade,
      theoryGradePoint: computed.theoryGradePoint,
      practicalMarksObtained: dto.practicalMarksObtained,
      practicalFullMarks: subject.hasPractical
        ? subject.practicalFullMarks
        : null,
      practicalPercentage: computed.practicalPercentage,
      practicalGrade: computed.practicalGrade,
      practicalGradePoint: computed.practicalGradePoint,
      totalPercentage: computed.totalPercentage,
      finalGrade: computed.finalGrade,
      finalGradePoint: computed.finalGradePoint,
      isNg: computed.isNg,
    };

    return this.prisma.examResult.upsert({
      where: {
        examId_studentId_gradeSubjectId: {
          examId,
          studentId: dto.studentId,
          gradeSubjectId: dto.gradeSubjectId,
        },
      },
      update: shared,
      create: {
        schoolId,
        examId,
        studentId: dto.studentId,
        gradeSubjectId: dto.gradeSubjectId,
        theoryFullMarks: subject.theoryFullMarks,
        ...shared,
      },
    });
  }

  /**
   * Pure computation of theory/practical/final grades from marks + subject info.
   */
  private computeGrades(
    marks: {
      theoryMarksObtained?: number;
      practicalMarksObtained?: number;
    },
    subject: SubjectInfo,
  ) {
    // Theory
    let theoryPercentage: number | null = null;
    let theoryGrade: string | null = null;
    let theoryGradePoint: number | null = null;
    let theoryIsNg = false;

    if (marks.theoryMarksObtained !== undefined && subject.hasTheory) {
      theoryPercentage =
        (marks.theoryMarksObtained / subject.theoryFullMarks) * 100;
      const tg = calculateNebGrade(theoryPercentage, false);
      theoryGrade = tg.letterGrade;
      theoryGradePoint = tg.gradePoint;
      theoryIsNg = tg.isNg;
    }

    // Practical
    let practicalPercentage: number | null = null;
    let practicalGrade: string | null = null;
    let practicalGradePoint: number | null = null;
    let practicalIsNg = false;

    if (marks.practicalMarksObtained !== undefined && subject.hasPractical) {
      practicalPercentage =
        (marks.practicalMarksObtained / subject.practicalFullMarks) * 100;
      const pg = calculateNebGrade(practicalPercentage, true);
      practicalGrade = pg.letterGrade;
      practicalGradePoint = pg.gradePoint;
      practicalIsNg = pg.isNg;
    }

    // Final (combined)
    const isNg = theoryIsNg || practicalIsNg;
    let totalPercentage: number | null = null;
    let finalGrade = 'NG';
    let finalGradePoint: number | null = null;

    if (!isNg) {
      const totalMarks =
        (marks.theoryMarksObtained ?? 0) + (marks.practicalMarksObtained ?? 0);
      const totalFull =
        subject.theoryFullMarks +
        (subject.hasPractical ? subject.practicalFullMarks : 0);
      totalPercentage = (totalMarks / totalFull) * 100;
      const fg = calculateNebGrade(totalPercentage, false);
      finalGrade = fg.letterGrade;
      finalGradePoint = fg.gradePoint;
    }

    return {
      theoryPercentage,
      theoryGrade,
      theoryGradePoint,
      practicalPercentage,
      practicalGrade,
      practicalGradePoint,
      totalPercentage,
      finalGrade,
      finalGradePoint,
      isNg,
    };
  }
}

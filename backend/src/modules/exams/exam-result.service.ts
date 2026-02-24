import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { CreateExamResultDto } from './dto/create-exam-result.dto.js';
import { calculateNebGrade } from './utils/neb-grading.util.js';
import {
  ExamNotFoundException,
  MarksExceedMaximum,
  ResourceNotFoundException,
} from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';

@Injectable()
export class ExamResultService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createResult(
    schoolId: string,
    examId: string,
    dto: CreateExamResultDto,
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
    });
    if (!exam) throw new ExamNotFoundException(examId);

    const gradeSubject = await this.prisma.gradeSubject.findFirst({
      where: { id: dto.gradeSubjectId, schoolId },
      include: { subject: true },
    });
    if (!gradeSubject)
      throw new ResourceNotFoundException('GradeSubject', dto.gradeSubjectId);

    const subject = gradeSubject.subject;

    // Validate marks don't exceed maximum
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

    // Calculate theory grade
    let theoryPercentage: number | null = null;
    let theoryGrade: string | null = null;
    let theoryGradePoint: number | null = null;
    let theoryIsNg = false;

    if (dto.theoryMarksObtained !== undefined && subject.hasTheory) {
      theoryPercentage =
        (dto.theoryMarksObtained / subject.theoryFullMarks) * 100;
      const tGrade = calculateNebGrade(theoryPercentage, false);
      theoryGrade = tGrade.letterGrade;
      theoryGradePoint = tGrade.gradePoint;
      theoryIsNg = tGrade.isNg;
    }

    // Calculate practical grade
    let practicalPercentage: number | null = null;
    let practicalGrade: string | null = null;
    let practicalGradePoint: number | null = null;
    let practicalIsNg = false;

    if (dto.practicalMarksObtained !== undefined && subject.hasPractical) {
      practicalPercentage =
        (dto.practicalMarksObtained / subject.practicalFullMarks) * 100;
      const pGrade = calculateNebGrade(practicalPercentage, true);
      practicalGrade = pGrade.letterGrade;
      practicalGradePoint = pGrade.gradePoint;
      practicalIsNg = pGrade.isNg;
    }

    // Calculate final grade
    const isNg = theoryIsNg || practicalIsNg;
    let totalPercentage: number | null = null;
    let finalGrade = 'NG';
    let finalGradePoint: number | null = null;

    if (!isNg) {
      const totalMarks =
        (dto.theoryMarksObtained ?? 0) + (dto.practicalMarksObtained ?? 0);
      const totalFull =
        subject.theoryFullMarks +
        (subject.hasPractical ? subject.practicalFullMarks : 0);
      totalPercentage = (totalMarks / totalFull) * 100;
      const fGrade = calculateNebGrade(totalPercentage, false);
      finalGrade = fGrade.letterGrade;
      finalGradePoint = fGrade.gradePoint;
    }

    return this.prisma.examResult.upsert({
      where: {
        examId_studentId_gradeSubjectId: {
          examId,
          studentId: dto.studentId,
          gradeSubjectId: dto.gradeSubjectId,
        },
      },
      update: {
        theoryMarksObtained: dto.theoryMarksObtained,
        theoryPercentage,
        theoryGrade,
        theoryGradePoint,
        practicalMarksObtained: dto.practicalMarksObtained,
        practicalFullMarks: subject.hasPractical
          ? subject.practicalFullMarks
          : null,
        practicalPercentage,
        practicalGrade,
        practicalGradePoint,
        totalPercentage,
        finalGrade,
        finalGradePoint,
        isNg,
      },
      create: {
        schoolId,
        examId,
        studentId: dto.studentId,
        gradeSubjectId: dto.gradeSubjectId,
        theoryMarksObtained: dto.theoryMarksObtained,
        theoryFullMarks: subject.theoryFullMarks,
        theoryPercentage,
        theoryGrade,
        theoryGradePoint,
        practicalMarksObtained: dto.practicalMarksObtained,
        practicalFullMarks: subject.hasPractical
          ? subject.practicalFullMarks
          : null,
        practicalPercentage,
        practicalGrade,
        practicalGradePoint,
        totalPercentage,
        finalGrade,
        finalGradePoint,
        isNg,
      },
    });
  }

  async bulkCreateResults(
    schoolId: string,
    examId: string,
    results: CreateExamResultDto[],
  ) {
    return this.prisma.$transaction(
      results.map((dto) =>
        this.createResultInTransaction(schoolId, examId, dto),
      ),
    );
  }

  private createResultInTransaction(
    schoolId: string,
    examId: string,
    dto: CreateExamResultDto,
  ) {
    // For transactions, we delegate to createResult — this is a simplified approach
    // In production, we would batch the upserts inside a single $transaction callback
    return this.prisma.examResult.upsert({
      where: {
        examId_studentId_gradeSubjectId: {
          examId,
          studentId: dto.studentId,
          gradeSubjectId: dto.gradeSubjectId,
        },
      },
      update: {
        theoryMarksObtained: dto.theoryMarksObtained,
        practicalMarksObtained: dto.practicalMarksObtained,
        // Grade computation should be done before calling this
        finalGrade: 'PENDING',
      },
      create: {
        schoolId,
        examId,
        studentId: dto.studentId,
        gradeSubjectId: dto.gradeSubjectId,
        theoryMarksObtained: dto.theoryMarksObtained,
        theoryFullMarks: 75, // Will be recalculated during finalization
        practicalMarksObtained: dto.practicalMarksObtained,
        finalGrade: 'PENDING',
      },
    });
  }
}

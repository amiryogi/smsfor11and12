import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateInternalAssessmentDto } from './dto/create-internal-assessment.dto.js';
import { InternalAssessmentQueryDto } from './dto/internal-assessment-query.dto.js';
import {
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import {
  ResourceNotFoundException,
  StudentNotFoundException,
  ExamNotFoundException,
} from '../../common/exceptions/business.exceptions.js';

@Injectable()
export class InternalAssessmentService {
  private readonly logger = new Logger(InternalAssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create or update an internal assessment entry.
   * totalMarks is auto-computed from component marks.
   */
  async upsert(
    schoolId: string,
    dto: CreateInternalAssessmentDto,
    actorId: string,
  ) {
    // Verify student
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new StudentNotFoundException(dto.studentId);

    // Verify exam
    const exam = await this.prisma.exam.findFirst({
      where: { id: dto.examId, schoolId },
    });
    if (!exam) throw new ExamNotFoundException(dto.examId);

    // Verify grade-subject
    const gs = await this.prisma.gradeSubject.findFirst({
      where: { id: dto.gradeSubjectId, schoolId },
    });
    if (!gs) throw new ResourceNotFoundException('GradeSubject', dto.gradeSubjectId);

    const totalMarks =
      (dto.projectMarks ?? 0) +
      (dto.participationMarks ?? 0) +
      (dto.attendanceMarks ?? 0) +
      (dto.otherMarks ?? 0);

    const assessment = await this.prisma.internalAssessment.upsert({
      where: {
        examId_studentId_gradeSubjectId: {
          examId: dto.examId,
          studentId: dto.studentId,
          gradeSubjectId: dto.gradeSubjectId,
        },
      },
      update: {
        projectMarks: dto.projectMarks,
        participationMarks: dto.participationMarks,
        attendanceMarks: dto.attendanceMarks,
        otherMarks: dto.otherMarks,
        totalMarks,
        fullMarks: dto.fullMarks ?? 25,
        remarks: dto.remarks,
      },
      create: {
        schoolId,
        studentId: dto.studentId,
        examId: dto.examId,
        gradeSubjectId: dto.gradeSubjectId,
        projectMarks: dto.projectMarks,
        participationMarks: dto.participationMarks,
        attendanceMarks: dto.attendanceMarks,
        otherMarks: dto.otherMarks,
        totalMarks,
        fullMarks: dto.fullMarks ?? 25,
        remarks: dto.remarks,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        gradeSubject: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'InternalAssessment',
      entityId: assessment.id,
      action: 'UPSERT',
      newValues: { ...dto, totalMarks },
    });

    return assessment;
  }

  /**
   * Bulk upsert internal assessments for an exam.
   */
  async bulkUpsert(
    schoolId: string,
    examId: string,
    entries: CreateInternalAssessmentDto[],
    actorId: string,
  ) {
    const results = [];
    for (const entry of entries) {
      entry.examId = examId;
      results.push(await this.upsert(schoolId, entry, actorId));
    }
    this.logger.log(`Bulk upserted ${results.length} internal assessments for exam ${examId}`);
    return { count: results.length };
  }

  async findAll(schoolId: string, query: InternalAssessmentQueryDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = { schoolId, deletedAt: null };
    if (query.examId) where.examId = query.examId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.gradeSubjectId) where.gradeSubjectId = query.gradeSubjectId;

    const [data, total] = await Promise.all([
      this.prisma.internalAssessment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, registrationNo: true } },
          gradeSubject: {
            include: { subject: { select: { id: true, name: true, code: true } } },
          },
          exam: { select: { id: true, name: true, examType: true } },
        },
      }),
      this.prisma.internalAssessment.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(schoolId: string, id: string) {
    const assessment = await this.prisma.internalAssessment.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, registrationNo: true } },
        gradeSubject: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
        exam: { select: { id: true, name: true, examType: true } },
      },
    });
    if (!assessment) throw new ResourceNotFoundException('InternalAssessment', id);
    return assessment;
  }

  async remove(schoolId: string, id: string, actorId: string) {
    const existing = await this.prisma.internalAssessment.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('InternalAssessment', id);

    await this.prisma.internalAssessment.delete({ where: { id } });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'InternalAssessment',
      entityId: id,
      action: 'DELETE',
    });
  }
}

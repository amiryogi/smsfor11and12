import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';
import {
  ExamNotFoundException,
  InvalidExamStatusTransition,
  ExamAlreadyFinalizedException,
} from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import type { ExamStatus } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    academicYearId?: string,
    status?: ExamStatus,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const where: Record<string, unknown> = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { academicYear: true, term: true },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(schoolId: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
      include: { academicYear: true, term: true },
    });
    if (!exam) throw new ExamNotFoundException(examId);
    return exam;
  }

  async create(schoolId: string, dto: CreateExamDto, actorId: string) {
    const exam = await this.prisma.exam.create({
      data: {
        schoolId,
        name: dto.name,
        examType: dto.examType,
        academicYearId: dto.academicYearId,
        termId: dto.termId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: 'DRAFT',
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Exam',
      entityId: exam.id,
      action: 'CREATE',
      newValues: { name: dto.name, examType: dto.examType },
    });

    return exam;
  }

  async update(
    schoolId: string,
    examId: string,
    dto: UpdateExamDto,
    actorId: string,
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
    });
    if (!exam) throw new ExamNotFoundException(examId);
    if (exam.status !== 'DRAFT') throw new ExamAlreadyFinalizedException();

    return this.prisma.exam.update({
      where: { id: examId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async openMarksEntry(schoolId: string, examId: string, actorId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
    });
    if (!exam) throw new ExamNotFoundException(examId);
    if (exam.status !== 'DRAFT') {
      throw new InvalidExamStatusTransition(exam.status, 'MARKS_ENTRY');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: 'MARKS_ENTRY' },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Exam',
      entityId: examId,
      action: 'UPDATE',
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'MARKS_ENTRY' },
    });

    return updated;
  }

  async finalize(schoolId: string, examId: string, actorId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
    });
    if (!exam) throw new ExamNotFoundException(examId);
    if (exam.status !== 'MARKS_ENTRY') {
      throw new InvalidExamStatusTransition(exam.status, 'FINALIZED');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: 'FINALIZED' },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Exam',
      entityId: examId,
      action: 'UPDATE',
      oldValues: { status: 'MARKS_ENTRY' },
      newValues: { status: 'FINALIZED' },
    });

    return updated;
  }

  async publish(schoolId: string, examId: string, actorId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
    });
    if (!exam) throw new ExamNotFoundException(examId);
    if (exam.status !== 'FINALIZED') {
      throw new InvalidExamStatusTransition(exam.status, 'PUBLISHED');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: 'PUBLISHED' },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Exam',
      entityId: examId,
      action: 'UPDATE',
      oldValues: { status: 'FINALIZED' },
      newValues: { status: 'PUBLISHED' },
    });

    return updated;
  }
}

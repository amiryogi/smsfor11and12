import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateExamWeightageDto } from './dto/create-exam-weightage.dto.js';
import { UpdateExamWeightageDto } from './dto/update-exam-weightage.dto.js';
import { ExamWeightageQueryDto } from './dto/exam-weightage-query.dto.js';
import {
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import { ResourceNotFoundException } from '../../common/exceptions/business.exceptions.js';

@Injectable()
export class ExamWeightageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateExamWeightageDto, actorId: string) {
    const weightage = await this.prisma.examWeightage.create({
      data: {
        schoolId,
        examType: dto.examType,
        gradeId: dto.gradeId,
        academicYearId: dto.academicYearId,
        weightPercent: dto.weightPercent,
      },
      include: {
        grade: { select: { id: true, level: true, section: true, stream: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'ExamWeightage',
      entityId: weightage.id,
      action: 'CREATE',
      newValues: dto as any,
    });

    return weightage;
  }

  async findAll(schoolId: string, query: ExamWeightageQueryDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = { schoolId, deletedAt: null };
    if (query.gradeId) where.gradeId = query.gradeId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;

    const [data, total] = await Promise.all([
      this.prisma.examWeightage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          grade: { select: { id: true, level: true, section: true, stream: true } },
          academicYear: { select: { id: true, name: true } },
        },
      }),
      this.prisma.examWeightage.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(schoolId: string, id: string) {
    const weightage = await this.prisma.examWeightage.findFirst({
      where: { id, schoolId },
      include: {
        grade: { select: { id: true, level: true, section: true, stream: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
    if (!weightage) throw new ResourceNotFoundException('ExamWeightage', id);
    return weightage;
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateExamWeightageDto,
    actorId: string,
  ) {
    const existing = await this.prisma.examWeightage.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('ExamWeightage', id);

    const updated = await this.prisma.examWeightage.update({
      where: { id },
      data: { weightPercent: (dto as { weightPercent?: number }).weightPercent },
      include: {
        grade: { select: { id: true, level: true, section: true, stream: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'ExamWeightage',
      entityId: id,
      action: 'UPDATE',
      oldValues: { weightPercent: existing.weightPercent },
      newValues: { weightPercent: (dto as { weightPercent?: number }).weightPercent },
    });

    return updated;
  }

  async remove(schoolId: string, id: string, actorId: string) {
    const existing = await this.prisma.examWeightage.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('ExamWeightage', id);

    await this.prisma.examWeightage.delete({ where: { id } });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'ExamWeightage',
      entityId: id,
      action: 'DELETE',
    });
  }

  /**
   * Get weightage configuration for a grade in an academic year.
   * Used by cumulative result computation.
   */
  async getWeightagesForGrade(
    schoolId: string,
    gradeId: string,
    academicYearId: string,
  ) {
    return this.prisma.examWeightage.findMany({
      where: {
        schoolId,
        gradeId,
        academicYearId,
        deletedAt: null,
      },
      orderBy: { examType: 'asc' },
    });
  }
}

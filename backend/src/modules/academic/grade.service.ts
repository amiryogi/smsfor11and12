import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import {
  AssignGradeSubjectDto,
  UpdateGradeSubjectDto,
} from './dto/assign-grade-subject.dto.js';
import { ResourceNotFoundException } from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import type { Stream } from '@prisma/client';

@Injectable()
export class GradeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    levelFilter?: number,
    streamFilter?: Stream,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'level',
      sortOrder = 'asc',
    } = pagination;
    const where: Record<string, unknown> = { schoolId };
    if (levelFilter) where.level = levelFilter;
    if (streamFilter) where.stream = streamFilter;

    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { gradeSubjects: { include: { subject: true } } },
      }),
      this.prisma.grade.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async create(schoolId: string, dto: CreateGradeDto) {
    return this.prisma.grade.create({
      data: {
        schoolId,
        level: dto.level,
        section: dto.section,
        stream: dto.stream,
        capacity: dto.capacity ?? 60,
      },
    });
  }

  async update(schoolId: string, id: string, dto: UpdateGradeDto) {
    const existing = await this.prisma.grade.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('Grade', id);

    return this.prisma.grade.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    const existing = await this.prisma.grade.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('Grade', id);

    await this.prisma.grade.delete({ where: { id } });
  }

  // --- Grade-Subject assignments ---

  async findGradeSubjects(schoolId: string, gradeId: string) {
    return this.prisma.gradeSubject.findMany({
      where: { schoolId, gradeId },
      include: { subject: true },
    });
  }

  async assignSubject(
    schoolId: string,
    gradeId: string,
    dto: AssignGradeSubjectDto,
  ) {
    return this.prisma.gradeSubject.create({
      data: {
        schoolId,
        gradeId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
      },
      include: { subject: true },
    });
  }

  async updateGradeSubject(
    schoolId: string,
    id: string,
    dto: UpdateGradeSubjectDto,
  ) {
    const existing = await this.prisma.gradeSubject.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('GradeSubject', id);

    return this.prisma.gradeSubject.update({
      where: { id },
      data: { teacherId: dto.teacherId },
      include: { subject: true },
    });
  }

  async removeGradeSubject(schoolId: string, id: string) {
    const existing = await this.prisma.gradeSubject.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('GradeSubject', id);

    await this.prisma.gradeSubject.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto.js';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto.js';
import { CreateTermDto } from './dto/create-term.dto.js';
import { UpdateTermDto } from './dto/update-term.dto.js';
import { ResourceNotFoundException } from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string, pagination: PaginationDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const where = { schoolId };

    const [data, total] = await Promise.all([
      this.prisma.academicYear.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { terms: true },
      }),
      this.prisma.academicYear.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async create(schoolId: string, dto: CreateAcademicYearDto) {
    return this.prisma.academicYear.create({
      data: {
        schoolId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
      },
    });
  }

  async update(schoolId: string, id: string, dto: UpdateAcademicYearDto) {
    const existing = await this.prisma.academicYear.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('AcademicYear', id);

    return this.prisma.academicYear.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async setCurrent(schoolId: string, id: string) {
    const existing = await this.prisma.academicYear.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('AcademicYear', id);

    // Atomically unset all current and set the target
    await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      }),
      this.prisma.academicYear.update({
        where: { id },
        data: { isCurrent: true },
      }),
    ]);

    return { message: `Academic year ${existing.name} set as current` };
  }

  // --- Terms ---

  async findTerms(schoolId: string, yearId: string) {
    return this.prisma.term.findMany({
      where: { schoolId, academicYearId: yearId },
      orderBy: { startDate: 'asc' },
    });
  }

  async createTerm(schoolId: string, yearId: string, dto: CreateTermDto) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id: yearId, schoolId },
    });
    if (!year) throw new ResourceNotFoundException('AcademicYear', yearId);

    return this.prisma.term.create({
      data: {
        schoolId,
        academicYearId: yearId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async updateTerm(schoolId: string, termId: string, dto: UpdateTermDto) {
    const existing = await this.prisma.term.findFirst({
      where: { id: termId, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('Term', termId);

    return this.prisma.term.update({
      where: { id: termId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }
}

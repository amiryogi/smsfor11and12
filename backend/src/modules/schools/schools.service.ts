import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
import { ResourceNotFoundException } from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const [data, total] = await Promise.all([
      this.prisma.school.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.school.count(),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findCurrent(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) throw new ResourceNotFoundException('School', schoolId);
    return school;
  }

  async create(dto: CreateSchoolDto) {
    return this.prisma.school.create({ data: dto });
  }

  async updateCurrent(schoolId: string, dto: UpdateSchoolDto) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) throw new ResourceNotFoundException('School', schoolId);

    return this.prisma.school.update({
      where: { id: schoolId },
      data: dto,
    });
  }
}

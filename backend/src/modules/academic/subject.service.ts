import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';
import { ResourceNotFoundException } from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';

@Injectable()
export class SubjectService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private cacheKey(schoolId: string) {
    return `school:${schoolId}:subjects`;
  }

  async findAll(schoolId: string, pagination: PaginationDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    // Check cache for first page default requests
    if (page === 1 && limit === 20) {
      const cached = await this.cacheManager.get(this.cacheKey(schoolId));
      if (cached) return cached;
    }

    const where = { schoolId };
    const [data, total] = await Promise.all([
      this.prisma.replica.subject.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.replica.subject.count({ where }),
    ]);

    const result = buildPaginatedResponse(data, total, page, limit);

    if (page === 1 && limit === 20) {
      await this.cacheManager.set(this.cacheKey(schoolId), result, 86_400_000);
    }

    return result;
  }

  async create(schoolId: string, dto: CreateSubjectDto) {
    const subject = await this.prisma.subject.create({
      data: { schoolId, ...dto },
    });
    await this.invalidateCache(schoolId);
    return subject;
  }

  async update(schoolId: string, id: string, dto: UpdateSubjectDto) {
    const existing = await this.prisma.subject.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('Subject', id);

    const subject = await this.prisma.subject.update({
      where: { id },
      data: dto,
    });
    await this.invalidateCache(schoolId);
    return subject;
  }

  async remove(schoolId: string, id: string) {
    const existing = await this.prisma.subject.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('Subject', id);

    await this.prisma.subject.delete({ where: { id } });
    await this.invalidateCache(schoolId);
  }

  private async invalidateCache(schoolId: string) {
    await this.cacheManager.del(this.cacheKey(schoolId));
  }
}

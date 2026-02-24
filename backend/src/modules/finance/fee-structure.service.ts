import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto.js';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import { FeeStructureNotFound } from '../../common/exceptions/business.exceptions.js';

@Injectable()
export class FeeStructureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateFeeStructureDto) {
    const feeStructure = await this.prisma.feeStructure.create({
      data: {
        schoolId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        feeType: dto.feeType,
        amount: dto.amount,
        level: dto.level,
        stream: dto.stream,
      },
    });

    await this.audit.log({
      action: 'FEE_STRUCTURE_CREATED',
      entityName: 'FeeStructure',
      entityId: feeStructure.id,
      schoolId,
      newValues: feeStructure,
    });

    return feeStructure;
  }

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    filters: {
      academicYearId?: string;
      feeType?: string;
      level?: number;
      stream?: string;
    },
  ) {
    const where: any = { schoolId };
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.feeType) where.feeType = filters.feeType;
    if (filters.level !== undefined) where.level = filters.level;
    if (filters.stream) where.stream = filters.stream;

    const [data, total] = await Promise.all([
      this.prisma.feeStructure.findMany({
        where,
        include: { academicYear: true },
        skip: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
        take: pagination.limit ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feeStructure.count({ where }),
    ]);

    return buildPaginatedResponse(
      data,
      total,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  async findOne(schoolId: string, id: string) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId },
      include: { academicYear: true },
    });

    if (!feeStructure) throw new FeeStructureNotFound(id);
    return feeStructure;
  }

  async update(schoolId: string, id: string, dto: UpdateFeeStructureDto) {
    const existing = await this.findOne(schoolId, id);

    const updated = await this.prisma.feeStructure.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.feeType && { feeType: dto.feeType }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.stream !== undefined && { stream: dto.stream }),
      },
    });

    await this.audit.log({
      action: 'FEE_STRUCTURE_UPDATED',
      entityName: 'FeeStructure',
      entityId: id,
      schoolId,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);

    await this.prisma.feeStructure.delete({ where: { id } });

    await this.audit.log({
      action: 'FEE_STRUCTURE_DELETED',
      entityName: 'FeeStructure',
      entityId: id,
      schoolId,
    });
  }
}

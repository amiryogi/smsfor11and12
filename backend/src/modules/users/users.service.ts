import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResourceNotFoundException } from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import type { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    roleFilter?: Role,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const where: Record<string, unknown> = { schoolId };
    if (roleFilter) where.role = roleFilter;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(schoolId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        profilePicS3Key: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new ResourceNotFoundException('User', userId);
    return user;
  }

  async create(schoolId: string, dto: CreateUserDto, actorId: string) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        schoolId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'User',
      entityId: user.id,
      action: 'CREATE',
      newValues: { email: dto.email, role: dto.role },
    });

    return user;
  }

  async update(
    schoolId: string,
    userId: string,
    dto: UpdateUserDto,
    actorId: string,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('User', userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'User',
      entityId: userId,
      action: 'UPDATE',
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        role: existing.role,
        isActive: existing.isActive,
      },
      newValues: dto as Record<string, unknown>,
    });

    return user;
  }

  async remove(schoolId: string, userId: string, actorId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('User', userId);

    await this.prisma.user.delete({ where: { id: userId } });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'User',
      entityId: userId,
      action: 'SOFT_DELETE',
    });
  }
}

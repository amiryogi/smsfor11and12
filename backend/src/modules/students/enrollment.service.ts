import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import {
  StudentAlreadyEnrolledException,
  GradeSectionFullException,
  ResourceNotFoundException,
} from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    gradeId?: string,
    academicYearId?: string,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const where: Record<string, unknown> = { schoolId };
    if (gradeId) where.gradeId = gradeId;
    if (academicYearId) where.academicYearId = academicYearId;

    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { student: true, grade: true, academicYear: true },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findByStudent(schoolId: string, studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
      include: { grade: true, academicYear: true },
    });
  }

  async create(schoolId: string, dto: CreateEnrollmentDto, actorId: string) {
    // Check for duplicate enrollment
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        schoolId,
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
      },
    });
    if (existing) throw new StudentAlreadyEnrolledException();

    // Check grade capacity
    const grade = await this.prisma.grade.findFirst({
      where: { id: dto.gradeId, schoolId },
    });
    if (!grade) throw new ResourceNotFoundException('Grade', dto.gradeId);

    const currentCount = await this.prisma.enrollment.count({
      where: {
        schoolId,
        gradeId: dto.gradeId,
        academicYearId: dto.academicYearId,
      },
    });
    if (currentCount >= grade.capacity) {
      throw new GradeSectionFullException(grade.level, grade.section);
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        gradeId: dto.gradeId,
        academicYearId: dto.academicYearId,
        rollNo: dto.rollNo,
      },
      include: { student: true, grade: true, academicYear: true },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Enrollment',
      entityId: enrollment.id,
      action: 'CREATE',
      newValues: {
        studentId: dto.studentId,
        gradeId: dto.gradeId,
        academicYearId: dto.academicYearId,
      },
    });

    return enrollment;
  }
}

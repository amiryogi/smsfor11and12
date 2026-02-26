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

  async bulkPromote(
    schoolId: string,
    dto: {
      fromGradeId: string;
      toGradeId: string;
      fromAcademicYearId: string;
      toAcademicYearId: string;
    },
    actorId: string,
  ) {
    // Find all active enrollments in the current grade/year
    const currentEnrollments = await this.prisma.enrollment.findMany({
      where: {
        schoolId,
        gradeId: dto.fromGradeId,
        academicYearId: dto.fromAcademicYearId,
        student: { status: 'ACTIVE', deletedAt: null },
      },
      include: { student: true },
    });

    // Check target grade capacity
    const targetGrade = await this.prisma.grade.findFirst({
      where: { id: dto.toGradeId, schoolId },
    });
    if (!targetGrade)
      throw new ResourceNotFoundException('Grade', dto.toGradeId);

    const existingInTarget = await this.prisma.enrollment.count({
      where: {
        schoolId,
        gradeId: dto.toGradeId,
        academicYearId: dto.toAcademicYearId,
      },
    });

    if (existingInTarget + currentEnrollments.length > targetGrade.capacity) {
      throw new GradeSectionFullException(
        targetGrade.level,
        targetGrade.section,
      );
    }

    let promoted = 0;
    let skipped = 0;

    for (const enrollment of currentEnrollments) {
      // Skip if already enrolled in target
      const alreadyEnrolled = await this.prisma.enrollment.findFirst({
        where: {
          schoolId,
          studentId: enrollment.studentId,
          academicYearId: dto.toAcademicYearId,
        },
      });

      if (alreadyEnrolled) {
        skipped++;
        continue;
      }

      await this.prisma.enrollment.create({
        data: {
          schoolId,
          studentId: enrollment.studentId,
          gradeId: dto.toGradeId,
          academicYearId: dto.toAcademicYearId,
          rollNo: enrollment.rollNo,
        },
      });
      promoted++;
    }

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Enrollment',
      entityId: 'bulk-promote',
      action: 'BULK_PROMOTE',
      newValues: {
        fromGradeId: dto.fromGradeId,
        toGradeId: dto.toGradeId,
        promoted,
        skipped,
      },
    });

    return {
      message: `Bulk promotion completed. Promoted: ${promoted}, Skipped: ${skipped}`,
      promoted,
      skipped,
      total: currentEnrollments.length,
    };
  }
}

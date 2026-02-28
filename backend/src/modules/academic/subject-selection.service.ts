import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateSubjectSelectionDto } from './dto/create-subject-selection.dto.js';
import { SubjectSelectionQueryDto } from './dto/subject-selection-query.dto.js';
import {
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import {
  StudentNotFoundException,
  ResourceNotFoundException,
} from '../../common/exceptions/business.exceptions.js';

@Injectable()
export class SubjectSelectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Assign multiple grade-subjects (electives) to a student for an academic year.
   * Existing selections are preserved; duplicates are skipped.
   */
  async create(
    schoolId: string,
    dto: CreateSubjectSelectionDto,
    actorId: string,
  ) {
    // Verify student
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new StudentNotFoundException(dto.studentId);

    // Verify all grade-subjects exist and belong to this school
    const gradeSubjects = await this.prisma.gradeSubject.findMany({
      where: { id: { in: dto.gradeSubjectIds }, schoolId },
    });
    if (gradeSubjects.length !== dto.gradeSubjectIds.length) {
      const found = new Set(gradeSubjects.map((gs) => gs.id));
      const missing = dto.gradeSubjectIds.find((id) => !found.has(id));
      throw new ResourceNotFoundException('GradeSubject', missing ?? 'unknown');
    }

    // Create selections, skipping duplicates via skipDuplicates
    const created = await this.prisma.studentSubjectSelection.createMany({
      data: dto.gradeSubjectIds.map((gsId) => ({
        schoolId,
        studentId: dto.studentId,
        gradeSubjectId: gsId,
        academicYearId: dto.academicYearId,
      })),
      skipDuplicates: true,
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'StudentSubjectSelection',
      entityId: dto.studentId,
      action: 'BULK_CREATE',
      newValues: {
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        gradeSubjectIds: dto.gradeSubjectIds,
        createdCount: created.count,
      },
    });

    return { created: created.count };
  }

  /**
   * List selections with pagination and filtering.
   */
  async findAll(schoolId: string, query: SubjectSelectionQueryDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = { schoolId, deletedAt: null };
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.gradeId) {
      where.gradeSubject = { gradeId: query.gradeId };
    }

    const [data, total] = await Promise.all([
      this.prisma.studentSubjectSelection.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, registrationNo: true },
          },
          gradeSubject: {
            include: {
              subject: { select: { id: true, name: true, code: true, creditHours: true } },
              grade: { select: { id: true, level: true, section: true, stream: true } },
            },
          },
          academicYear: { select: { id: true, name: true } },
        },
      }),
      this.prisma.studentSubjectSelection.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  /**
   * Get a student's selected subjects for a given academic year.
   */
  async findByStudent(
    schoolId: string,
    studentId: string,
    academicYearId?: string,
  ) {
    const where: Record<string, unknown> = { schoolId, studentId, deletedAt: null };
    if (academicYearId) where.academicYearId = academicYearId;

    return this.prisma.studentSubjectSelection.findMany({
      where,
      include: {
        gradeSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true, creditHours: true, isOptional: true } as any },
            grade: { select: { id: true, level: true, section: true, stream: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Remove a specific selection.
   */
  async remove(schoolId: string, id: string, actorId: string) {
    const existing = await this.prisma.studentSubjectSelection.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new ResourceNotFoundException('StudentSubjectSelection', id);

    await this.prisma.studentSubjectSelection.delete({ where: { id } });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'StudentSubjectSelection',
      entityId: id,
      action: 'DELETE',
    });
  }
}

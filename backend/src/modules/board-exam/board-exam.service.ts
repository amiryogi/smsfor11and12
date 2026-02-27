import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateBoardExamRegistrationDto } from './dto/create-board-exam-registration.dto.js';
import { UpdateBoardExamRegistrationDto } from './dto/update-board-exam-registration.dto.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import {
  DuplicateSymbolNoException,
  BoardExamRegistrationNotFoundException,
  StudentNotFoundException,
} from '../../common/exceptions/business.exceptions.js';

@Injectable()
export class BoardExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    schoolId: string,
    dto: CreateBoardExamRegistrationDto,
    actorId: string,
  ) {
    // Verify student exists
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new StudentNotFoundException(dto.studentId);

    // Check for duplicate symbol number in the same academic year
    const existing = await this.prisma.boardExamRegistration.findFirst({
      where: {
        schoolId,
        symbolNo: dto.symbolNo,
        academicYearId: dto.academicYearId,
      },
    });
    if (existing) {
      throw new DuplicateSymbolNoException(dto.symbolNo, dto.academicYearId);
    }

    const registration = await this.prisma.boardExamRegistration.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        symbolNo: dto.symbolNo,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, registrationNo: true },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'BoardExamRegistration',
      entityId: registration.id,
      action: 'CREATE',
      newValues: {
        studentId: dto.studentId,
        symbolNo: dto.symbolNo,
        academicYearId: dto.academicYearId,
      },
    });

    return registration;
  }

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    academicYearId?: string,
    studentId?: string,
    search?: string,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const where: Record<string, unknown> = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (studentId) where.studentId = studentId;
    if (search) {
      where.OR = [
        { symbolNo: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.boardExamRegistration.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, registrationNo: true },
          },
          academicYear: { select: { id: true, name: true } },
        },
      }),
      this.prisma.boardExamRegistration.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(schoolId: string, id: string) {
    const registration = await this.prisma.boardExamRegistration.findFirst({
      where: { id, schoolId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, registrationNo: true },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });
    if (!registration) throw new BoardExamRegistrationNotFoundException(id);
    return registration;
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateBoardExamRegistrationDto,
    actorId: string,
  ) {
    const existing = await this.prisma.boardExamRegistration.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new BoardExamRegistrationNotFoundException(id);

    // If changing symbol number, check for duplicates
    if (dto.symbolNo && dto.symbolNo !== existing.symbolNo) {
      const duplicate = await this.prisma.boardExamRegistration.findFirst({
        where: {
          schoolId,
          symbolNo: dto.symbolNo,
          academicYearId: existing.academicYearId,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new DuplicateSymbolNoException(dto.symbolNo, existing.academicYearId);
      }
    }

    const registration = await this.prisma.boardExamRegistration.update({
      where: { id },
      data: { symbolNo: dto.symbolNo },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, registrationNo: true },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'BoardExamRegistration',
      entityId: id,
      action: 'UPDATE',
      oldValues: { symbolNo: existing.symbolNo },
      newValues: { symbolNo: dto.symbolNo },
    });

    return registration;
  }

  async remove(schoolId: string, id: string, actorId: string) {
    const existing = await this.prisma.boardExamRegistration.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new BoardExamRegistrationNotFoundException(id);

    await this.prisma.boardExamRegistration.delete({ where: { id } });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'BoardExamRegistration',
      entityId: id,
      action: 'SOFT_DELETE',
    });
  }

  /**
   * Find board exam registration for a specific student in an academic year.
   */
  async findByStudentAndYear(
    schoolId: string,
    studentId: string,
    academicYearId: string,
  ) {
    return this.prisma.boardExamRegistration.findFirst({
      where: { schoolId, studentId, academicYearId },
      include: {
        academicYear: { select: { id: true, name: true } },
      },
    });
  }
}

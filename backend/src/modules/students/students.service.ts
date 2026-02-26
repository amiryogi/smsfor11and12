import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { StorageService } from '../../core/storage/storage.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { LinkParentDto } from './dto/link-parent.dto.js';
import {
  StudentNotFoundException,
  DuplicateRegistrationException,
  ResourceNotFoundException,
} from '../../common/exceptions/business.exceptions.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import type { StudentStatus } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storage: StorageService,
  ) {}

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    statusFilter?: StudentStatus,
    gradeId?: string,
    search?: string,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const where: Record<string, unknown> = { schoolId };
    if (statusFilter) where.status = statusFilter;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { registrationNo: { contains: search } },
      ];
    }

    // If gradeId filter, join through enrollments
    if (gradeId) {
      where.enrollments = { some: { gradeId } };
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          enrollments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { grade: true, academicYear: true },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(schoolId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        enrollments: {
          orderBy: { createdAt: 'desc' },
          include: { grade: true, academicYear: true },
        },
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
    if (!student) throw new StudentNotFoundException(studentId);
    return student;
  }

  async create(schoolId: string, dto: CreateStudentDto, actorId: string) {
    // Check for duplicate registration number
    const existing = await this.prisma.student.findFirst({
      where: { schoolId, registrationNo: dto.registrationNo },
    });
    if (existing) throw new DuplicateRegistrationException(dto.registrationNo);

    const student = await this.prisma.student.create({
      data: {
        schoolId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        registrationNo: dto.registrationNo,
        symbolNo: dto.symbolNo,
        dob: new Date(dto.dob),
        gender: dto.gender,
        phone: dto.phone,
        address: dto.address,
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Student',
      entityId: student.id,
      action: 'CREATE',
      newValues: {
        registrationNo: dto.registrationNo,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return student;
  }

  async update(
    schoolId: string,
    studentId: string,
    dto: UpdateStudentDto,
    actorId: string,
  ) {
    const existing = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!existing) throw new StudentNotFoundException(studentId);

    const student = await this.prisma.student.update({
      where: { id: studentId },
      data: {
        ...dto,
        dob: dto.dob ? new Date(dto.dob) : undefined,
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Student',
      entityId: studentId,
      action: 'UPDATE',
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        status: existing.status,
      },
      newValues: dto as Record<string, unknown>,
    });

    return student;
  }

  async remove(schoolId: string, studentId: string, actorId: string) {
    const existing = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!existing) throw new StudentNotFoundException(studentId);

    await this.prisma.student.delete({ where: { id: studentId } });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Student',
      entityId: studentId,
      action: 'SOFT_DELETE',
    });
  }

  // --- Parent linking ---

  async linkParent(schoolId: string, studentId: string, dto: LinkParentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student) throw new StudentNotFoundException(studentId);

    return this.prisma.studentParent.create({
      data: {
        schoolId,
        studentId,
        parentId: dto.parentId,
        relationship: dto.relationship,
      },
      include: {
        parent: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findParents(schoolId: string, studentId: string) {
    return this.prisma.studentParent.findMany({
      where: { schoolId, studentId },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async unlinkParent(schoolId: string, studentId: string, parentId: string) {
    const link = await this.prisma.studentParent.findFirst({
      where: { schoolId, studentId, parentId },
    });
    if (!link)
      throw new ResourceNotFoundException(
        'StudentParent',
        `${studentId}-${parentId}`,
      );

    await this.prisma.studentParent.delete({ where: { id: link.id } });
  }

  // --- Photo upload ---

  async uploadPhoto(
    schoolId: string,
    studentId: string,
    file: Express.Multer.File,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student) throw new StudentNotFoundException(studentId);

    const { s3Key, size } = await this.storage.uploadBuffer(
      file.buffer,
      `students/${schoolId}/photos`,
      file.mimetype,
    );

    // Save file asset record
    const fileAsset = await this.prisma.fileAsset.create({
      data: {
        schoolId,
        s3Key,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: size,
        context: 'PROFILE_PIC',
      },
    });

    // Update student photo reference
    await this.prisma.student.update({
      where: { id: studentId },
      data: { profilePicS3Key: s3Key },
    });

    return { fileAssetId: fileAsset.id, s3Key };
  }
}

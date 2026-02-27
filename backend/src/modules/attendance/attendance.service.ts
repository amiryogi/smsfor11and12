import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { TakeAttendanceDto } from './dto/take-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import {
  AttendanceAlreadyTakenException,
  AttendanceNotFoundException,
} from '../../common/exceptions/business.exceptions.js';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Record bulk attendance for a grade on a specific date.
   */
  async takeAttendance(
    schoolId: string,
    dto: TakeAttendanceDto,
    actorId: string,
  ) {
    const dateOnly = new Date(dto.date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    // Check for duplicate attendance on the same date for the same grade
    const existing = await this.prisma.attendance.findFirst({
      where: {
        schoolId,
        gradeId: dto.gradeId,
        date: dateOnly,
      },
    });
    if (existing) {
      throw new AttendanceAlreadyTakenException(dto.gradeId, dto.date);
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        schoolId,
        gradeId: dto.gradeId,
        academicYearId: dto.academicYearId,
        date: dateOnly,
        takenBy: actorId,
        records: {
          create: dto.records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            remarks: r.remarks,
          })),
        },
      },
      include: {
        records: {
          include: { student: { select: { id: true, firstName: true, lastName: true } } },
        },
        grade: true,
      },
    });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Attendance',
      entityId: attendance.id,
      action: 'CREATE',
      newValues: {
        gradeId: dto.gradeId,
        date: dto.date,
        studentCount: dto.records.length,
      },
    });

    return attendance;
  }

  /**
   * Update attendance records for an existing attendance session.
   */
  async updateAttendance(
    schoolId: string,
    attendanceId: string,
    dto: UpdateAttendanceDto,
    actorId: string,
  ) {
    const existing = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, schoolId },
      include: { records: true },
    });
    if (!existing) throw new AttendanceNotFoundException(attendanceId);

    // Upsert each record
    const operations = dto.records.map((r) =>
      this.prisma.attendanceRecord.upsert({
        where: {
          attendanceId_studentId: {
            attendanceId,
            studentId: r.studentId,
          },
        },
        create: {
          attendanceId,
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks,
        },
        update: {
          status: r.status,
          remarks: r.remarks,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Attendance',
      entityId: attendanceId,
      action: 'UPDATE',
      newValues: { updatedRecords: dto.records.length },
    });

    return this.findOne(schoolId, attendanceId);
  }

  /**
   * Find all attendance sessions for a school with filters.
   */
  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    gradeId?: string,
    academicYearId?: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = pagination;

    const where: Record<string, unknown> = { schoolId };
    if (gradeId) where.gradeId = gradeId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.date = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          grade: true,
          _count: { select: { records: true } },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  /**
   * Get a single attendance with all student records.
   */
  async findOne(schoolId: string, attendanceId: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, schoolId },
      include: {
        grade: true,
        academicYear: true,
        records: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, registrationNo: true },
            },
          },
          orderBy: { student: { firstName: 'asc' } },
        },
      },
    });
    if (!attendance) throw new AttendanceNotFoundException(attendanceId);
    return attendance;
  }

  /**
   * Get attendance summary for a student within a date range.
   */
  async getStudentAttendanceSummary(
    schoolId: string,
    studentId: string,
    academicYearId?: string,
  ) {
    const where: Record<string, unknown> = { studentId };
    if (academicYearId) {
      where.attendance = { schoolId, academicYearId };
    } else {
      where.attendance = { schoolId };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: { attendance: { select: { date: true, gradeId: true } } },
    });

    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      leave: records.filter((r) => r.status === 'LEAVE').length,
      attendancePercentage: 0,
    };

    if (summary.total > 0) {
      summary.attendancePercentage = Number(
        (((summary.present + summary.late) / summary.total) * 100).toFixed(2),
      );
    }

    return summary;
  }

  /**
   * Delete an attendance session and all its records.
   */
  async remove(schoolId: string, attendanceId: string, actorId: string) {
    const existing = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, schoolId },
    });
    if (!existing) throw new AttendanceNotFoundException(attendanceId);

    await this.prisma.attendance.delete({ where: { id: attendanceId } });

    await this.auditService.log({
      schoolId,
      userId: actorId,
      entityName: 'Attendance',
      entityId: attendanceId,
      action: 'SOFT_DELETE',
    });
  }
}

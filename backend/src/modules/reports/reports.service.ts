import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { StorageService } from '../../core/storage/storage.service.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import { Prisma } from '@prisma/client';

export interface PdfJobData {
  type: 'marksheet' | 'grade-sheet' | 'ledger';
  schoolId: string;
  userId: string;
  studentId?: string;
  examId?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectQueue('pdf-generation') private readonly pdfQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async queueMarksheet(
    schoolId: string,
    studentId: string,
    examId: string,
    userId: string,
  ) {
    const job = await this.pdfQueue.add(
      'generate-pdf',
      {
        type: 'marksheet',
        schoolId,
        studentId,
        examId,
        userId,
      } satisfies PdfJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Queued marksheet generation job ${job.id} for student ${studentId}`,
    );
    return {
      jobId: job.id,
      message: 'Marksheet generation queued. You will be notified when ready.',
    };
  }

  async queueGradeSheet(schoolId: string, examId: string, userId: string) {
    const job = await this.pdfQueue.add(
      'generate-pdf',
      {
        type: 'grade-sheet',
        schoolId,
        examId,
        userId,
      } satisfies PdfJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Queued grade-sheet generation job ${job.id} for exam ${examId}`,
    );
    return {
      jobId: job.id,
      message:
        'Grade sheet generation queued. You will be notified when ready.',
    };
  }

  async queueLedger(schoolId: string, studentId: string, userId: string) {
    const job = await this.pdfQueue.add(
      'generate-pdf',
      {
        type: 'ledger',
        schoolId,
        studentId,
        userId,
      } satisfies PdfJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Queued ledger generation job ${job.id} for student ${studentId}`,
    );
    return {
      jobId: job.id,
      message: 'Ledger generation queued. You will be notified when ready.',
    };
  }

  async listReportFiles(schoolId: string, pagination: PaginationDto) {
    const where = { schoolId, context: 'Report' };

    const [data, total] = await Promise.all([
      this.prisma.replica.fileAsset.findMany({
        where,
        skip: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
        take: pagination.limit ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.replica.fileAsset.count({ where }),
    ]);

    return buildPaginatedResponse(
      data,
      total,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  async getDownloadUrl(schoolId: string, fileId: string) {
    const file = await this.prisma.fileAsset.findFirst({
      where: { id: fileId, schoolId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    const url = await this.storage.getPresignedUrl(file.s3Key, 3600);
    return { url, fileName: file.fileName, mimeType: file.mimeType };
  }

  async studentSummary(schoolId: string) {
    const [statusCounts, byGrade] = await Promise.all([
      this.prisma.replica.student.groupBy({
        by: ['status'],
        where: { schoolId, deletedAt: null },
        _count: { status: true },
      }),
      this.prisma.replica.$queryRaw<
        { gradeId: string; gradeName: string; count: bigint }[]
      >`
        SELECT e.gradeId,
               CONCAT('Grade ', g.level, ' - ', g.section, ' (', g.stream, ')') AS gradeName,
               COUNT(DISTINCT e.studentId) AS count
        FROM Enrollment e
        JOIN Grade g ON g.id = e.gradeId
        JOIN Student s ON s.id = e.studentId
        WHERE e.schoolId = ${schoolId}
          AND s.deletedAt IS NULL
          AND s.status = 'ACTIVE'
          AND e.deletedAt IS NULL
        GROUP BY e.gradeId, g.level, g.section, g.stream
        ORDER BY g.level, g.section
      `,
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = row._count.status;
    }

    return {
      totalActive: statusMap['ACTIVE'] ?? 0,
      totalGraduated: statusMap['GRADUATED'] ?? 0,
      totalDropout: statusMap['DROPOUT'] ?? 0,
      totalTransferred: statusMap['TRANSFERRED'] ?? 0,
      byGrade: byGrade.map((g) => ({
        gradeId: g.gradeId,
        gradeName: g.gradeName,
        count: Number(g.count),
      })),
    };
  }

  // --- New spec-required methods ---

  async getGradeResults(schoolId: string, examId: string, gradeId: string) {
    const results = await this.prisma.replica.examResult.findMany({
      where: {
        schoolId,
        examId,
        student: {
          enrollments: { some: { gradeId } },
        },
      },
      include: {
        student: true,
        gradeSubject: { include: { subject: true } },
      },
    });

    // Group by student
    const studentMap = new Map<
      string,
      { student: any; subjects: any[]; total: number }
    >();
    for (const r of results) {
      const sid = r.studentId;
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          student: r.student,
          subjects: [],
          total: 0,
        });
      }
      const entry = studentMap.get(sid)!;
      entry.subjects.push({
        gradeSubjectId: r.gradeSubjectId,
        subjectName: r.gradeSubject.subject.name,
        theoryMarksObtained: r.theoryMarksObtained,
        practicalMarksObtained: r.practicalMarksObtained,
        finalGrade: r.finalGrade,
        finalGradePoint: r.finalGradePoint,
      });
      entry.total +=
        Number(r.theoryMarksObtained ?? 0) +
        Number(r.practicalMarksObtained ?? 0);
    }

    const ranked = [...studentMap.values()]
      .sort((a, b) => b.total - a.total)
      .map((entry, i) => ({
        rank: i + 1,
        ...entry,
      }));

    return { examId, gradeId, results: ranked };
  }

  async queueBulkMarksheets(schoolId: string, examId: string, userId: string) {
    const job = await this.pdfQueue.add(
      'generate-pdf',
      {
        type: 'marksheet',
        schoolId,
        examId,
        userId,
        bulk: true,
      } as PdfJobData & { bulk: boolean },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    );

    this.logger.log(`Queued bulk marksheets job ${job.id} for exam ${examId}`);
    return {
      jobId: job.id,
      message:
        'Bulk marksheet generation queued. You will be notified when ready.',
    };
  }

  async getFinancialLedger(
    schoolId: string,
    pagination: PaginationDto,
    startDate?: string,
    endDate?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const where: Prisma.PaymentWhereInput = {
      schoolId,
      status: 'COMPLETED',
    };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as any).gte = new Date(startDate);
      if (endDate) (where.createdAt as any).lte = new Date(endDate);
    }

    const [payments, total, aggregation] = await Promise.all([
      this.prisma.replica.payment.findMany({
        where,
        include: { invoice: { include: { student: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.replica.payment.count({ where }),
      this.prisma.replica.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      ...buildPaginatedResponse(payments, total, page, limit),
      totalCollected: aggregation._sum.amount ?? 0,
    };
  }

  async getStudentFinancialStatement(schoolId: string, studentId: string) {
    const student = await this.prisma.replica.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student) throw new NotFoundException(`Student ${studentId} not found`);

    const [invoices, payments] = await Promise.all([
      this.prisma.replica.invoice.findMany({
        where: { schoolId, studentId },
        include: { lineItems: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.replica.payment.findMany({
        where: { schoolId, invoice: { studentId } },
        include: { invoice: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum.add(inv.totalAmount),
      new Prisma.Decimal(0),
    );
    const totalPaid = payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));

    return {
      student,
      invoices,
      payments,
      totalInvoiced,
      totalPaid,
      outstandingBalance: totalInvoiced.sub(totalPaid),
    };
  }

  async getOutstandingBalances(schoolId: string, pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    // Use raw query for efficiency on the replica
    const outstanding = await this.prisma.replica.$queryRaw<
      {
        studentId: string;
        firstName: string;
        lastName: string;
        registrationNo: string;
        totalInvoiced: number;
        totalPaid: number;
        outstanding: number;
      }[]
    >`
      SELECT
        s.id AS studentId,
        s.firstName,
        s.lastName,
        s.registrationNo,
        COALESCE(SUM(i.totalAmount), 0) AS totalInvoiced,
        COALESCE(SUM(i.paidAmount), 0) AS totalPaid,
        COALESCE(SUM(i.totalAmount), 0) - COALESCE(SUM(i.paidAmount), 0) AS outstanding
      FROM Student s
      JOIN Invoice i ON i.studentId = s.id AND i.schoolId = s.schoolId
      WHERE s.schoolId = ${schoolId}
        AND s.deletedAt IS NULL
        AND i.status NOT IN ('CANCELLED')
        AND i.deletedAt IS NULL
      GROUP BY s.id, s.firstName, s.lastName, s.registrationNo
      HAVING outstanding > 0
      ORDER BY outstanding DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;

    // Total count
    const countResult = await this.prisma.replica.$queryRaw<
      { total: bigint }[]
    >`
      SELECT COUNT(*) AS total FROM (
        SELECT s.id
        FROM Student s
        JOIN Invoice i ON i.studentId = s.id AND i.schoolId = s.schoolId
        WHERE s.schoolId = ${schoolId}
          AND s.deletedAt IS NULL
          AND i.status NOT IN ('CANCELLED')
          AND i.deletedAt IS NULL
        GROUP BY s.id
        HAVING SUM(i.totalAmount) - SUM(i.paidAmount) > 0
      ) sub
    `;

    return buildPaginatedResponse(
      outstanding,
      Number(countResult[0]?.total ?? 0),
      page,
      limit,
    );
  }
}

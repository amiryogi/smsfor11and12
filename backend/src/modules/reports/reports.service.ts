import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { StorageService } from '../../core/storage/storage.service.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';

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
}

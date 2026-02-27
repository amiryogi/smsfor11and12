import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService, type SendMailOptions } from '../../core/email/email.service.js';

export interface EmailJobData extends SendMailOptions {
  /** Optional metadata for logging */
  context?: string;
}

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, html, text, context } = job.data;
    this.logger.log(
      `Processing email job ${job.id}: ${subject} → ${to} (${context ?? 'general'})`,
    );

    await this.emailService.send({ to, subject, html, text });
  }
}

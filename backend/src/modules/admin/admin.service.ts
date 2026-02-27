import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/** Centralised dead-letter / failed-job administration. */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly queues: Map<string, Queue>;

  constructor(
    @InjectQueue('pdf-generation') private readonly pdfQueue: Queue,
    @InjectQueue('pdf-generation-dlq') private readonly pdfDlqQueue: Queue,
  ) {
    this.queues = new Map<string, Queue>([
      ['pdf-generation', this.pdfQueue],
      ['pdf-generation-dlq', this.pdfDlqQueue],
    ]);
  }

  /**
   * List failed jobs across all registered queues (or a specific one).
   */
  async listFailedJobs(
    queueName?: string,
    start = 0,
    limit = 50,
  ): Promise<FailedJobSummary[]> {
    const targets = queueName
      ? [[queueName, this.getQueue(queueName)] as const]
      : [...this.queues.entries()];

    const results: FailedJobSummary[] = [];

    for (const [name, queue] of targets) {
      const failed = await queue.getFailed(start, start + limit - 1);
      for (const job of failed) {
        results.push({
          queueName: name,
          jobId: job.id!,
          jobName: job.name,
          data: job.data,
          failedReason: job.failedReason ?? 'unknown',
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
          finishedOn: job.finishedOn ?? null,
        });
      }
    }

    return results;
  }

  /**
   * Retry a single failed job by id. Moves it back to the wait state.
   */
  async retryJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(
        `Job ${jobId} not found in queue ${queueName}`,
      );
    }

    await job.retry();
    this.logger.log(`Retried job ${jobId} in queue ${queueName}`);
  }

  /**
   * Remove a failed job permanently.
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(
        `Job ${jobId} not found in queue ${queueName}`,
      );
    }

    await job.remove();
    this.logger.log(`Removed job ${jobId} from queue ${queueName}`);
  }

  /**
   * Get queue statistics (counts by state).
   */
  async getQueueStats(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];

    for (const [name, queue] of this.queues.entries()) {
      const counts = await queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
      );
      stats.push({
        queueName: name,
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      });
    }

    return stats;
  }

  // ── helpers ────────────────────────────────────────────
  private getQueue(name: string): Queue {
    const q = this.queues.get(name);
    if (!q) {
      throw new NotFoundException(`Queue "${name}" not registered`);
    }
    return q;
  }
}

// ── DTOs returned by the service ─────────────────────────
export interface FailedJobSummary {
  queueName: string;
  jobId: string;
  jobName: string;
  data: unknown;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  finishedOn: number | null;
}

export interface QueueStats {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

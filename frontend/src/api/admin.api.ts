import { apiClient } from "./client";
import type { ApiResponse } from "../types/api.types";

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface FailedJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  finishedOn: number;
  queueName: string;
}

export const adminApi = {
  getQueueStats: () =>
    apiClient
      .get<ApiResponse<QueueStats[]>>("/admin/queue-stats")
      .then((r) => r.data),

  listFailedJobs: (params?: {
    queue?: string;
    start?: number;
    limit?: number;
  }) =>
    apiClient
      .get<ApiResponse<FailedJob[]>>("/admin/failed-jobs", { params })
      .then((r) => r.data),

  retryJob: (queue: string, jobId: string) =>
    apiClient
      .post<ApiResponse<{ message: string }>>(
        `/admin/failed-jobs/${queue}/${jobId}/retry`,
      )
      .then((r) => r.data),

  removeJob: (queue: string, jobId: string) =>
    apiClient
      .delete<ApiResponse<{ message: string }>>(
        `/admin/failed-jobs/${queue}/${jobId}`,
      )
      .then((r) => r.data),
};

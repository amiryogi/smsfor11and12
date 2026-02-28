import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/admin.api";
import type { QueueStats, FailedJob } from "../../api/admin.api";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { StatCard } from "../../components/ui/StatCard";
import { toast } from "sonner";

export function DlqDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedQueue, setSelectedQueue] = useState<string | undefined>();
  const [confirmAction, setConfirmAction] = useState<{
    type: "retry" | "remove";
    queue: string;
    jobId: string;
  } | null>(null);

  const statsQuery = useQuery({
    queryKey: ["admin", "queue-stats"],
    queryFn: () => adminApi.getQueueStats(),
    refetchInterval: 15_000,
  });

  const failedQuery = useQuery({
    queryKey: ["admin", "failed-jobs", selectedQueue],
    queryFn: () =>
      adminApi.listFailedJobs({
        queue: selectedQueue,
        start: 0,
        limit: 100,
      }),
  });

  const retryMutation = useMutation({
    mutationFn: ({ queue, jobId }: { queue: string; jobId: string }) =>
      adminApi.retryJob(queue, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Job retried");
    },
    onError: () => toast.error("Failed to retry job"),
  });

  const removeMutation = useMutation({
    mutationFn: ({ queue, jobId }: { queue: string; jobId: string }) =>
      adminApi.removeJob(queue, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Job removed");
    },
    onError: () => toast.error("Failed to remove job"),
  });

  const stats: QueueStats[] = statsQuery.data?.data ?? [];
  const failedJobs: FailedJob[] = failedQuery.data?.data ?? [];

  if (statsQuery.isLoading) return <LoadingSpinner />;
  if (statsQuery.isError)
    return (
      <ErrorState
        message="Failed to load queue stats"
        onRetry={() => statsQuery.refetch()}
      />
    );

  return (
    <div>
      <PageHeader
        title="Queue Dashboard"
        description="Monitor and manage background job queues (DLQ)"
      />

      {/* Queue Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((q) => (
          <button
            key={q.name}
            onClick={() =>
              setSelectedQueue((prev) =>
                prev === q.name ? undefined : q.name,
              )
            }
            className={`text-left transition-shadow ${
              selectedQueue === q.name ? "ring-2 ring-primary-500" : ""
            }`}
          >
            <StatCard
              title={q.name}
              value={`${q.failed} failed`}
              trend={{
                value: `${q.waiting} waiting · ${q.active} active · ${q.completed} done`,
                positive: q.failed === 0,
              }}
            />
          </button>
        ))}
      </div>

      {/* Failed Jobs Table */}
      <div className="card">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Failed Jobs {selectedQueue ? `(${selectedQueue})` : "(All Queues)"}
        </h3>

        {failedQuery.isLoading ? (
          <LoadingSpinner />
        ) : failedJobs.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No failed jobs found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Queue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Job
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Attempts
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Failed At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {failedJobs.map((job) => (
                  <tr key={`${job.queueName}-${job.id}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-700">
                      {job.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {job.queueName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {job.name}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-red-600" title={job.failedReason}>
                      {job.failedReason}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {job.attemptsMade}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {job.finishedOn
                        ? new Date(job.finishedOn).toLocaleString()
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                          onClick={() =>
                            setConfirmAction({
                              type: "retry",
                              queue: job.queueName,
                              jobId: job.id,
                            })
                          }
                        >
                          Retry
                        </button>
                        <button
                          className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                          onClick={() =>
                            setConfirmAction({
                              type: "remove",
                              queue: job.queueName,
                              jobId: job.id,
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.type === "retry" ? "Retry Job" : "Remove Job"
        }
        message={
          confirmAction?.type === "retry"
            ? "Are you sure you want to retry this failed job?"
            : "Are you sure you want to permanently remove this job?"
        }
        variant={confirmAction?.type === "remove" ? "danger" : "primary"}
        confirmLabel={confirmAction?.type === "retry" ? "Retry" : "Remove"}
        onConfirm={() => {
          if (!confirmAction) return;
          const { type, queue, jobId } = confirmAction;
          if (type === "retry") {
            retryMutation.mutate({ queue, jobId });
          } else {
            removeMutation.mutate({ queue, jobId });
          }
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

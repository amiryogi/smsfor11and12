import { useParams, Link } from "react-router-dom";
import {
  useExam,
  useOpenMarksEntry,
  useFinalizeExam,
  usePublishExam,
} from "../../hooks/useExams";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatDate } from "../../utils/format-date";
import { useAuthStore } from "../../stores/auth.store";

export function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useExam(id!);
  const openMarks = useOpenMarksEntry(id!);
  const finalize = useFinalizeExam(id!);
  const publish = usePublishExam(id!);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorState message="Failed to load exam" />;

  const exam = data.data;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div>
      <PageHeader
        title={exam.name}
        action={
          <div className="flex gap-2">
            {exam.status === "MARKS_ENTRY" && (
              <Link to={`/exams/${id}/marks-entry`} className="btn-primary">
                Enter Marks
              </Link>
            )}
            <Link to={`/exams/${id}/results`} className="btn-secondary">
              View Results
            </Link>
          </div>
        }
      />
      <div className="card max-w-2xl">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd>
              <StatusBadge status={exam.status} />
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Type</dt>
            <dd className="font-medium text-gray-900">
              {exam.examType.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Start Date</dt>
            <dd className="font-medium text-gray-900">
              {formatDate(exam.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">End Date</dt>
            <dd className="font-medium text-gray-900">
              {formatDate(exam.endDate)}
            </dd>
          </div>
        </dl>
        {isAdmin && (
          <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
            {exam.status === "DRAFT" && (
              <button
                onClick={() => openMarks.mutate()}
                disabled={openMarks.isPending}
                className="btn-primary"
              >
                {openMarks.isPending ? "Opening..." : "Open Marks Entry"}
              </button>
            )}
            {exam.status === "MARKS_ENTRY" && (
              <button
                onClick={() => finalize.mutate()}
                disabled={finalize.isPending}
                className="btn-primary"
              >
                {finalize.isPending ? "Finalizing..." : "Finalize"}
              </button>
            )}
            {exam.status === "FINALIZED" && (
              <button
                onClick={() => publish.mutate()}
                disabled={publish.isPending}
                className="btn-primary"
              >
                {publish.isPending ? "Publishing..." : "Publish Results"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

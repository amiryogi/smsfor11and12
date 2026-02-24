import { useState } from "react";
import { useParams } from "react-router-dom";
import { useExam, useExamResults } from "../../hooks/useExams";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import type { ExamResult } from "../../types/exam.types";

const columns = [
  {
    key: "student",
    header: "Student",
    render: (r: ExamResult) =>
      r.student
        ? `${r.student.firstName} ${r.student.lastName}`
        : r.studentId.slice(0, 8),
  },
  {
    key: "subject",
    header: "Subject",
    render: (r: ExamResult) => r.gradeSubject?.subject?.name ?? "-",
  },
  { key: "theoryMarksObtained", header: "Theory" },
  { key: "practicalMarksObtained", header: "Practical" },
  { key: "finalGrade", header: "Grade" },
  {
    key: "isNg",
    header: "Status",
    render: (r: ExamResult) => <StatusBadge status={r.isNg ? "NG" : "PASS"} />,
  },
];

export function ExamResultsPage() {
  const { id: examId } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const { data: exam } = useExam(examId!);
  const { data, isLoading, isError, refetch } = useExamResults(examId!, {
    page,
    limit: 50,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load results" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader title={`Results - ${exam?.data?.name ?? "Exam"}`} />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pagination={data?.meta}
        onPageChange={setPage}
      />
    </div>
  );
}

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useExam, useExamResults, useExamSummaries } from "../../hooks/useExams";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import type { ExamResult, StudentExamSummary } from "../../types/exam.types";

const CLASSIFICATION_COLORS: Record<string, string> = {
  DISTINCTION: "text-yellow-600 bg-yellow-50",
  FIRST_DIVISION: "text-green-700 bg-green-50",
  SECOND_DIVISION: "text-blue-700 bg-blue-50",
  THIRD_DIVISION: "text-gray-700 bg-gray-50",
  FAIL: "text-red-700 bg-red-50",
};

const resultColumns = [
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
    key: "finalGradePoint",
    header: "GP",
    render: (r: ExamResult) => r.finalGradePoint ?? "-",
  },
  {
    key: "isNg",
    header: "Status",
    render: (r: ExamResult) => <StatusBadge status={r.isNg ? "NG" : "PASS"} />,
  },
];

const summaryColumns = [
  {
    key: "rank",
    header: "Rank",
    render: (s: StudentExamSummary) => s.rank ?? "-",
  },
  {
    key: "student",
    header: "Student",
    render: (s: StudentExamSummary) =>
      s.student
        ? `${s.student.firstName} ${s.student.lastName}`
        : s.studentId.slice(0, 8),
  },
  {
    key: "gpa",
    header: "GPA",
    render: (s: StudentExamSummary) => Number(s.gpa).toFixed(2),
  },
  {
    key: "totalCreditHours",
    header: "Credit Hrs",
  },
  {
    key: "classification",
    header: "Classification",
    render: (s: StudentExamSummary) => (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${CLASSIFICATION_COLORS[s.classification] ?? ""}`}
      >
        {s.classification.replace(/_/g, " ")}
      </span>
    ),
  },
  {
    key: "hasNg",
    header: "Status",
    render: (s: StudentExamSummary) => (
      <StatusBadge status={s.hasNg ? "NG" : "PASS"} />
    ),
  },
];

export function ExamResultsPage() {
  const { id: examId } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"results" | "gpa">("results");
  const { data: exam } = useExam(examId!);
  const { data, isLoading, isError, refetch } = useExamResults(examId!, {
    page,
    limit: 50,
  });
  const { data: summaries } = useExamSummaries(examId!);

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load results" onRetry={() => refetch()} />
    );

  const isFinalizedOrPublished =
    exam?.data?.status === "FINALIZED" || exam?.data?.status === "PUBLISHED";

  return (
    <div>
      <PageHeader title={`Results - ${exam?.data?.name ?? "Exam"}`} />

      {isFinalizedOrPublished && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setView("results")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              view === "results"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Subject Results
          </button>
          <button
            onClick={() => setView("gpa")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              view === "gpa"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            GPA Summary
          </button>
        </div>
      )}

      {view === "results" ? (
        <DataTable
          columns={resultColumns}
          data={data?.data ?? []}
          pagination={data?.meta}
          onPageChange={setPage}
        />
      ) : (
        <DataTable
          columns={summaryColumns}
          data={(summaries?.data as StudentExamSummary[]) ?? []}
        />
      )}
    </div>
  );
}

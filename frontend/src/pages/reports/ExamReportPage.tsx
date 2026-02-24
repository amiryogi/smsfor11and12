import { useState } from "react";
import { useParams } from "react-router-dom";
import { useExamGradeReport, useBulkMarksheets } from "../../hooks/useReports";
import { useGrades } from "../../hooks/useAcademic";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";

export function ExamReportPage() {
  const { examId } = useParams<{ examId: string }>();
  const [selectedGrade, setSelectedGrade] = useState("");
  const { data: grades } = useGrades();
  const {
    data: report,
    isLoading,
    isError,
  } = useExamGradeReport(examId!, selectedGrade);
  const bulkMarksheets = useBulkMarksheets();

  return (
    <div>
      <PageHeader
        title="Exam Report"
        action={
          <button
            onClick={() => bulkMarksheets.mutate(examId!)}
            disabled={bulkMarksheets.isPending}
            className="btn-primary"
          >
            {bulkMarksheets.isPending
              ? "Generating..."
              : "Generate All Marksheets"}
          </button>
        }
      />
      <div className="mb-6 max-w-xs">
        <FormField label="Select Grade">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="input"
          >
            <option value="">Choose grade</option>
            {grades?.data?.map((g) => (
              <option key={g.id} value={g.id}>
                Grade {g.level} {g.section} ({g.stream})
              </option>
            ))}
          </select>
        </FormField>
      </div>
      {selectedGrade && isLoading && <LoadingSpinner />}
      {selectedGrade && isError && (
        <ErrorState message="Failed to load report" />
      )}
      {report?.data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold">Summary</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Total Students</dt>
                <dd className="text-xl font-bold">
                  {report.data.totalStudents}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Pass</dt>
                <dd className="text-xl font-bold text-green-600">
                  {report.data.passCount}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Fail</dt>
                <dd className="text-xl font-bold text-red-600">
                  {report.data.failCount}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Avg. %</dt>
                <dd className="text-xl font-bold">
                  {report.data.averagePercentage?.toFixed(1)}%
                </dd>
              </div>
            </dl>
          </div>
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold">Grade Distribution</h3>
            <div className="space-y-2">
              {Object.entries(report.data.gradeDistribution ?? {}).map(
                ([grade, count]) => (
                  <div
                    key={grade}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{grade}</span>
                    <span className="text-gray-600">
                      {count as number} students
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

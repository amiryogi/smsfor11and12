import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useExam,
  useExamResults,
  useBulkCreateExamResults,
} from "../../hooks/useExams";
import { useGrades, useGradeSubjects } from "../../hooks/useAcademic";
import { useEnrollments } from "../../hooks/useStudents";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { toast } from "sonner";
import type { CreateExamResultInput } from "../../types/exam.types";

export function MarksEntryPage() {
  const { id: examId } = useParams<{ id: string }>();
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState<
    Record<string, { theory: string; practical: string }>
  >({});

  const { data: exam, isLoading: examLoading } = useExam(examId!);
  const { data: grades } = useGrades();
  const { data: gradeSubjects } = useGradeSubjects(selectedGrade);
  const { data: enrollments } = useEnrollments({
    gradeId: selectedGrade,
    academicYearId: exam?.data?.academicYearId,
  });
  const { data: existingResults } = useExamResults(examId!, {
    gradeSubjectId: selectedSubject,
  });
  const bulkSave = useBulkCreateExamResults(examId!);

  if (examLoading) return <LoadingSpinner />;
  if (!exam) return <ErrorState message="Exam not found" />;

  const students = enrollments?.data ?? [];

  const handleSave = async () => {
    const results: CreateExamResultInput[] = students
      .filter(
        (e) => marks[e.studentId]?.theory || marks[e.studentId]?.practical,
      )
      .map((e) => ({
        studentId: e.studentId,
        gradeSubjectId: selectedSubject,
        theoryMarksObtained: marks[e.studentId]?.theory
          ? parseFloat(marks[e.studentId].theory)
          : undefined,
        practicalMarksObtained: marks[e.studentId]?.practical
          ? parseFloat(marks[e.studentId].practical)
          : undefined,
      }));

    if (results.length === 0) {
      toast.error("No marks entered");
      return;
    }

    await bulkSave.mutateAsync({ results });
    setMarks({});
  };

  return (
    <div>
      <PageHeader title={`Marks Entry - ${exam.data.name}`} />
      <div className="mb-6 grid grid-cols-2 gap-4 max-w-xl">
        <FormField label="Grade">
          <select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedSubject("");
            }}
            className="input"
          >
            <option value="">Select Grade</option>
            {grades?.data?.map((g) => (
              <option key={g.id} value={g.id}>
                Grade {g.level} {g.section} ({g.stream})
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Subject">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input"
            disabled={!selectedGrade}
          >
            <option value="">Select Subject</option>
            {gradeSubjects?.data?.map((gs) => (
              <option key={gs.id} value={gs.id}>
                {gs.subject?.name ?? gs.subjectId}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      {selectedGrade && selectedSubject && students.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Roll
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Theory
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Practical
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((e) => {
                const existing = existingResults?.data?.find(
                  (r) => r.studentId === e.studentId,
                );
                return (
                  <tr key={e.studentId}>
                    <td className="px-4 py-2">{e.rollNo ?? "-"}</td>
                    <td className="px-4 py-2">{e.studentId.slice(0, 8)}...</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input w-24"
                        placeholder={
                          existing?.theoryMarksObtained?.toString() ?? ""
                        }
                        value={marks[e.studentId]?.theory ?? ""}
                        onChange={(ev) =>
                          setMarks((prev) => ({
                            ...prev,
                            [e.studentId]: {
                              ...prev[e.studentId],
                              theory: ev.target.value,
                              practical: prev[e.studentId]?.practical ?? "",
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input w-24"
                        placeholder={
                          existing?.practicalMarksObtained?.toString() ?? ""
                        }
                        value={marks[e.studentId]?.practical ?? ""}
                        onChange={(ev) =>
                          setMarks((prev) => ({
                            ...prev,
                            [e.studentId]: {
                              theory: prev[e.studentId]?.theory ?? "",
                              practical: ev.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={bulkSave.isPending}
              className="btn-primary"
            >
              {bulkSave.isPending ? "Saving..." : "Save All Marks"}
            </button>
          </div>
        </div>
      )}
      {selectedGrade && selectedSubject && students.length === 0 && (
        <p className="text-sm text-gray-500">
          No students enrolled in this grade for the exam's academic year.
        </p>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAcademicYears, useGrades, useGradeSubjects } from "../../hooks/useAcademic";
import { PageHeader } from "../../components/layout/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { apiClient } from "../../api/client";
import { toast } from "sonner";

interface GradeSubjectItem {
  id: string;
  isOptional: boolean;
  subject: { id: string; name: string; code: string };
}

export function SubjectSelectionPage() {
  const [gradeId, setGradeId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: gradesData } = useGrades();
  const { data: yearsData } = useAcademicYears();
  const { data: subjectsData, isLoading: subjectsLoading } =
    useGradeSubjects(gradeId);

  const allSubjects: GradeSubjectItem[] = (subjectsData?.data ?? []) as GradeSubjectItem[];
  const compulsory = allSubjects.filter((s) => !s.isOptional);
  const optional = allSubjects.filter((s) => s.isOptional);

  // Auto-select compulsory subjects when grade changes
  useEffect(() => {
    setSelectedIds(compulsory.map((s) => s.id));
  }, [allSubjects.length, gradeId]);

  const toggleOptional = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !academicYearId || selectedIds.length === 0) {
      toast.error("Please fill all fields and select subjects");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post("/academic/subject-selections", {
        studentId,
        academicYearId,
        gradeSubjectIds: selectedIds,
      });
      toast.success("Subject selection saved");
    } catch {
      toast.error("Failed to save subject selection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Subject Selection"
        description="Assign elective/optional subjects to students"
      />

      <form onSubmit={handleSubmit}>
        <div className="card mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Grade" required>
              <select
                className="input"
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                required
              >
                <option value="">Select grade</option>
                {gradesData?.data?.map((g) => (
                  <option key={g.id} value={g.id}>
                    Grade {g.level} - {g.section}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Academic Year" required>
              <select
                className="input"
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                required
              >
                <option value="">Select year</option>
                {yearsData?.data?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Student ID" required>
              <input
                type="text"
                className="input"
                placeholder="Student UUID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>

        {gradeId && subjectsLoading && <LoadingSpinner />}

        {gradeId && !subjectsLoading && allSubjects.length > 0 && (
          <div className="space-y-6">
            {/* Compulsory Subjects */}
            <div className="card">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Compulsory Subjects ({compulsory.length})
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {compulsory.map((gs) => (
                  <div
                    key={gs.id}
                    className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-green-800">
                      {gs.subject.name}{" "}
                      <span className="text-xs text-green-600">
                        ({gs.subject.code})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Subjects */}
            {optional.length > 0 && (
              <div className="card">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Optional / Elective Subjects ({optional.length})
                </h3>
                <p className="mb-3 text-sm text-gray-500">
                  Select the optional subjects for this student.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {optional.map((gs) => (
                    <label
                      key={gs.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                        selectedIds.includes(gs.id)
                          ? "border-primary-300 bg-primary-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary-600"
                        checked={selectedIds.includes(gs.id)}
                        onChange={() => toggleOptional(gs.id)}
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {gs.subject.name}{" "}
                        <span className="text-xs text-gray-500">
                          ({gs.subject.code})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Saving..." : "Save Selection"}
              </button>
            </div>
          </div>
        )}

        {gradeId && !subjectsLoading && allSubjects.length === 0 && (
          <div className="card text-center text-sm text-gray-500">
            No subjects assigned to this grade yet.
          </div>
        )}
      </form>
    </div>
  );
}

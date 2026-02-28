import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAcademicYears, useGrades } from "../../hooks/useAcademic";
import { useStudents } from "../../hooks/useStudents";
import { useTakeAttendance } from "../../hooks/useAttendance";
import { PageHeader } from "../../components/layout/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import type { AttendanceStatus } from "../../types/api.types";
import type { AttendanceRecordEntry } from "../../types/attendance.types";

const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "PRESENT", label: "Present", color: "bg-green-100 text-green-800" },
  { value: "ABSENT", label: "Absent", color: "bg-red-100 text-red-800" },
  { value: "LATE", label: "Late", color: "bg-yellow-100 text-yellow-800" },
  { value: "LEAVE", label: "Leave", color: "bg-blue-100 text-blue-800" },
];

export function TakeAttendancePage() {
  const navigate = useNavigate();
  const [gradeId, setGradeId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<
    (AttendanceRecordEntry & { name: string; regNo: string })[]
  >([]);

  const { data: gradesData } = useGrades();
  const { data: yearsData } = useAcademicYears();
  const { data: studentsData, isLoading: studentsLoading } = useStudents(
    gradeId
      ? { page: 1, limit: 200, gradeId, status: "ACTIVE" }
      : { page: 1, limit: 0 },
  );

  const takeMutation = useTakeAttendance();

  // Populate records when students load
  useEffect(() => {
    if (studentsData?.data) {
      setRecords(
        studentsData.data.map((s) => ({
          studentId: s.id,
          status: "PRESENT" as AttendanceStatus,
          remarks: "",
          name: `${s.firstName} ${s.lastName}`,
          regNo: s.registrationNo,
        })),
      );
    }
  }, [studentsData]);

  const handleStatusChange = (idx: number, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, status } : r)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeId || !academicYearId || records.length === 0) return;

    takeMutation.mutate(
      {
        gradeId,
        academicYearId,
        date,
        records: records.map(({ studentId, status, remarks }) => ({
          studentId,
          status,
          remarks: remarks || undefined,
        })),
      },
      { onSuccess: () => navigate("/attendance") },
    );
  };

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;

  return (
    <div>
      <PageHeader title="Take Attendance" description="Record daily attendance for a grade" />

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

            <FormField label="Date" required>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>

        {gradeId && studentsLoading && <LoadingSpinner />}

        {records.length > 0 && (
          <>
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                Total: {records.length}
              </span>
              <span className="text-sm font-medium text-green-700">
                Present: {presentCount}
              </span>
              <span className="text-sm font-medium text-red-700">
                Absent: {absentCount}
              </span>
            </div>

            <div className="card">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Reg. No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record, idx) => (
                    <tr key={record.studentId}>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700">
                        {record.regNo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">
                        {record.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <div className="flex gap-1">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleStatusChange(idx, opt.value)}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                record.status === opt.value
                                  ? opt.color
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          className="input text-xs"
                          placeholder="Optional remarks"
                          value={record.remarks ?? ""}
                          onChange={(e) =>
                            setRecords((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, remarks: e.target.value } : r,
                              ),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/attendance")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={takeMutation.isPending}
                className="btn-primary"
              >
                {takeMutation.isPending
                  ? "Saving..."
                  : "Save Attendance"}
              </button>
            </div>
          </>
        )}

        {gradeId && !studentsLoading && records.length === 0 && (
          <div className="card text-center text-sm text-gray-500">
            No active students found in this grade.
          </div>
        )}
      </form>
    </div>
  );
}

import { Link, useParams } from "react-router-dom";
import { useStudent, useStudentEnrollments } from "../../hooks/useStudents";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatDate } from "../../utils/format-date";

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: student, isLoading, isError } = useStudent(id!);
  const { data: enrollments } = useStudentEnrollments(id!);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !student)
    return <ErrorState message="Failed to load student" />;

  const s = student.data;

  return (
    <div>
      <PageHeader
        title={`${s.firstName} ${s.lastName}`}
        description={`Registration: ${s.registrationNo}`}
        action={
          <Link to={`/students/${id}/edit`} className="btn-primary">
            Edit
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Student Information
          </h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Registration No.</dt>
              <dd className="font-medium text-gray-900">{s.registrationNo}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Symbol No.</dt>
              <dd className="font-medium text-gray-900">{s.symbolNo ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Gender</dt>
              <dd className="font-medium text-gray-900">{s.gender}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Date of Birth</dt>
              <dd className="font-medium text-gray-900">{formatDate(s.dob)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{s.phone ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <StatusBadge status={s.status} />
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">Address</dt>
              <dd className="font-medium text-gray-900">{s.address ?? "-"}</dd>
            </div>
          </dl>
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Enrollment History
          </h3>
          {enrollments?.data && enrollments.data.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {enrollments.data.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Grade {e.grade?.level} {e.grade?.section} (
                      {e.grade?.stream})
                    </p>
                    <p className="text-xs text-gray-500">
                      {e.academicYear?.name}
                    </p>
                  </div>
                  {e.rollNo && (
                    <span className="text-sm text-gray-500">
                      Roll: {e.rollNo}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No enrollments found</p>
          )}
        </div>
      </div>
    </div>
  );
}

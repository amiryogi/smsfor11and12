import { useLocalSearchParams } from "expo-router";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import {
  useStudent,
  useStudentEnrollments,
} from "../../../src/hooks/useStudents";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { Avatar } from "../../../src/components/ui/Avatar";
import { Badge } from "../../../src/components/ui/Badge";
import { Card } from "../../../src/components/ui/Card";
import { Divider } from "../../../src/components/ui/Divider";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";

export function StudentProfileScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const {
    data: student,
    isLoading,
    refetch,
    isRefetching,
  } = useStudent(studentId!);
  const { data: enrollments } = useStudentEnrollments(studentId!);

  if (isLoading) return <LoadingScreen message="Loading student..." />;

  const s = student?.data;

  return (
    <ScreenWrapper title="Student Profile" showBack>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Profile Header */}
        <View className="items-center py-6 bg-primary-50 dark:bg-primary-900/20">
          <Avatar
            uri={s?.profilePicUrl}
            name={`${s?.firstName} ${s?.lastName}`}
            size={80}
          />
          <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100 mt-3">
            {s?.firstName} {s?.lastName}
          </Text>
          <Text className="text-sm font-sans text-muted mt-1">
            Reg: {s?.registrationNo}
          </Text>
          <Badge
            label={s?.status ?? "ACTIVE"}
            status={s?.status ?? "ACTIVE"}
            className="mt-2"
          />
        </View>

        {/* Details */}
        <View className="p-4 gap-3">
          {s?.email && <InfoRow label="Email" value={s.email} />}
          {s?.phone && <InfoRow label="Phone" value={s.phone} />}
          {s?.dateOfBirth && (
            <InfoRow label="Date of Birth" value={s.dateOfBirth} />
          )}
          {s?.gender && <InfoRow label="Gender" value={s.gender} />}
        </View>

        <Divider className="mx-4" />

        {/* Enrollments */}
        <View className="p-4">
          <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100 mb-3">
            Enrollment History
          </Text>
          {enrollments?.data?.map((enrollment: any) => (
            <Card key={enrollment.id} className="mb-2">
              <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
                {enrollment.gradeName}
                {enrollment.sectionName ? ` - ${enrollment.sectionName}` : ""}
              </Text>
              <Text className="text-xs font-sans text-muted mt-1">
                {enrollment.academicYearName}
                {enrollment.rollNo ? ` • Roll No: ${enrollment.rollNo}` : ""}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-sm font-sans text-muted">{label}</Text>
      <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
        {value}
      </Text>
    </View>
  );
}

export default StudentProfileScreen;

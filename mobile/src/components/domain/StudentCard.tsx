import { memo } from "react";
import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import type { Student } from "../../types/student.types";

interface StudentCardProps {
  student: Student;
  onPress: () => void;
}

export const StudentCard = memo(function StudentCard({
  student,
  onPress,
}: StudentCardProps) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-3">
        <Avatar
          uri={student.profilePicUrl}
          name={`${student.firstName} ${student.lastName}`}
          size={48}
        />
        <View className="flex-1">
          <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100">
            {student.firstName} {student.lastName}
          </Text>
          <Text className="text-sm font-sans text-muted mt-0.5">
            Reg: {student.registrationNo}
          </Text>
        </View>
        <Badge label={student.status} status={student.status} />
      </View>
    </Card>
  );
});

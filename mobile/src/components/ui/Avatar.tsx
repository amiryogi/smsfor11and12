import { View, Text, Image } from "react-native";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={name ?? "User avatar"}
        className="rounded-full bg-gray-200"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <View
      className="rounded-full bg-primary-100 dark:bg-primary-800 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Text
        className="font-sans-bold text-primary-700 dark:text-primary-200"
        style={{ fontSize: size * 0.4 }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

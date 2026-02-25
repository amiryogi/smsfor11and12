import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { container: string; text: string; iconColor: string }
> = {
  primary: {
    container: "bg-primary-600 active:bg-primary-700",
    text: "text-white",
    iconColor: "#FFFFFF",
  },
  secondary: {
    container: "bg-gray-100 dark:bg-gray-800 active:bg-gray-200",
    text: "text-gray-900 dark:text-gray-100",
    iconColor: "#111827",
  },
  outline: {
    container: "border border-primary-600 active:bg-primary-50",
    text: "text-primary-600",
    iconColor: "#2563EB",
  },
  danger: {
    container: "bg-danger active:opacity-80",
    text: "text-white",
    iconColor: "#FFFFFF",
  },
  ghost: {
    container: "active:bg-gray-100 dark:active:bg-gray-800",
    text: "text-primary-600",
    iconColor: "#2563EB",
  },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  className = "",
  fullWidth = true,
}: ButtonProps) {
  const styles = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      className={`
        flex-row items-center justify-center rounded-xl py-3.5 px-6
        ${styles.container}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50" : ""}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator color={styles.iconColor} size="small" />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && <Ionicons name={icon} size={20} color={styles.iconColor} />}
          <Text className={`text-base font-sans-semibold ${styles.text}`}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

# Context: Mobile UI Component Library & Design System

## Domain: NEB +2 School Management ERP — React Native Expo

This document defines the shared UI component library, design tokens, theming, and component patterns for the mobile app. The agent MUST use these components and patterns when building any screen. NEVER re-implement primitives that already exist here.

---

### 🚨 UI Rules

1. **NativeWind only.** All styling MUST use NativeWind (Tailwind) utility classes. No `StyleSheet.create()`, no inline `style={{}}` objects. Exception: dynamic computed values (e.g., chart widths, progress bar percentages).
2. **Use shared components.** NEVER create a one-off button, input, card, or badge. Always use the components defined in this document.
3. **Consistent spacing.** Use Tailwind's spacing scale: `p-2` (8px), `p-3` (12px), `p-4` (16px), `gap-3`, `gap-4`. NEVER use arbitrary values like `p-[13px]`.
4. **Color tokens only.** Use the colors defined in `tailwind.config.ts` (doc 13): `primary-*`, `success`, `warning`, `danger`, `muted`, `surface`. NEVER use raw hex codes in components.
5. **Font tokens only.** Use `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`. NEVER use fontWeight numeric values directly.
6. **Accessibility.** All interactive elements MUST have `accessibilityLabel` and `accessibilityRole` props. Images MUST have `accessibilityLabel` or `accessible={false}` for decorative images.
7. **Dark mode ready.** Use `dark:` variant for all color classes. Background: `bg-white dark:bg-gray-900`, Text: `text-gray-900 dark:text-gray-100`, etc.

---

### 🎨 1. Design Tokens

```typescript
// src/constants/colors.ts
export const COLORS = {
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  muted: "#6B7280",
  surface: "#F9FAFB",
  white: "#FFFFFF",
  black: "#111827",
} as const;

// Status → color mapping for badges
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-700 dark:text-green-300",
  },
  GRADUATED: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-700 dark:text-blue-300",
  },
  DROPOUT: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-700 dark:text-red-300",
  },
  TRANSFERRED: {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  SUSPENDED: {
    bg: "bg-gray-100 dark:bg-gray-900",
    text: "text-gray-700 dark:text-gray-300",
  },
  // Exam statuses
  DRAFT: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-300",
  },
  MARKS_ENTRY: {
    bg: "bg-amber-100 dark:bg-amber-900",
    text: "text-amber-700 dark:text-amber-300",
  },
  FINALIZED: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-700 dark:text-blue-300",
  },
  PUBLISHED: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-700 dark:text-green-300",
  },
  // Invoice statuses
  UNPAID: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-700 dark:text-red-300",
  },
  PARTIALLY_PAID: {
    bg: "bg-amber-100 dark:bg-amber-900",
    text: "text-amber-700 dark:text-amber-300",
  },
  PAID: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-700 dark:text-green-300",
  },
  CANCELLED: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-400",
  },
} as const;

// NEB Grade → color mapping
export const GRADE_COLORS: Record<string, string> = {
  "A+": "text-green-600",
  A: "text-green-500",
  "B+": "text-blue-600",
  B: "text-blue-500",
  "C+": "text-yellow-600",
  C: "text-yellow-500",
  D: "text-orange-500",
  NG: "text-red-600",
};
```

---

### 🧩 2. Primitive UI Components

#### 2.1 Button

```tsx
// src/components/ui/Button.tsx
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
    container: "border border-primary-600 bg-transparent active:bg-primary-50",
    text: "text-primary-600",
    iconColor: "#2563EB",
  },
  danger: {
    container: "bg-red-600 active:bg-red-700",
    text: "text-white",
    iconColor: "#FFFFFF",
  },
  ghost: {
    container: "bg-transparent active:bg-gray-100 dark:active:bg-gray-800",
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
        flex-row items-center justify-center rounded-xl py-3.5 px-5
        ${fullWidth ? "w-full" : ""}
        ${styles.container}
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
```

#### 2.2 Card

```tsx
// src/components/ui/Card.tsx
import { View, Pressable, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  onPress,
  className = "",
  children,
  ...props
}: CardProps) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      className={`
        bg-white dark:bg-gray-800 rounded-2xl p-4
        border border-gray-100 dark:border-gray-700
        ${onPress ? "active:bg-gray-50 dark:active:bg-gray-750" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </Wrapper>
  );
}
```

#### 2.3 Badge

```tsx
// src/components/ui/Badge.tsx
import { View, Text } from "react-native";
import { STATUS_COLORS } from "@constants/colors";

interface BadgeProps {
  label: string;
  status?: string; // Maps to STATUS_COLORS
  className?: string;
}

export function Badge({ label, status, className = "" }: BadgeProps) {
  const colors =
    status && STATUS_COLORS[status]
      ? STATUS_COLORS[status]
      : {
          bg: "bg-gray-100 dark:bg-gray-800",
          text: "text-gray-600 dark:text-gray-300",
        };

  return (
    <View
      className={`px-2.5 py-1 rounded-full self-start ${colors.bg} ${className}`}
    >
      <Text className={`text-xs font-sans-semibold ${colors.text}`}>
        {label}
      </Text>
    </View>
  );
}
```

#### 2.4 Avatar

```tsx
// src/components/ui/Avatar.tsx
import { View, Image, Text } from "react-native";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({ uri, name, size = 48, className = "" }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={name ?? "Profile picture"}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className={`bg-gray-200 ${className}`}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`bg-primary-100 dark:bg-primary-900 items-center justify-center ${className}`}
      accessibilityLabel={name ?? "Avatar"}
    >
      <Text
        className="text-primary-700 dark:text-primary-300 font-sans-bold"
        style={{ fontSize: size * 0.36 }}
      >
        {initials}
      </Text>
    </View>
  );
}
```

#### 2.5 EmptyState

```tsx
// src/components/ui/EmptyState.tsx
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: React.ReactNode;
}

export function EmptyState({
  message,
  icon = "folder-open",
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Ionicons name={icon} size={56} color="#D1D5DB" />
      <Text className="text-base font-sans-medium text-muted mt-4 text-center">
        {message}
      </Text>
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
```

#### 2.6 StatCard (Dashboard)

```tsx
// src/components/ui/StatCard.tsx
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type StatColor = "primary" | "success" | "warning" | "danger";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: StatColor;
}

const COLOR_MAP: Record<StatColor, { bg: string; icon: string }> = {
  primary: { bg: "bg-primary-50 dark:bg-primary-900/30", icon: "#3B82F6" },
  success: { bg: "bg-green-50 dark:bg-green-900/30", icon: "#10B981" },
  warning: { bg: "bg-amber-50 dark:bg-amber-900/30", icon: "#F59E0B" },
  danger: { bg: "bg-red-50 dark:bg-red-900/30", icon: "#EF4444" },
};

export function StatCard({ title, value, icon, color }: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <View className={`${colors.bg} rounded-2xl p-4 flex-1 min-w-[45%]`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-sans-medium text-muted">{title}</Text>
        <Ionicons name={icon} size={20} color={colors.icon} />
      </View>
      <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
    </View>
  );
}
```

#### 2.7 Divider

```tsx
// src/components/ui/Divider.tsx
import { View } from "react-native";

export function Divider({ className = "" }: { className?: string }) {
  return <View className={`h-px bg-gray-200 dark:bg-gray-700 ${className}`} />;
}
```

#### 2.8 LoadingScreen

```tsx
// src/components/ui/LoadingScreen.tsx
import { View, ActivityIndicator, Text } from "react-native";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <ActivityIndicator size="large" color="#3B82F6" />
      {message && (
        <Text className="text-sm font-sans text-muted mt-3">{message}</Text>
      )}
    </View>
  );
}
```

---

### 📝 3. Form Components

#### 3.1 FormInput

```tsx
// src/components/forms/FormInput.tsx
import { View, Text, TextInput, TextInputProps } from "react-native";

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormInput({
  label,
  error,
  required = false,
  className = "",
  ...props
}: FormInputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      <Text className="text-sm font-sans-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <Text className="text-danger"> *</Text>}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#9CA3AF"
        className={`
          bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3.5
          text-base font-sans text-gray-900 dark:text-gray-100
          border ${error ? "border-danger" : "border-gray-200 dark:border-gray-700"}
        `}
        {...props}
      />
      {error && (
        <Text className="text-xs font-sans text-danger mt-1">{error}</Text>
      )}
    </View>
  );
}
```

#### 3.2 FormSelect (Dropdown)

```tsx
// src/components/forms/FormSelect.tsx
import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export function FormSelect({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Select...",
  required = false,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <View className="mb-4">
      <Text className="text-sm font-sans-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <Text className="text-danger"> *</Text>}
      </Text>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel}`}
        className={`
          bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3.5
          flex-row items-center justify-between
          border ${error ? "border-danger" : "border-gray-200 dark:border-gray-700"}
        `}
      >
        <Text
          className={`text-base font-sans ${value ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}
        >
          {selectedLabel}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9CA3AF"
        />
      </Pressable>

      {isOpen && (
        <View className="bg-white dark:bg-gray-800 rounded-xl mt-1 border border-gray-200 dark:border-gray-700 overflow-hidden">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-3 ${option.value === value ? "bg-primary-50 dark:bg-primary-900/30" : ""}`}
            >
              <Text
                className={`text-base font-sans ${
                  option.value === value
                    ? "text-primary-600 font-sans-medium"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {error && (
        <Text className="text-xs font-sans text-danger mt-1">{error}</Text>
      )}
    </View>
  );
}
```

#### 3.3 SearchBar

```tsx
// src/components/ui/SearchBar.tsx
import { View, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl mx-4 mt-3 mb-2 px-3 border border-gray-200 dark:border-gray-700">
      <Ionicons name="search" size={20} color="#9CA3AF" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        accessibilityLabel="Search"
        className="flex-1 py-3 px-2 text-base font-sans text-gray-900 dark:text-gray-100"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </Pressable>
      )}
    </View>
  );
}
```

---

### 🧱 4. Layout Components

#### 4.1 ScreenWrapper

```tsx
// src/components/layout/ScreenWrapper.tsx
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OfflineBanner } from "./OfflineBanner";

interface ScreenWrapperProps {
  title?: string;
  showBack?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function ScreenWrapper({
  title,
  showBack = false,
  headerRight,
  children,
}: ScreenWrapperProps) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <OfflineBanner />

      {/* Header */}
      {title && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center gap-3">
            {showBack && (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={24} color="#1E40AF" />
              </Pressable>
            )}
            <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
              {title}
            </Text>
          </View>
          {headerRight && <View>{headerRight}</View>}
        </View>
      )}

      {/* Content */}
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
```

#### 4.2 KeyboardAwareScrollView

```tsx
// src/components/layout/KeyboardAwareView.tsx
import { KeyboardAvoidingView, ScrollView, Platform } from "react-native";

interface KeyboardAwareViewProps {
  children: React.ReactNode;
  className?: string;
}

export function KeyboardAwareView({
  children,
  className = "",
}: KeyboardAwareViewProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className={`flex-1 ${className}`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

---

### 🏫 5. Domain-Specific Components

#### 5.1 StudentCard

```tsx
// src/components/domain/StudentCard.tsx
import { memo } from "react";
import { View, Text } from "react-native";
import { Card } from "@components/ui/Card";
import { Avatar } from "@components/ui/Avatar";
import { Badge } from "@components/ui/Badge";
import type { Student } from "@types/student.types";

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
```

#### 5.2 ExamCard

```tsx
// src/components/domain/ExamCard.tsx
import { memo } from "react";
import { View, Text } from "react-native";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "@utils/format";
import type { Exam } from "@types/exam.types";

interface ExamCardProps {
  exam: Exam;
  onPress: () => void;
}

export const ExamCard = memo(function ExamCard({
  exam,
  onPress,
}: ExamCardProps) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100">
            {exam.name}
          </Text>
          <Text className="text-sm font-sans text-muted mt-1">
            {exam.examType} • {exam.academicYear?.name}
          </Text>
          {exam.startDate && (
            <View className="flex-row items-center mt-2 gap-1">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="text-xs font-sans text-muted">
                {formatDate(exam.startDate)}
                {exam.endDate ? ` – ${formatDate(exam.endDate)}` : ""}
              </Text>
            </View>
          )}
        </View>
        <Badge label={exam.status.replace("_", " ")} status={exam.status} />
      </View>
    </Card>
  );
});
```

#### 5.3 InvoiceRow

```tsx
// src/components/domain/InvoiceRow.tsx
import { memo } from "react";
import { View, Text } from "react-native";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { formatNPR, formatDate } from "@utils/format";
import type { Invoice } from "@types/finance.types";

interface InvoiceRowProps {
  invoice: Invoice;
  onPress: () => void;
}

export const InvoiceRow = memo(function InvoiceRow({
  invoice,
  onPress,
}: InvoiceRowProps) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100">
            {invoice.studentName}
          </Text>
          <Text className="text-sm font-sans text-muted mt-0.5">
            {invoice.academicYearName}
            {invoice.dueDate ? ` • Due: ${formatDate(invoice.dueDate)}` : ""}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-sans-bold text-gray-900 dark:text-gray-100">
            {formatNPR(invoice.totalAmount)}
          </Text>
          <Badge
            label={invoice.status}
            status={invoice.status}
            className="mt-1"
          />
        </View>
      </View>

      {/* Balance bar */}
      {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
        <View className="mt-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs font-sans text-muted">
              Paid: {formatNPR(invoice.paidAmount)}
            </Text>
            <Text className="text-xs font-sans text-danger">
              Due: {formatNPR(invoice.balanceDue)}
            </Text>
          </View>
          <View className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-green-500 rounded-full"
              style={{
                width: `${Math.min((invoice.paidAmount / invoice.totalAmount) * 100, 100)}%`,
              }}
            />
          </View>
        </View>
      )}
    </Card>
  );
});
```

#### 5.4 SubjectResultRow

```tsx
// src/components/domain/SubjectResultRow.tsx
import { memo } from "react";
import { View, Text } from "react-native";
import { GRADE_COLORS } from "@constants/colors";
import type { ExamResult } from "@types/exam.types";

interface SubjectResultRowProps {
  result: ExamResult;
}

export const SubjectResultRow = memo(function SubjectResultRow({
  result,
}: SubjectResultRowProps) {
  const gradeColor = GRADE_COLORS[result.finalGrade] ?? "text-gray-500";

  return (
    <View className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800">
      {/* Subject name */}
      <View className="flex-1">
        <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
          {result.subjectName}
        </Text>
        <Text className="text-xs font-sans text-muted">
          {result.subjectCode}
        </Text>
      </View>

      {/* Marks */}
      <View className="items-center w-16">
        <Text className="text-sm font-sans text-gray-700 dark:text-gray-300">
          {result.theoryMarksObtained ?? "-"}/{result.theoryFullMarks}
        </Text>
        <Text className="text-xs font-sans text-muted">Theory</Text>
      </View>

      {result.practicalFullMarks && (
        <View className="items-center w-16">
          <Text className="text-sm font-sans text-gray-700 dark:text-gray-300">
            {result.practicalMarksObtained ?? "-"}/{result.practicalFullMarks}
          </Text>
          <Text className="text-xs font-sans text-muted">Practical</Text>
        </View>
      )}

      {/* Grade */}
      <View className="items-center w-12">
        <Text className={`text-lg font-sans-bold ${gradeColor}`}>
          {result.finalGrade}
        </Text>
        <Text className="text-xs font-sans text-muted">
          {result.finalGradePoint?.toFixed(1)}
        </Text>
      </View>
    </View>
  );
});
```

#### 5.5 NotificationItem

```tsx
// src/components/domain/NotificationItem.tsx
import { memo } from "react";
import { Pressable, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatRelativeTime } from "@utils/format";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  };
  onPress: () => void;
}

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  EXAM_PUBLISHED: "school",
  PAYMENT_RECEIVED: "wallet",
  PDF_READY: "document-text",
  JOB_FAILED: "alert-circle",
  GENERAL: "notifications",
};

export const NotificationItem = memo(function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const icon = TYPE_ICONS[notification.type] ?? "notifications";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
      className={`flex-row items-start gap-3 px-4 py-3.5
        ${notification.isRead ? "bg-white dark:bg-gray-900" : "bg-primary-50 dark:bg-primary-900/20"}
      `}
    >
      <View className="bg-primary-100 dark:bg-primary-800 rounded-full p-2 mt-0.5">
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-sans-medium text-gray-900 dark:text-gray-100">
          {notification.title}
        </Text>
        <Text className="text-sm font-sans text-muted mt-0.5" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text className="text-xs font-sans text-muted mt-1">
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
      {!notification.isRead && (
        <View className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-2" />
      )}
    </Pressable>
  );
});
```

#### 5.6 GradeBadge

```tsx
// src/components/domain/GradeBadge.tsx
import { Badge } from "@components/ui/Badge";

interface GradeBadgeProps {
  status: string;
  className?: string;
}

export function GradeBadge({ status, className }: GradeBadgeProps) {
  const label = status.replace(/_/g, " ");
  return <Badge label={label} status={status} className={className} />;
}
```

#### 5.7 RoleBadge

```tsx
// src/components/domain/RoleBadge.tsx
import { View, Text } from "react-native";

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN: {
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-700 dark:text-purple-300",
  },
  ADMIN: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-700 dark:text-blue-300",
  },
  TEACHER: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-700 dark:text-green-300",
  },
  ACCOUNTANT: {
    bg: "bg-amber-100 dark:bg-amber-900",
    text: "text-amber-700 dark:text-amber-300",
  },
  PARENT: {
    bg: "bg-teal-100 dark:bg-teal-900",
    text: "text-teal-700 dark:text-teal-300",
  },
  STUDENT: {
    bg: "bg-indigo-100 dark:bg-indigo-900",
    text: "text-indigo-700 dark:text-indigo-300",
  },
};

export function RoleBadge({ role }: { role: string }) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.STUDENT;

  return (
    <View className={`px-3 py-1 rounded-full ${style.bg} mt-1`}>
      <Text className={`text-xs font-sans-semibold ${style.text}`}>
        {role.replace(/_/g, " ")}
      </Text>
    </View>
  );
}
```

---

### 📊 6. Chart Component (Admin Dashboard)

```tsx
// src/components/domain/RevenueChart.tsx
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { formatNPR } from "@utils/format";

interface RevenueChartProps {
  data: Array<{ month: string; amount: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) return null;

  const screenWidth = Dimensions.get("window").width - 32; // padding

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100 mb-3">
        Monthly Revenue
      </Text>
      <LineChart
        data={{
          labels: data.map((d) => d.month),
          datasets: [{ data: data.map((d) => d.amount) }],
        }}
        width={screenWidth - 32}
        height={200}
        yAxisLabel="रु."
        chartConfig={{
          backgroundColor: "#FFFFFF",
          backgroundGradientFrom: "#FFFFFF",
          backgroundGradientTo: "#FFFFFF",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: () => "#6B7280",
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#2563EB",
          },
        }}
        bezier
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}
```

---

### 📋 7. Complete Component Inventory

| Category   | Component             | File                                            | Used In                         |
| ---------- | --------------------- | ----------------------------------------------- | ------------------------------- |
| **UI**     | `Button`              | `src/components/ui/Button.tsx`                  | All forms, CTAs                 |
| **UI**     | `Card`                | `src/components/ui/Card.tsx`                    | List items, detail sections     |
| **UI**     | `Badge`               | `src/components/ui/Badge.tsx`                   | Status labels everywhere        |
| **UI**     | `Avatar`              | `src/components/ui/Avatar.tsx`                  | Student cards, profile          |
| **UI**     | `EmptyState`          | `src/components/ui/EmptyState.tsx`              | All FlatList empty states       |
| **UI**     | `StatCard`            | `src/components/ui/StatCard.tsx`                | Dashboard widgets               |
| **UI**     | `Divider`             | `src/components/ui/Divider.tsx`                 | Section separators              |
| **UI**     | `LoadingScreen`       | `src/components/ui/LoadingScreen.tsx`           | Initial loading states          |
| **UI**     | `SearchBar`           | `src/components/ui/SearchBar.tsx`               | Students list, exams filter     |
| **Forms**  | `FormInput`           | `src/components/forms/FormInput.tsx`            | All text inputs                 |
| **Forms**  | `FormSelect`          | `src/components/forms/FormSelect.tsx`           | Dropdowns (grade, status, etc.) |
| **Layout** | `ScreenWrapper`       | `src/components/layout/ScreenWrapper.tsx`       | Every screen                    |
| **Layout** | `KeyboardAwareView`   | `src/components/layout/KeyboardAwareView.tsx`   | All form screens                |
| **Layout** | `OfflineBanner`       | `src/components/layout/OfflineBanner.tsx`       | Mounted in ScreenWrapper        |
| **Domain** | `StudentCard`         | `src/components/domain/StudentCard.tsx`         | Students list                   |
| **Domain** | `ExamCard`            | `src/components/domain/ExamCard.tsx`            | Exams list                      |
| **Domain** | `InvoiceRow`          | `src/components/domain/InvoiceRow.tsx`          | Finance list                    |
| **Domain** | `SubjectResultRow`    | `src/components/domain/SubjectResultRow.tsx`    | Exam detail                     |
| **Domain** | `NotificationItem`    | `src/components/domain/NotificationItem.tsx`    | Notifications list              |
| **Domain** | `GradeBadge`          | `src/components/domain/GradeBadge.tsx`          | Exam status display             |
| **Domain** | `RoleBadge`           | `src/components/domain/RoleBadge.tsx`           | Profile screen                  |
| **Domain** | `AdminDashboard`      | `src/components/domain/AdminDashboard.tsx`      | Home screen (Admin role)        |
| **Domain** | `TeacherDashboard`    | `src/components/domain/TeacherDashboard.tsx`    | Home screen (Teacher role)      |
| **Domain** | `ParentDashboard`     | `src/components/domain/ParentDashboard.tsx`     | Home screen (Parent role)       |
| **Domain** | `StudentDashboard`    | `src/components/domain/StudentDashboard.tsx`    | Home screen (Student role)      |
| **Domain** | `AccountantDashboard` | `src/components/domain/AccountantDashboard.tsx` | Home screen (Accountant role)   |
| **Domain** | `RevenueChart`        | `src/components/domain/RevenueChart.tsx`        | Admin dashboard                 |

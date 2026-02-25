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

/** Status → color mapping for badges */
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

/** NEB Grade → color mapping */
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

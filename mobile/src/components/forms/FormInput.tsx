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

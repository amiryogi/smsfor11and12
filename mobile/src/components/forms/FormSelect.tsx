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

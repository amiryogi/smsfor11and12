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

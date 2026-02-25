import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../src/api/client";
import { FormInput } from "../../src/components/forms/FormInput";
import { Button } from "../../src/components/ui/Button";
import { KeyboardAwareView } from "../../src/components/layout/KeyboardAwareView";

const forgotSchema = z.object({
  email: z.string().email("Valid email required"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordScreen() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (body: ForgotForm) =>
      apiClient.post("/auth/forgot-password", body).then((r) => r.data),
    onSuccess: () => {
      Alert.alert(
        "Email Sent",
        "If this email is registered, you will receive a password reset link.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  return (
    <KeyboardAwareView>
      <View className="flex-1 justify-center px-6 py-16">
        <Text className="text-2xl font-sans-bold text-gray-900 dark:text-gray-100 text-center mb-2">
          Forgot Password
        </Text>
        <Text className="text-base font-sans text-muted text-center mb-8">
          Enter your email to receive a reset link
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Email"
              placeholder="you@school.np"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Button
          title="Send Reset Link"
          onPress={handleSubmit((data) => mutation.mutate(data))}
          loading={mutation.isPending}
          className="mt-4"
        />

        <Button
          title="Back to Login"
          onPress={() => router.back()}
          variant="ghost"
          className="mt-2"
        />

        {mutation.isError && (
          <Text className="text-danger text-center mt-4 font-sans">
            {(mutation.error as { message?: string })?.message ||
              "Something went wrong. Please try again."}
          </Text>
        )}
      </View>
    </KeyboardAwareView>
  );
}

export default ForgotPasswordScreen;

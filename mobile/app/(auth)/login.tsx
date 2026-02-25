import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "../../src/hooks/useAuth";
import { FormInput } from "../../src/components/forms/FormInput";
import { Button } from "../../src/components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => router.replace("/(tabs)"),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-sans-bold text-primary-800 dark:text-primary-200 text-center mb-2">
          NEB School ERP
        </Text>
        <Text className="text-base font-sans text-muted text-center mb-8">
          Sign in to your account
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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          title="Sign In"
          onPress={handleSubmit(onSubmit)}
          loading={loginMutation.isPending}
          className="mt-4"
        />

        <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
          <Text className="text-primary-600 text-center mt-4 font-sans-medium">
            Forgot Password?
          </Text>
        </Pressable>

        {loginMutation.isError && (
          <Text className="text-danger text-center mt-4 font-sans">
            {(loginMutation.error as { message?: string })?.message ||
              "Login failed. Please try again."}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;

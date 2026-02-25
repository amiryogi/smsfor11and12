import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useChangePassword } from "../../../src/hooks/useAuth";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { KeyboardAwareView } from "../../../src/components/layout/KeyboardAwareView";
import { FormInput } from "../../../src/components/forms/FormInput";
import { Button } from "../../../src/components/ui/Button";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export function ChangePasswordScreen() {
  const router = useRouter();
  const changePassword = useChangePassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ChangePasswordForm) => {
    changePassword.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Password changed successfully", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(
            "Error",
            error?.response?.data?.message ?? "Failed to change password",
          );
        },
      },
    );
  };

  return (
    <ScreenWrapper title="Change Password" showBack>
      <KeyboardAwareView>
        <View className="p-4 gap-4">
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Current Password"
                placeholder="Enter current password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.currentPassword?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="New Password"
                placeholder="Enter new password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Confirm New Password"
                placeholder="Re-enter new password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                required
              />
            )}
          />

          <Button
            title="Change Password"
            onPress={handleSubmit(onSubmit)}
            loading={changePassword.isPending}
            className="mt-4"
          />
        </View>
      </KeyboardAwareView>
    </ScreenWrapper>
  );
}

export default ChangePasswordScreen;

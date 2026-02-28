import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FormField } from "../../components/ui/FormField";
import { apiClient } from "../../api/client";
import { toast } from "sonner";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    try {
      await apiClient.post("/auth/forgot-password", data);
      setSent(true);
      toast.success("Password reset email sent");
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-600">SMS ERP</h1>
          <p className="mt-2 text-sm text-gray-500">Reset your password</p>
        </div>
        <div className="card">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-xl">✉️</span>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Check your email
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                If an account with that email exists, we've sent password reset
                instructions.
              </p>
              <Link to="/login" className="btn-primary inline-block">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Forgot Password
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Enter your email address and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  label="Email"
                  error={errors.email?.message}
                  required
                >
                  <input
                    type="email"
                    {...register("email")}
                    className="input"
                    placeholder="admin@school.edu.np"
                    autoFocus
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

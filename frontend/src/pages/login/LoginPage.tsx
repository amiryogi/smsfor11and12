import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useLogin } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/auth.store";
import { FormField } from "../../components/ui/FormField";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await login.mutateAsync(data);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-600">SMS ERP</h1>
          <p className="mt-2 text-sm text-gray-500">
            NEB +2 School Management System
          </p>
        </div>
        <div className="card">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Sign In</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Email" error={errors.email?.message} required>
              <input
                type="email"
                {...register("email")}
                className="input"
                placeholder="admin@school.edu.np"
                autoFocus
              />
            </FormField>
            <FormField
              label="Password"
              error={errors.password?.message}
              required
            >
              <input
                type="password"
                {...register("password")}
                className="input"
                placeholder="••••••••"
              />
            </FormField>
            <button
              type="submit"
              disabled={isSubmitting || login.isPending}
              className="btn-primary w-full"
            >
              {isSubmitting || login.isPending ? "Signing in..." : "Sign In"}
            </button>
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

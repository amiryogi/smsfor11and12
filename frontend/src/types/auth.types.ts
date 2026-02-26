import type { Role } from "./api.types";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  profilePicS3Key?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

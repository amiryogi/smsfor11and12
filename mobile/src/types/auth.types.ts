export interface AuthUser {
  id: string;
  email: string;
  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "TEACHER"
    | "ACCOUNTANT"
    | "PARENT"
    | "STUDENT";
  schoolId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicUrl?: string;
  schoolName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

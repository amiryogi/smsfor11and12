import type { Role } from "./api.types";

export interface User {
  id: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profilePicS3Key: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
}

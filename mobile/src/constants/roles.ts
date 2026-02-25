export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  ACCOUNTANT: "ACCOUNTANT",
  PARENT: "PARENT",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Check if a role has admin-level permissions */
export function isAdminRole(role: string): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

/** Check if a role can manage students */
export function canManageStudents(role: string): boolean {
  return isAdminRole(role) || role === ROLES.TEACHER;
}

/** Check if a role can manage finance */
export function canManageFinance(role: string): boolean {
  return isAdminRole(role) || role === ROLES.ACCOUNTANT;
}

/** Check if a role can enter marks */
export function canEnterMarks(role: string): boolean {
  return isAdminRole(role) || role === ROLES.TEACHER;
}

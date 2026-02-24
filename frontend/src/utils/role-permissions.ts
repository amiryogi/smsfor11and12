import type { Role } from "../types/api.types";

const roleMenuMap: Record<Role, string[]> = {
  SUPER_ADMIN: [
    "dashboard",
    "schools",
    "users",
    "students",
    "academic",
    "exams",
    "finance",
    "reports",
    "settings",
  ],
  ADMIN: [
    "dashboard",
    "users",
    "students",
    "academic",
    "exams",
    "finance",
    "reports",
    "settings",
  ],
  TEACHER: ["dashboard", "students", "exams"],
  ACCOUNTANT: ["dashboard", "finance", "reports"],
  PARENT: ["dashboard", "students", "exams", "finance"],
  STUDENT: ["dashboard", "exams"],
};

export function getMenuItemsForRole(role: Role): string[] {
  return roleMenuMap[role] ?? [];
}

export function hasMenuAccess(role: Role, menuKey: string): boolean {
  return getMenuItemsForRole(role).includes(menuKey);
}

import type { NotificationType } from "./api.types";

export interface Notification {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  entityName: string | null;
  entityId: string | null;
  createdAt: string;
}

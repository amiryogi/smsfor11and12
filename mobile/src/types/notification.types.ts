export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  readAt?: string | null;
  referenceId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

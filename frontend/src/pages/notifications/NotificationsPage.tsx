import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "../../hooks/useNotifications";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDateTime } from "../../utils/format-date";
import { useMarkNotificationRead } from "../../hooks/useNotifications";
import type { Notification } from "../../types/notification.types";

export function NotificationsPage() {
  const { data, isLoading, isError, refetch } = useNotifications({
    page: 1,
    limit: 50,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState
        message="Failed to load notifications"
        onRetry={() => refetch()}
      />
    );

  const notifications: Notification[] = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Notifications"
        action={
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="btn-secondary"
          >
            Mark All Read
          </button>
        }
      />
      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card flex cursor-pointer items-start gap-4 transition-colors ${
                !n.isRead ? "border-l-4 border-l-primary-500 bg-primary-50" : ""
              }`}
              onClick={() => {
                if (!n.isRead) markRead.mutate(n.id);
              }}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <span className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

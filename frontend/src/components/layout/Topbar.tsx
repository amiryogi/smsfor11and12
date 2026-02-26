import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { useUiStore } from "../../stores/ui.store";
import { useLogout } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

export function Topbar() {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: notifications } = useNotifications({ isRead: false, limit: 1 });

  const unreadCount = notifications?.meta?.total ?? 0;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate("/login"),
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/notifications")}
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/profile")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-200"
            title="My Profile"
          >
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

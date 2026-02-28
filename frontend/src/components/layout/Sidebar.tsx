import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { useUiStore } from "../../stores/ui.store";
import { getMenuItemsForRole } from "../../utils/role-permissions";
import type { Role } from "../../types/api.types";

interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon: string;
}

const allMenuItems: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", path: "/", icon: "📊" },
  { key: "schools", label: "Schools", path: "/schools", icon: "🏫" },
  { key: "users", label: "Users", path: "/users", icon: "👥" },
  { key: "students", label: "Students", path: "/students", icon: "🎓" },
  { key: "academic", label: "Academic", path: "/academic/years", icon: "📅" },
  { key: "attendance", label: "Attendance", path: "/attendance", icon: "✅" },
  { key: "exams", label: "Exams", path: "/exams", icon: "📝" },
  { key: "finance", label: "Finance", path: "/finance/invoices", icon: "💰" },
  {
    key: "reports",
    label: "Reports",
    path: "/reports/finance/ledger",
    icon: "📈",
  },
  { key: "admin", label: "Queue Admin", path: "/admin/queues", icon: "🔧" },
  { key: "settings", label: "Settings", path: "/settings", icon: "⚙️" },
];

export function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarOpen } = useUiStore();

  const allowedKeys = user ? getMenuItemsForRole(user.role as Role) : [];
  const visibleItems = allMenuItems.filter((item) =>
    allowedKeys.includes(item.key),
  );

  if (!sidebarOpen) return null;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6 dark:border-gray-700">
        <span className="text-xl font-bold text-primary-600">SMS</span>
        <span className="text-sm text-gray-500">ERP</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="truncate text-xs text-gray-500">
          {user?.role?.replace(/_/g, " ")}
        </p>
      </div>
    </aside>
  );
}

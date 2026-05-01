import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@plp/shared';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/programs', label: 'Programs', icon: '📋' },
  { path: '/anchors', label: 'Anchors', icon: '🏢' },
  { path: '/loans', label: 'Loans', icon: '💰' },
  { path: '/reports', label: 'Reports', icon: '📈' },
  { path: '/audit', label: 'Audit Trail', icon: '🔍' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-700">PLP Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Program Lending Platform</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">{user?.fullName}</div>
          <div className="text-xs text-gray-400">{user?.role}</div>
          <button
            onClick={logout}
            className="mt-2 text-xs text-red-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

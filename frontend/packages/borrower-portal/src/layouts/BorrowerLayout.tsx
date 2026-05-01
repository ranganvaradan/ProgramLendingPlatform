import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@plp/shared';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/request-loan', label: 'Request Loan', icon: '💰' },
  { path: '/my-loans', label: 'My Loans', icon: '📋' },
  { path: '/invoice-discounting', label: 'Invoice Discounting', icon: '🧾' },
  { path: '/repayments', label: 'Repayments', icon: '💳' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

export default function BorrowerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-blue-800 text-white flex flex-col">
        <div className="p-4 border-b border-blue-700">
          <h1 className="text-lg font-bold">Borrower Portal</h1>
          <p className="text-blue-300 text-xs mt-1">{user?.email}</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
                location.pathname === item.path
                  ? 'bg-blue-700 text-white font-medium'
                  : 'text-blue-200 hover:bg-blue-700'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-700">
          <button onClick={logout} className="text-sm text-blue-300 hover:text-white transition-colors">
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

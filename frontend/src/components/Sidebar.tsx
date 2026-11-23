import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, LogOut, ChevronDown, Menu, X, Settings
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserInitials } from '../utils';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Inventory', href: '/inventory', icon: Package },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <span className="font-bold text-primary-text text-base leading-none">Snack</span>
            <span className="font-bold text-primary text-base leading-none">Overflow</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:bg-soft-yellow hover:text-primary-text'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/activity"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              location.pathname === '/activity'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:bg-soft-yellow hover:text-primary-text'
            }`}
          >
            <Settings size={18} />
            Activity Log
          </Link>
        )}
      </nav>

      {/* Role badge */}
      {isAdmin && (
        <div className="px-4 pb-2">
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-primary">Administrator</p>
            <p className="text-xs text-secondary">Full access enabled</p>
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-soft-yellow transition-colors">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user ? getUserInitials(user.name) : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-text truncate">{user?.name}</p>
            <p className="text-xs text-secondary truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-primary-text text-sm">Snack<span className="text-primary">Overflow</span></span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-secondary hover:bg-soft-yellow rounded-lg transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-25 w-64 bg-white shadow-xl transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ zIndex: 25 }}
      >
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-60 xl:w-64 bg-white border-r border-border fixed top-0 left-0 bottom-0 z-10">
        <SidebarContent />
      </div>
    </>
  );
}

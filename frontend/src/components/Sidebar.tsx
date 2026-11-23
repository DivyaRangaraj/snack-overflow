import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, LogOut, Menu, X, History,
  ShieldCheck, User as UserIcon, Sparkles
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
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link
          to="/"
          className="flex items-center gap-3 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-black text-base">S</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-primary-text text-base tracking-tight leading-none">
                Snack
              </span>
              <span className="font-extrabold text-primary text-base tracking-tight leading-none">
                Overflow
              </span>
            </div>
            <p className="text-[10px] text-secondary font-semibold uppercase tracking-wider mt-1">
              Office Pantry System
            </p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            Menu
          </p>
        </div>

        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:bg-soft-yellow hover:text-primary-text'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-secondary'} />
              <span>{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="px-3 pt-4 pb-2">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                Administration
              </p>
            </div>
            <Link
              to="/activity"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                location.pathname === '/activity'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:bg-soft-yellow hover:text-primary-text'
              }`}
            >
              <History size={18} className={location.pathname === '/activity' ? 'text-white' : 'text-secondary'} />
              <span>Activity Log</span>
            </Link>
          </>
        )}
      </div>

      {/* User Profile Card */}
      <div className="p-3 border-t border-border bg-warm/30">
        <div className="bg-white rounded-2xl border border-border p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-soft-yellow border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-extrabold text-sm shadow-xs">
                {user ? getUserInitials(user.name) : 'U'}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  isAdmin ? 'bg-primary' : 'bg-green-500'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary-text truncate" title={user?.name}>
                {user?.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary bg-soft-yellow px-1.5 py-0.2 rounded-md">
                    <ShieldCheck size={10} /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.2 rounded-md">
                    <UserIcon size={10} /> Member
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-secondary hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-border px-4 py-3 flex items-center justify-between shadow-xs">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-primary-text text-sm">
            Snack<span className="text-primary">Overflow</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-secondary hover:bg-soft-yellow rounded-xl transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-white border-r border-border fixed top-0 left-0 bottom-0 z-10">
        <SidebarContent />
      </aside>
    </>
  );
}

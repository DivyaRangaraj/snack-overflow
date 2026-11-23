import { Sidebar } from '../components/Sidebar';
import { NotificationCenter } from '../components/NotificationCenter';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-warm">
      <Sidebar />

      {/* Main content area */}
      <main className="lg:ml-60 xl:ml-64 pt-16 lg:pt-0 min-h-screen flex flex-col">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-end px-8 py-4 border-b border-border/60 bg-white/60 backdrop-blur-xs sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

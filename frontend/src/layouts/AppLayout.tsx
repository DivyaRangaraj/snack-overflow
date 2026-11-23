import { Sidebar } from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-warm">
      <Sidebar />
      {/* Desktop main content offset */}
      <main className="lg:ml-60 xl:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

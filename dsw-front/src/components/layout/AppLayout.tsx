import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC<{ allowedRoles: string[]; pageTitle: string }> = ({
  allowedRoles,
  pageTitle,
}) => {
  const { user, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium text-[var(--text-secondary)]">Loading DSW Portal...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to default route per role
    const dest = user.role === 'super_admin' 
      ? '/admin/dashboard' 
      : user.role === 'department_head' 
      ? '/head/dashboard' 
      : '/faculty/dashboard';
    return <Navigate to={dest} replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-primary)] relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Component (Handles both Desktop Sticky and Mobile Off-canvas Drawer) */}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title={pageTitle}
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

// Public & Auth Pages (Lazy Loaded)
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const LandingPage = React.lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const PublicFeedbackFormPage = React.lazy(() => import('./pages/public/PublicFeedbackFormPage').then(m => ({ default: m.PublicFeedbackFormPage })));

// VC Office Admin Pages (Lazy Loaded)
const AdminDashboardPage = React.lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const DepartmentsPage = React.lazy(() => import('./pages/admin/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const HodsPage = React.lazy(() => import('./pages/admin/HodsPage').then(m => ({ default: m.HodsPage })));
const AdminRequestsPage = React.lazy(() => import('./pages/admin/AdminRequestsPage').then(m => ({ default: m.AdminRequestsPage })));
const FacultyPage = React.lazy(() => import('./pages/admin/FacultyPage').then(m => ({ default: m.FacultyPage })));
const EventsPage = React.lazy(() => import('./pages/admin/EventsPage').then(m => ({ default: m.EventsPage })));
const TasksPage = React.lazy(() => import('./pages/admin/TasksPage').then(m => ({ default: m.TasksPage })));
const AnnouncementsPage = React.lazy(() => import('./pages/admin/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const QueriesPage = React.lazy(() => import('./pages/admin/QueriesPage').then(m => ({ default: m.QueriesPage })));
const FeedbackPage = React.lazy(() => import('./pages/admin/FeedbackPage').then(m => ({ default: m.FeedbackPage })));
const StaffLeaderboardPage = React.lazy(() => import('./pages/admin/StaffLeaderboardPage').then(m => ({ default: m.StaffLeaderboardPage })));

// Department Head Pages (Lazy Loaded)
const HeadDashboardPage = React.lazy(() => import('./pages/head/HeadDashboardPage').then(m => ({ default: m.HeadDashboardPage })));
const HeadTasksPage = React.lazy(() => import('./pages/head/HeadTasksPage').then(m => ({ default: m.HeadTasksPage })));

// Shared Pages (Lazy Loaded)
const DepartmentLeaderboardPage = React.lazy(() => import('./pages/shared/DepartmentLeaderboardPage').then(m => ({ default: m.DepartmentLeaderboardPage })));
const EventReportsListPage = React.lazy(() => import('./pages/shared/EventReportsListPage').then(m => ({ default: m.EventReportsListPage })));
const EventReportFormPage = React.lazy(() => import('./pages/shared/EventReportFormPage').then(m => ({ default: m.EventReportFormPage })));

const PageLoader: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
    <div className="relative mb-4">
      <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-400">
        GU
      </div>
    </div>
    <p className="text-xs font-medium text-slate-400">Loading module...</p>
  </div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Landing & Authentication Portals */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/vc/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/head/login" element={<LoginPage />} />
              <Route path="/faculty/login" element={<Navigate to="/head/login" replace />} />
              <Route path="/feedback/:id" element={<PublicFeedbackFormPage />} />

              {/* 1. VC Office Executive Portal (/admin & /vc alias) */}
              <Route path="/admin" element={<AppLayout allowedRoles={['super_admin']} pageTitle="VC Office Executive Portal" />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="hods" element={<HodsPage />} />
                <Route path="faculty" element={<FacultyPage />} />
                <Route path="events/reports" element={<EventReportsListPage />} />
                <Route path="events/reports/new" element={<EventReportFormPage />} />
                <Route path="events/reports/:id" element={<EventReportFormPage />} />
                <Route path="department-leaderboard" element={<DepartmentLeaderboardPage />} />
                <Route path="leaderboard/staff" element={<StaffLeaderboardPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="queries" element={<QueriesPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="requests" element={<AdminRequestsPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* /vc route aliases mapping to /admin */}
              <Route path="/vc" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/vc/*" element={<Navigate to="/admin/dashboard" replace />} />

              {/* 2. Department Head Portal */}
              <Route path="/head" element={<AppLayout allowedRoles={['department_head', 'super_admin']} pageTitle="Department Head Executive Portal" />}>
                <Route path="dashboard" element={<HeadDashboardPage />} />
                <Route path="tasks" element={<HeadTasksPage />} />
                <Route path="department-leaderboard" element={<DepartmentLeaderboardPage />} />
                <Route path="leaderboard" element={<StaffLeaderboardPage />} />
                <Route path="events/reports" element={<EventReportsListPage />} />
                <Route path="events/reports/new" element={<EventReportFormPage />} />
                <Route path="events/reports/:id" element={<EventReportFormPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="queries" element={<QueriesPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Legacy / Faculty redirect */}
              <Route path="/faculty/*" element={<Navigate to="/head/dashboard" replace />} />

              {/* Root Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

// Public & Auth Pages (Lazy Loaded)
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const LandingPage = React.lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const PublicFeedbackFormPage = React.lazy(() => import('./pages/public/PublicFeedbackFormPage').then(m => ({ default: m.PublicFeedbackFormPage })));

// Admin Pages (Lazy Loaded)
const AdminDashboardPage = React.lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminRequestsPage = React.lazy(() => import('./pages/admin/AdminRequestsPage').then(m => ({ default: m.AdminRequestsPage })));
const FacultyPage = React.lazy(() => import('./pages/admin/FacultyPage').then(m => ({ default: m.FacultyPage })));
const EventsPage = React.lazy(() => import('./pages/admin/EventsPage').then(m => ({ default: m.EventsPage })));
const TasksPage = React.lazy(() => import('./pages/admin/TasksPage').then(m => ({ default: m.TasksPage })));
const AnnouncementsPage = React.lazy(() => import('./pages/admin/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const QueriesPage = React.lazy(() => import('./pages/admin/QueriesPage').then(m => ({ default: m.QueriesPage })));
const FeedbackPage = React.lazy(() => import('./pages/admin/FeedbackPage').then(m => ({ default: m.FeedbackPage })));
const StaffLeaderboardPage = React.lazy(() => import('./pages/admin/StaffLeaderboardPage').then(m => ({ default: m.StaffLeaderboardPage })));

// Faculty Pages (Lazy Loaded)
const FacultyDashboardPage = React.lazy(() => import('./pages/faculty/FacultyDashboardPage').then(m => ({ default: m.FacultyDashboardPage })));
const MyTasksPage = React.lazy(() => import('./pages/faculty/MyTasksPage').then(m => ({ default: m.MyTasksPage })));

// Shared Pages (Lazy Loaded)
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
              <Route path="/faculty/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/feedback/:id" element={<PublicFeedbackFormPage />} />

              {/* VC Office Admin Portal */}
              <Route path="/admin" element={<AppLayout allowedRoles={['super_admin']} pageTitle="VC Office Administration Portal" />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="requests" element={<AdminRequestsPage />} />
                <Route path="faculty" element={<FacultyPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/reports" element={<EventReportsListPage />} />
                <Route path="events/reports/new" element={<EventReportFormPage />} />
                <Route path="events/reports/:id" element={<EventReportFormPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="queries" element={<QueriesPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="leaderboard/staff" element={<StaffLeaderboardPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Faculty Portal */}
              <Route path="/faculty" element={<AppLayout allowedRoles={['faculty']} pageTitle="Faculty Workstation Portal" />}>
                <Route path="dashboard" element={<FacultyDashboardPage />} />
                <Route path="events/reports" element={<EventReportsListPage />} />
                <Route path="events/reports/new" element={<EventReportFormPage />} />
                <Route path="events/reports/:id" element={<EventReportFormPage />} />
                <Route path="tasks" element={<MyTasksPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="queries" element={<QueriesPage />} />
                <Route path="leaderboard" element={<StaffLeaderboardPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

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

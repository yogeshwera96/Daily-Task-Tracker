import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Lazy loaded page components
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

import DeveloperDashboard from '../pages/developer/DeveloperDashboard';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import TasksPage from '../pages/developer/TasksPage';
import EodReportPage from '../pages/developer/EodReportPage';
import ProfilePage from '../pages/developer/ProfilePage';
import ProductivityPage from '../pages/developer/ProductivityPage';

import TeamReportsPage from '../pages/manager/TeamReportsPage';
import TeamAnalyticsPage from '../pages/manager/TeamAnalyticsPage';
import ManagerTasksPage from '../pages/manager/ManagerTasksPage';

import UserManagementPage from '../pages/admin/UserManagementPage';
import ProjectPage from '../pages/admin/ProjectPage';
import SettingsPage from '../pages/admin/SettingsPage';
import HolidayPage from '../pages/admin/HolidayPage';

import NotFoundPage from '../pages/errors/NotFoundPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';

const DashboardDispatcher = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'MANAGER') return <ManagerDashboard />;
  return <DeveloperDashboard />;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public / Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Authenticated / Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardDispatcher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute allowedRoles={['DEVELOPER']}>
              <TasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eod"
          element={
            <ProtectedRoute allowedRoles={['DEVELOPER']}>
              <EodReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productivity"
          element={
            <ProtectedRoute allowedRoles={['DEVELOPER']}>
              <ProductivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/team-reports"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <TeamReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-tasks"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <ManagerTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-analytics"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <TeamAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/holidays"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <HolidayPage />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
export default AppRouter;

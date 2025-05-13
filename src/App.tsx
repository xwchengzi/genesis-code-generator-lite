
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Authentication pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ExpiredPage from '@/pages/ExpiredPage';

// User layout and pages
import UserLayout from '@/components/UserLayout';
import DashboardPage from '@/pages/user/DashboardPage';
import CoursesPage from '@/pages/user/CoursesPage';
import CourseDetailPage from '@/pages/user/CourseDetailPage';
import VideoPlayerPage from '@/pages/user/VideoPlayerPage';
import ProfilePage from '@/pages/user/ProfilePage';
import SearchPage from '@/pages/user/SearchPage';

// Admin layout and pages
import AdminLayout from '@/components/AdminLayout';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import SubjectManagementPage from '@/pages/admin/SubjectManagementPage';
import CourseManagementPage from '@/pages/admin/CourseManagementPage';
import ChapterManagementPage from '@/pages/admin/ChapterManagementPage';

// 404 page
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Auth Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/expired" element={<ExpiredPage />} />
            
            {/* Redirect root to login or dashboard */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* User Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:id" element={<CourseDetailPage />} />
              <Route path="courses/:courseId/chapters/:chapterId" element={
                <ProtectedRoute requireValidAccess>
                  <VideoPlayerPage />
                </ProtectedRoute>
              } />
              <Route path="search" element={<SearchPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="subjects" element={<SubjectManagementPage />} />
              <Route path="courses" element={<CourseManagementPage />} />
              <Route path="chapters" element={<ChapterManagementPage />} />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

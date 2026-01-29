import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Auth/login';
import EmailVerification from './pages/Auth/Email';
import OtpVerification from './pages/Auth/otp';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/resetpassword';
import TeacherHome from './pages/Teacher/TeacherHome';
import TeacherAttendance from './pages/Teacher/TeacherAttendance';
import TeacherAnnouncements from './pages/Teacher/TeacherAnnouncements';
import TeacherTimetable from './pages/Teacher/TeacherTimetable';
import ViewStudents from './pages/Teacher/ViewStudents';
import TeacherAdvisor from './pages/Teacher/TeacherAdvisor';
import StudentHome from './pages/Student/StudentHome';
import StudentAttendance from './pages/Student/StudentAttendance';
import StudentAnnouncement from './pages/Student/StudentAnnouncement';
import StudentTimetable from './pages/Student/StudentTimetable';
import ChangePassword from './pages/Student/ChangePassword';

import { AuthProvider, useAuth } from './contexts/AuthContext';


import { useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/signin" replace />;
  }

  // 🔐 EMAIL VERIFICATION GATE (ALLOW /email ITSELF)
  if (
    user.role === "student" &&
    !user.email_verified &&
    location.pathname !== "/email" &&
    location.pathname !== "/otp-verification" &&
    location.pathname !== "/change-password"
  ) {
    return <Navigate to="/email" replace />;
  }

  return children;
};



// (Signin page protection)

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    if (user.role === "student") {
      if (!user.email_verified) {
        return <Navigate to="/email" replace />;
      }
      return <Navigate to="/student" replace />;
    }

    if (user.role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }
  }

  return children;
};


const LandingRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/signin" replace />;

  if (user.role === "student") {
    if (!user.email_verified) {
      return <Navigate to="/email" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  if (user.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }

  return <Navigate to="/signin" replace />;
};



const AppRoutes = () => (
  <Routes>
    {/* Landing */}
    <Route path="/" element={<LandingRedirect />} />

    {/* Auth */}
    <Route
      path="/signin"
      element={
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      }
    />

    <Route
      path="/email"
      element={
        <ProtectedRoute allowedRoles={['student']}>
          <EmailVerification />
        </ProtectedRoute>
      }
    />

    <Route path="/otp-verification" element={<OtpVerification />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/otp/reset-password" element={<ResetPassword />} />

    {/* Teacher */}
    <Route
      path="/teacher"
      element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherHome />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/attendance"
      element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherAttendance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/timetable"
      element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherTimetable />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/announcement"
      element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherAnnouncements />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/view-students"
      element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <ViewStudents />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/advisor"
      element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherAdvisor />
        </ProtectedRoute>
      }
    />

    {/* Student */}
    <Route
      path="/student"
      element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentHome />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/attendance"
      element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentAttendance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/timetable"
      element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentTimetable />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/announcement"
      element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentAnnouncement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/change-password"
      element={
        <ProtectedRoute allowedRoles={['student']}>
          <ChangePassword />
        </ProtectedRoute>
      }
    />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);



function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

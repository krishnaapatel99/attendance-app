// src/App.jsx
import { useState } from 'react';
import './App.css';
import Login from './pages/Auth/login';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import TeacherAttendance from './pages/Teacher/TeacherAttendance';
import TeacherHome from './pages/Teacher/TeacherHome';
import TeacherAnnouncements from './pages/Teacher/TeacherAnnouncements';
import TeacherTimetable from './pages/Teacher/TeacherTimetable';
import ViewStudents from './pages/Teacher/ViewStudents';
import StudentHome from './pages/Student/StudentHome';
import StudentAttendance from './pages/Student/StudentAttendance';
import StudentAnnouncement from './pages/Student/StudentAnnouncement';
import StudentTimetable from './pages/Student/StudentTimetable';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import EmailVerification from './pages/Auth/Email';
import OtpVerification from './pages/Auth/otp';
// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Checking session...</div>
      </div>
    );
  }

  // Session invalid → redirect to login
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Role-based protection
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/signin" replace />;
  }

  // For email verification page, only allow if email is not verified
  if (window.location.pathname === '/email' && user.email_verified) {
    return <Navigate to="/student" replace />;
  }

  return children;
};

// App Routes
const AppRoutes = () => (
  <Routes>
    <Route path="/signin" element={<Login />} />
    <Route path="/" element={<Navigate to="/signin" replace />} />
 <Route path="/email" element={<EmailVerification />} />
    <Route path="/otp-verification" element={<OtpVerification />} />
    {/* Teacher Routes */}
    <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHome /></ProtectedRoute>} />
    <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
    <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTimetable /></ProtectedRoute>} />
    <Route path="/teacher/announcement" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAnnouncements /></ProtectedRoute>} />
    <Route path="/teacher/view-students" element={<ViewStudents />} />
    {/* Student Routes */}
    <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>} />
    <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
    <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['student']}><StudentTimetable /></ProtectedRoute>} />
    <Route path="/student/announcement" element={<ProtectedRoute allowedRoles={['student']}><StudentAnnouncement /></ProtectedRoute>} />
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

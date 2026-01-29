import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';

/* ========= AUTH PAGES ========= */
import Login from './pages/Auth/login';
import EmailVerification from './pages/Auth/Email';
import OtpVerification from './pages/Auth/otp';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/resetpassword';

/* ========= STUDENT ========= */
import StudentHome from './pages/Student/StudentHome';
import StudentAttendance from './pages/Student/StudentAttendance';
import StudentAnnouncement from './pages/Student/StudentAnnouncement';
import StudentTimetable from './pages/Student/StudentTimetable';
import ChangePassword from './pages/Student/ChangePassword';

/* ========= TEACHER ========= */
import TeacherHome from './pages/Teacher/TeacherHome';
import TeacherAttendance from './pages/Teacher/TeacherAttendance';
import TeacherAnnouncements from './pages/Teacher/TeacherAnnouncements';
import TeacherTimetable from './pages/Teacher/TeacherTimetable';
import ViewStudents from './pages/Teacher/ViewStudents';
import TeacherAdvisor from './pages/Teacher/TeacherAdvisor';

/* ======================================================
   PROTECTED ROUTE (ONLY GUARD IN THE APP)
====================================================== */
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

  // Not logged in
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Role mismatch
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/signin" replace />;
  }

  // Student email verification gate
  if (
    user.role === 'student' &&
    !user.email_verified &&
    !['/email', '/otp-verification', '/change-password'].includes(
      location.pathname
    )
  ) {
    return <Navigate to="/email" replace />;
  }

  return children;
};

/* ======================================================
   SMART ROOT REDIRECT (/)
====================================================== */
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" replace />;

  if (user.role === 'teacher') {
    return <Navigate to="/teacher" replace />;
  }

  if (user.role === 'student') {
    if (!user.email_verified) {
      return <Navigate to="/email" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return <Navigate to="/signin" replace />;
};

/* ======================================================
   ROUTES
====================================================== */
const AppRoutes = () => (
  <Routes>
    {/* Root */}
    <Route path="/" element={<HomeRedirect />} />

    {/* Public / Recovery */}
    <Route path="/signin" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/otp-verification" element={<OtpVerification />} />
    <Route path="/otp/reset-password" element={<ResetPassword />} />

    {/* Student onboarding */}
    <Route
      path="/email"
      element={
        <ProtectedRoute allowedRoles={['student']}>
          <EmailVerification />
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

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

/* ======================================================
   APP
====================================================== */
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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents  from './pages/admin/Students'
import AdminFaculty   from './pages/admin/Faculty'
import AdminNotices   from './pages/admin/Notices'

// Faculty pages
import FacultyDashboard   from './pages/faculty/Dashboard'
import FacultyAttendance  from './pages/faculty/Attendance'
import FacultyAssignments from './pages/faculty/Assignments'
import FacultyMarks       from './pages/faculty/Marks'

// Student pages
import StudentDashboard   from './pages/student/Dashboard'
import MyAttendance       from './pages/student/MyAttendance'
import MyMarks            from './pages/student/MyMarks'
import MyAssignments      from './pages/student/MyAssignments'
import AITools            from './pages/student/AITools'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary animate-pulse flex items-center justify-center">
          <span className="text-white text-xl">🎓</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">Loading SmartCampus...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin')   return <Navigate to="/admin"   replace />
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />
  if (user.role === 'student') return <Navigate to="/student" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  // Initialize dark mode from localStorage
  if (typeof window !== 'undefined') {
    const dark = localStorage.getItem('sc_theme') === 'dark' ||
      (!localStorage.getItem('sc_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="faculty"  element={<AdminFaculty />} />
            <Route path="notices"  element={<AdminNotices />} />
          </Route>

          {/* Faculty routes */}
          <Route path="/faculty" element={
            <ProtectedRoute roles={['faculty']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<FacultyDashboard />} />
            <Route path="attendance"  element={<FacultyAttendance />} />
            <Route path="assignments" element={<FacultyAssignments />} />
            <Route path="marks"       element={<FacultyMarks />} />
          </Route>

          {/* Student routes */}
          <Route path="/student" element={
            <ProtectedRoute roles={['student']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance"  element={<MyAttendance />} />
            <Route path="marks"       element={<MyMarks />} />
            <Route path="assignments" element={<MyAssignments />} />
            <Route path="ai-tools"    element={<AITools />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

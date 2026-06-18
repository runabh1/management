import { useState, useEffect } from 'react'
import { CalendarCheck, ClipboardList, BarChart3, Users, TrendingUp, BookOpen } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/StatCard'
import { AttendanceBarChart } from '../../components/Charts'
import toast from 'react-hot-toast'

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/faculty/me'),
      api.get('/assignments'),
      api.get('/students')
    ]).then(([profRes, assRes, stuRes]) => {
      setProfile(profRes.data)
      setAssignments(assRes.data)
      setStudents(stuRes.data)
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const overdue = assignments.filter(a => new Date(a.due_date) < new Date())

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">{profile?.department} · {profile?.subject}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="My Assignments" value={assignments.length} icon={ClipboardList} color="primary" subtitle={`${overdue.length} overdue`} />
        <StatCard title="Total Students" value={students.length}   icon={Users}         color="success" subtitle="In your classes" />
        <StatCard title="Pending Reviews" value={overdue.length}   icon={BarChart3}      color={overdue.length > 0 ? 'danger' : 'info'} subtitle="Past due date" />
      </div>

      {/* Recent assignments */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary-500" /> Recent Assignments
          </h3>
        </div>
        {assignments.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No assignments posted yet</p>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 5).map(a => {
              const isOverdue = new Date(a.due_date) < new Date()
              return (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.subject}</p>
                  </div>
                  <span className={`badge flex-shrink-0 ${isOverdue ? 'badge-danger' : 'badge-success'}`}>
                    {isOverdue ? 'Overdue' : `Due ${new Date(a.due_date).toLocaleDateString('en-IN')}`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

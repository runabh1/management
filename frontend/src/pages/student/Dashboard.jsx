import { useState, useEffect } from 'react'
import { GraduationCap, CalendarCheck, BarChart3, BookOpen, Bell, Sparkles, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import StatCard from '../../components/StatCard'
import { AttendanceBarChart, MarksBarChart } from '../../components/Charts'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState([])
  const [assignments, setAssignments] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/attendance/summary'),
      api.get('/marks/summary'),
      api.get('/assignments'),
      api.get('/notices?limit=4')
    ]).then(([attRes, marksRes, assRes, noticeRes]) => {
      setAttendance(attRes.data)
      setMarks(marksRes.data)
      setAssignments(assRes.data)
      setNotices(noticeRes.data)
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const avgAttendance = attendance.length > 0
    ? Math.round(attendance.reduce((s, a) => s + (a.percentage || 0), 0) / attendance.length)
    : 0
  const avgMarks = marks.length > 0
    ? Math.round(marks.reduce((s, m) => s + (m.avg_pct || 0), 0) / marks.length)
    : 0
  const pendingAssignments = assignments.filter(a => !a.submitted && new Date(a.due_date) >= new Date())

  const priorityColors = { urgent: 'badge-danger', high: 'badge-warning', normal: 'badge-info', low: 'badge-primary' }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-violet-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-primary-200 text-sm">Roll No: {user?.roll_no} · Sem {user?.semester}</p>
            </div>
          </div>
          <p className="text-primary-100 text-sm mt-2">{user?.department} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Avg Attendance" value={`${avgAttendance}%`} icon={CalendarCheck} color={avgAttendance >= 75 ? 'success' : 'danger'} subtitle="Overall" />
        <StatCard title="Avg Marks"      value={`${avgMarks}%`}      icon={BarChart3}     color={avgMarks >= 60 ? 'info' : 'warning'} subtitle="All subjects" />
        <StatCard title="Assignments"    value={assignments.length}  icon={BookOpen}      color="primary"  subtitle={`${pendingAssignments.length} pending`} />
        <StatCard title="Notices"        value={notices.length}      icon={Bell}          color="violet"   subtitle="Latest updates" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary-500" /> Attendance by Subject
          </h3>
          {attendance.length > 0
            ? <AttendanceBarChart data={attendance} />
            : <p className="text-slate-400 text-center py-8">No attendance data yet</p>}
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-500" /> Marks by Subject
          </h3>
          {marks.length > 0
            ? <MarksBarChart data={marks} />
            : <p className="text-slate-400 text-center py-8">No marks data yet</p>}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending assignments */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-500" /> Pending Assignments
          </h3>
          {pendingAssignments.length === 0
            ? <p className="text-slate-400 text-center py-6">All caught up! 🎉</p>
            : <div className="space-y-2">
                {pendingAssignments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{a.title}</p>
                      <p className="text-xs text-slate-400">{a.subject}</p>
                    </div>
                    <span className="badge badge-warning flex-shrink-0 text-xs">Due {new Date(a.due_date).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Notices */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Recent Notices</h3>
          <div className="space-y-2">
            {notices.map(n => (
              <div key={n.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">{n.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={priorityColors[n.priority] || 'badge-info'}>{n.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI CTA */}
      <div
        onClick={() => navigate('/student/ai-tools')}
        className="cursor-pointer card p-6 bg-gradient-to-r from-primary-600/10 to-violet-600/10 border border-primary-200 dark:border-primary-800 hover:border-primary-400 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-purple group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Explore AI Study Tools</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Study Planner · Notes Summarizer · Question Generator · Performance Advisor</p>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}

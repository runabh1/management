import { useState, useEffect } from 'react'
import { Users, UserCheck, Bell, BookOpen, TrendingUp, GraduationCap, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import StatCard from '../../components/StatCard'
import { AttendancePieChart } from '../../components/Charts'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/students'),
      api.get('/faculty'),
      api.get('/notices?limit=5'),
      api.get('/assignments')
    ]).then(([studRes, facRes, noticeRes, assRes]) => {
      setStats({
        students: studRes.data.length,
        faculty: facRes.data.length,
        assignments: assRes.data.length
      })
      setNotices(noticeRes.data)
    }).catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  const priorityColors = {
    urgent: 'badge-danger',
    high:   'badge-warning',
    normal: 'badge-info',
    low:    'badge-primary'
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Overview of SmartCampus activity and metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats?.students ?? 0} icon={Users}      color="primary" subtitle="Registered students" />
        <StatCard title="Faculty Members" value={stats?.faculty ?? 0} icon={UserCheck}  color="success" subtitle="Active faculty" />
        <StatCard title="Assignments"     value={stats?.assignments ?? 0} icon={BookOpen} color="info"  subtitle="Posted this semester" />
        <StatCard title="Notices"         value={notices.length}     icon={Bell}        color="warning" subtitle="Active announcements" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notices */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Notices</h3>
            <span className="badge badge-primary">{notices.length} active</span>
          </div>
          <div className="space-y-3">
            {notices.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No notices yet</p>}
            {notices.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{n.title}</p>
                    <span className={priorityColors[n.priority] || 'badge-info'}>{n.priority}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.content}</p>
                  <p className="text-xs text-slate-400 mt-1">By {n.author_name} · {new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick info */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Info</h3>
          <div className="space-y-3">
            {[
              { label: 'Departments', value: '3', icon: GraduationCap, color: 'text-primary-500' },
              { label: 'Avg Semester', value: '5th', icon: BookOpen, color: 'text-emerald-500' },
              { label: 'Active Courses', value: '4', icon: TrendingUp, color: 'text-amber-500' },
              { label: 'Urgent Notices', value: notices.filter(n => n.priority === 'urgent').length, icon: AlertCircle, color: 'text-red-500' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

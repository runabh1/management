import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, UserCheck, Bell, BookOpen, ClipboardList,
  BarChart3, GraduationCap, CalendarCheck, Star, Sparkles, LogOut, X, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV = {
  admin: [
    { label: 'Overview',  section: true },
    { label: 'Dashboard',  to: '/admin',          icon: LayoutDashboard },
    { label: 'Management', section: true },
    { label: 'Students',   to: '/admin/students', icon: Users },
    { label: 'Faculty',    to: '/admin/faculty',  icon: UserCheck },
    { label: 'Notices',    to: '/admin/notices',  icon: Bell }
  ],
  faculty: [
    { label: 'Overview',    section: true },
    { label: 'Dashboard',   to: '/faculty',             icon: LayoutDashboard },
    { label: 'Academic',    section: true },
    { label: 'Attendance',  to: '/faculty/attendance',  icon: CalendarCheck },
    { label: 'Assignments', to: '/faculty/assignments', icon: ClipboardList },
    { label: 'Marks',       to: '/faculty/marks',       icon: BarChart3 }
  ],
  student: [
    { label: 'Overview',    section: true },
    { label: 'Dashboard',   to: '/student',             icon: LayoutDashboard },
    { label: 'Academic',    section: true },
    { label: 'Attendance',  to: '/student/attendance',  icon: CalendarCheck },
    { label: 'My Marks',    to: '/student/marks',       icon: Star },
    { label: 'Assignments', to: '/student/assignments', icon: BookOpen },
    { label: 'AI Tools',    section: true },
    { label: 'AI Study Hub',to: '/student/ai-tools',    icon: Sparkles, highlight: true }
  ]
}

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = NAV[user?.role] || []

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow-purple">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm leading-none">SmartCampus</p>
            <p className="text-[10px] text-primary-500 font-semibold uppercase tracking-wide">AI Management</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden btn-icon btn-ghost">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User pill */}
      <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-gradient-to-br from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/10 border border-primary-100 dark:border-primary-900/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
            <p className="text-xs text-primary-600 dark:text-primary-400 capitalize font-semibold">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {items.map((item, i) => {
          if (item.section) return (
            <p key={i} className="sidebar-section">{item.label}</p>
          )
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/faculty' || item.to === '/student'}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-item group mb-0.5 ${isActive ? 'active' : ''} ${item.highlight ? 'bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/30 dark:to-violet-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${item.highlight ? 'text-primary-500' : ''}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.highlight && <Sparkles className="w-3 h-3 text-violet-500 animate-pulse" />}
                  {isActive && !item.highlight && <ChevronRight className="w-3 h-3 opacity-60" />}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="sidebar-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

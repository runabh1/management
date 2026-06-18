import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, GraduationCap, Sparkles, Shield, BookOpen, Users } from 'lucide-react'

const DEMO_CREDENTIALS = [
  { role: 'Admin',   email: 'admin@smartcampus.edu',   password: 'Admin@123',   icon: Shield,     color: 'from-violet-500 to-purple-600' },
  { role: 'Faculty', email: 'faculty@smartcampus.edu', password: 'Faculty@123', icon: BookOpen,   color: 'from-blue-500 to-indigo-600' },
  { role: 'Student', email: 'student@smartcampus.edu', password: 'Student@123', icon: GraduationCap, color: 'from-emerald-500 to-teal-600' }
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please enter email and password'); return }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').split(' ')[0]}! 👋`)
      setTimeout(() => {
        if (user.role === 'admin')   navigate('/admin')
        else if (user.role === 'faculty') navigate('/faculty')
        else navigate('/student')
      }, 300)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (cred) => {
    setForm({ email: cred.email, password: cred.password })
    toast.success(`Filled ${cred.role} credentials`)
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-primary-950 to-violet-950 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-primary-600/20 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-violet-600/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[40%] left-[40%] w-64 h-64 rounded-full bg-cyan-600/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }} />

      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-start px-16 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow-purple">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SmartCampus</h1>
              <p className="text-primary-300 text-sm font-medium">AI College Management</p>
            </div>
          </div>

          <h2 className="text-5xl font-extrabold text-white leading-tight mb-4">
            The Future of<br />
            <span className="text-gradient bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
              Campus Management
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            AI-powered insights, real-time attendance, smart grading — all in one beautiful platform built for modern campuses.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-col gap-4 mt-4">
          {[
            { icon: Sparkles, label: 'Gemini AI Study Tools',    desc: 'Study planner, question generator & more' },
            { icon: Users,    label: 'Role-Based Dashboards',    desc: 'Admin, Faculty & Student portals' },
            { icon: BookOpen, label: 'Smart Analytics',          desc: 'Attendance & marks with visual charts' }
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-300" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-slate-400 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SmartCampus</h1>
              <p className="text-primary-300 text-xs">AI College Management</p>
            </div>
          </div>

          {/* Card */}
          <div className="glassmorphism rounded-3xl p-8 shadow-2xl border border-white/10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-slate-400 text-sm">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@smartcampus.edu"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 transition-all text-sm"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 transition-all text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 transition-all duration-300 shadow-glow-purple hover:shadow-glow-violet active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 text-center">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_CREDENTIALS.map((cred) => {
                  const Icon = cred.icon
                  return (
                    <button
                      key={cred.role}
                      id={`demo-${cred.role.toLowerCase()}`}
                      type="button"
                      onClick={() => fillDemo(cred)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${cred.color} bg-opacity-20 hover:bg-opacity-30 border border-white/10 hover:border-white/20 transition-all text-center group`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cred.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white text-xs font-semibold">{cred.role}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            SmartCampus AI © 2024 — Powered by Gemini AI
          </p>
        </div>
      </div>
    </div>
  )
}

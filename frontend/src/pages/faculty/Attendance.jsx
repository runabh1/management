import { useState, useEffect } from 'react'
import { CalendarCheck, Check, X, Clock, Search, ChevronDown } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const SUBJECTS = ['Data Structures', 'Database Management', 'Linear Algebra', 'Operating Systems']
const STATUS_CONFIG = {
  present: { label: 'Present', icon: Check,  class: 'bg-emerald-500',  badge: 'badge-success' },
  absent:  { label: 'Absent',  icon: X,      class: 'bg-red-500',      badge: 'badge-danger' },
  late:    { label: 'Late',    icon: Clock,   class: 'bg-amber-500',   badge: 'badge-warning' }
}

export default function FacultyAttendance() {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({}) // { [studentId]: status }
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/students').then(r => {
      setStudents(r.data)
      const init = {}
      r.data.forEach(s => { init[s.id] = 'present' })
      setAttendance(init)
    }).catch(() => toast.error('Failed to load students'))
  }, [])

  // Load existing attendance for selected subject+date
  useEffect(() => {
    if (!subject || !date || students.length === 0) return
    setLoading(true)
    api.get('/attendance', { params: { subject, date } })
      .then(r => {
        const existing = {}
        r.data.forEach(a => { existing[a.student_id] = a.status })
        setAttendance(prev => {
          const next = { ...prev }
          students.forEach(s => { next[s.id] = existing[s.id] || 'present' })
          return next
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [subject, date, students.length])

  const markAll = (status) => {
    const next = {}
    students.forEach(s => { next[s.id] = status })
    setAttendance(next)
  }

  const handleSave = async () => {
    setSaving(true)
    const records = students.map(s => ({ student_id: s.id, subject, date, status: attendance[s.id] || 'present' }))
    try {
      await api.post('/attendance/mark', { records })
      toast.success(`Attendance saved for ${subject} on ${date}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save attendance')
    } finally { setSaving(false) }
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no?.includes(search)
  )

  const summary = {
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent:  Object.values(attendance).filter(v => v === 'absent').length,
    late:    Object.values(attendance).filter(v => v === 'late').length
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-primary-500" /> Mark Attendance</h1>
        <p className="page-subtitle">Record and track student attendance</p>
      </div>

      {/* Controls */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="form-group">
            <label className="label">Subject</label>
            <select className="input" value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => markAll('present')} className="btn btn-sm bg-emerald-500 text-white hover:bg-emerald-600 flex-1">All Present</button>
            <button onClick={() => markAll('absent')} className="btn btn-sm bg-red-500 text-white hover:bg-red-600 flex-1">All Absent</button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-3 flex-wrap">
          {Object.entries(summary).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status]
            return (
              <div key={status} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${cfg.badge}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.class}`} />
                {cfg.label}: {count}
              </div>
            )
          })}
        </div>
      </div>

      {/* Student list */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-sm text-slate-500">{filtered.length} students</span>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => {
              const status = attendance[s.id] || 'present'
              const cfg = STATUS_CONFIG[status]
              return (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {s.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.roll_no}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {Object.entries(STATUS_CONFIG).map(([st, c]) => (
                      <button
                        key={st}
                        onClick={() => setAttendance(p => ({ ...p, [s.id]: st }))}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all text-sm font-bold
                          ${status === st ? `${c.class} text-white shadow-sm scale-105` : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                        title={c.label}
                      >
                        <c.icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                  <span className={`badge ${cfg.badge} flex-shrink-0 hidden sm:flex`}>{cfg.label}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button id="save-attendance-btn" onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg">
            {saving ? 'Saving...' : `Save Attendance (${students.length} students)`}
          </button>
        </div>
      </div>
    </div>
  )
}

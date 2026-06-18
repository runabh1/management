import { useState, useEffect } from 'react'
import { CalendarCheck, TrendingUp, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'
import { AttendanceBarChart, AttendancePieChart } from '../../components/Charts'
import toast from 'react-hot-toast'

export default function MyAttendance() {
  const [summary, setSummary] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('All')

  useEffect(() => {
    Promise.all([
      api.get('/attendance/summary'),
      api.get('/attendance')
    ]).then(([sumRes, recRes]) => {
      setSummary(sumRes.data)
      setRecords(recRes.data)
    }).catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false))
  }, [])

  const overall = summary.length > 0
    ? { total: summary.reduce((s, a) => s + a.total, 0), present: summary.reduce((s, a) => s + a.present, 0) }
    : { total: 0, present: 0 }
  const overallPct = overall.total > 0 ? Math.round((overall.present / overall.total) * 100) : 0
  const atRisk = summary.filter(s => s.percentage < 75)

  const subjects = ['All', ...summary.map(s => s.subject)]
  const filteredRecords = selectedSubject === 'All'
    ? records
    : records.filter(r => r.subject === selectedSubject)

  const statusColors = { present: 'badge-success', absent: 'badge-danger', late: 'badge-warning' }

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-primary-500" /> My Attendance</h1>
        <p className="page-subtitle">Your attendance records and statistics</p>
      </div>

      {/* At Risk Alert */}
      {atRisk.length > 0 && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-700 dark:text-red-400">Low Attendance Warning</p>
              <p className="text-sm text-red-600 dark:text-red-300">
                You are below 75% in: {atRisk.map(s => `${s.subject} (${s.percentage}%)`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 sm:col-span-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Overall Attendance</p>
          <div className="flex items-end gap-2">
            <p className={`text-4xl font-extrabold ${overallPct >= 75 ? 'text-emerald-500' : 'text-red-500'}`}>{overallPct}%</p>
          </div>
          <p className="text-sm text-slate-500 mt-1">{overall.present} / {overall.total} classes</p>
        </div>
        {summary.map(s => (
          <div key={s.subject} className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 truncate">{s.subject}</p>
            <div className="flex items-center justify-between">
              <p className={`text-2xl font-extrabold ${s.percentage >= 75 ? 'text-emerald-500' : 'text-red-500'}`}>{s.percentage}%</p>
              <div className="text-right text-xs text-slate-400">
                <p>P: {s.present}</p>
                <p>A: {s.absent}</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${s.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${s.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Attendance % by Subject</h3>
          <AttendanceBarChart data={summary} />
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Distribution</h3>
          <AttendancePieChart data={summary} />
        </div>
      </div>

      {/* Records table */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h3 className="font-bold text-slate-900 dark:text-white flex-1">Attendance Records</h3>
          <select className="input w-auto" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead>
            <tbody>
              {filteredRecords.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-slate-400">No records found</td></tr>}
              {filteredRecords.slice(0, 50).map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="font-medium">{r.subject}</td>
                  <td><span className={`badge ${statusColors[r.status] || 'badge-info'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRecords.length > 50 && <p className="text-xs text-slate-400 mt-2 text-center">Showing first 50 records</p>}
      </div>
    </div>
  )
}

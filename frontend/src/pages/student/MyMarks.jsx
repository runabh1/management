import { useState, useEffect } from 'react'
import { BarChart3, Star, TrendingUp } from 'lucide-react'
import api from '../../api/axios'
import { MarksBarChart, MarksLineChart } from '../../components/Charts'
import toast from 'react-hot-toast'

export default function MyMarks() {
  const [summary, setSummary] = useState([])
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/marks/summary'),
      api.get('/marks')
    ]).then(([sumRes, marksRes]) => {
      setSummary(sumRes.data)
      setMarks(marksRes.data)
    }).catch(() => toast.error('Failed to load marks'))
      .finally(() => setLoading(false))
  }, [])

  const overall = summary.length > 0
    ? Math.round(summary.reduce((s, m) => s + (m.avg_pct || 0), 0) / summary.length)
    : 0

  // Build line chart data
  const lineData = summary.map(s => {
    const subMarks = marks.filter(m => m.subject === s.subject)
    const byType = {}
    subMarks.forEach(m => { byType[m.exam_type] = Math.round(m.marks * 100 / m.max_marks) })
    return { subject: s.subject.split(' ')[0], ...byType }
  })

  const gradeColor = (pct) => {
    if (pct >= 90) return 'text-emerald-500'
    if (pct >= 75) return 'text-blue-500'
    if (pct >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const gradeLabel = (pct) => {
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B'
    if (pct >= 60) return 'C'
    if (pct >= 50) return 'D'
    return 'F'
  }

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" /> My Marks</h1>
        <p className="page-subtitle">Your academic performance across all subjects</p>
      </div>

      {/* Overall grade */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/10 border border-primary-100 dark:border-primary-900/30">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className={`text-5xl font-extrabold ${gradeColor(overall)}`}>{gradeLabel(overall)}</p>
            <p className="text-sm text-slate-500 mt-1">Overall Grade</p>
          </div>
          <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className={`text-3xl font-extrabold ${gradeColor(overall)}`}>{overall}%</p>
            <p className="text-sm text-slate-500">Average across all subjects</p>
          </div>
        </div>
      </div>

      {/* Subject cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map(s => (
          <div key={s.subject} className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 line-clamp-1">{s.subject}</p>
            <p className={`text-3xl font-extrabold ${gradeColor(s.avg_pct)}`}>{Math.round(s.avg_pct || 0)}%</p>
            <p className="text-sm text-slate-500 mt-0.5">Grade: <span className={`font-bold ${gradeColor(s.avg_pct)}`}>{gradeLabel(s.avg_pct)}</span></p>
            <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.avg_pct >= 75 ? 'bg-emerald-500' : s.avg_pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(s.avg_pct, 100)}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{s.exam_count} exams</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Average % by Subject</h3>
          <MarksBarChart data={summary} />
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Marks by Exam Type</h3>
          {lineData.length > 0 ? <MarksLineChart data={lineData} /> : <p className="text-slate-400 text-center py-8">No data</p>}
        </div>
      </div>

      {/* Detailed marks table */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Detailed Marks Record</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Subject</th><th>Exam Type</th><th>Marks</th><th>Max</th><th>Percentage</th><th>Grade</th></tr></thead>
            <tbody>
              {marks.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No marks recorded yet</td></tr>}
              {marks.map(m => {
                const pct = Math.round(m.marks * 100 / m.max_marks)
                return (
                  <tr key={m.id}>
                    <td className="font-medium">{m.subject}</td>
                    <td><span className="badge badge-info capitalize">{m.exam_type}</span></td>
                    <td className="font-bold">{m.marks}</td>
                    <td className="text-slate-400">{m.max_marks}</td>
                    <td><span className={`font-bold ${gradeColor(pct)}`}>{pct}%</span></td>
                    <td><span className={`badge font-bold ${pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'}`}>{gradeLabel(pct)}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { BarChart3, Plus, Search, Save, X } from 'lucide-react'
import api from '../../api/axios'
import { MarksBarChart } from '../../components/Charts'
import toast from 'react-hot-toast'

const SUBJECTS = ['Data Structures', 'Database Management', 'Linear Algebra', 'Operating Systems']
const EXAM_TYPES = ['quiz', 'midterm', 'final']

export default function FacultyMarks() {
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [examType, setExamType] = useState('midterm')
  const [maxMarks, setMaxMarks] = useState(100)
  const [entries, setEntries] = useState({}) // { [studentId]: marks }
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/students').then(r => {
      setStudents(r.data)
      const init = {}; r.data.forEach(s => { init[s.id] = '' })
      setEntries(init)
    }).catch(() => toast.error('Failed to load students')).finally(() => setLoading(false))
  }, [])

  // Load existing marks for subject overview
  useEffect(() => {
    api.get('/marks', { params: { subject } }).then(r => setMarks(r.data)).catch(() => {})
  }, [subject])

  const handleSave = async () => {
    const records = students
      .filter(s => entries[s.id] !== '' && entries[s.id] !== undefined)
      .map(s => ({
        student_id: s.id,
        subject,
        exam_type: examType,
        marks: parseFloat(entries[s.id]),
        max_marks: parseFloat(maxMarks)
      }))
      .filter(r => !isNaN(r.marks) && r.marks >= 0 && r.marks <= r.max_marks)

    if (records.length === 0) { toast.error('Enter at least one valid mark'); return }

    setSaving(true)
    try {
      await api.post('/marks/bulk', { records })
      toast.success(`${records.length} marks saved for ${subject}`)
      const r = await api.get('/marks', { params: { subject } })
      setMarks(r.data)
      const init = {}; students.forEach(s => { init[s.id] = '' })
      setEntries(init)
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  // Chart data: per-subject averages
  const chartData = SUBJECTS.map(subj => {
    const subMarks = marks.filter(m => m.subject === subj)
    const avg = subMarks.length > 0 ? subMarks.reduce((s, m) => s + (m.marks * 100 / m.max_marks), 0) / subMarks.length : 0
    return { subject: subj, avg_pct: Math.round(avg) }
  })

  const filtered = students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.roll_no?.includes(search))

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary-500" /> Marks Entry</h1>
        <p className="page-subtitle">Enter exam marks for students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Entry panel */}
        <div className="lg:col-span-2 card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="form-group">
              <label className="label">Subject</label>
              <select className="input" value={subject} onChange={e => setSubject(e.target.value)}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Exam Type</label>
              <select className="input" value={examType} onChange={e => setExamType(e.target.value)}>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Max Marks</label>
              <input type="number" className="input" value={maxMarks} min={1} max={500}
                onChange={e => setMaxMarks(e.target.value)} />
            </div>
          </div>

          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="space-y-2">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {s.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.roll_no}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={maxMarks}
                    className="input w-24 text-center"
                    placeholder={`/ ${maxMarks}`}
                    value={entries[s.id] ?? ''}
                    onChange={e => setEntries(p => ({ ...p, [s.id]: e.target.value }))}
                  />
                  {entries[s.id] !== '' && (
                    <span className={`text-xs font-semibold ${(entries[s.id] / maxMarks) >= 0.75 ? 'text-emerald-500' : (entries[s.id] / maxMarks) >= 0.5 ? 'text-amber-500' : 'text-red-500'}`}>
                      {Math.round((entries[s.id] / maxMarks) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-5">
            <button id="save-marks-btn" onClick={handleSave} disabled={saving} className="btn btn-primary">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Class Average by Subject</h3>
          <MarksBarChart data={chartData} />
        </div>
      </div>
    </div>
  )
}

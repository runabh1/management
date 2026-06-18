import { useState, useEffect } from 'react'
import { BookOpen, Upload, Check, Clock, Calendar } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function MyAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(null)
  const [filter, setFilter] = useState('all') // all | pending | submitted | overdue

  const load = () => {
    api.get('/assignments').then(r => setAssignments(r.data)).catch(() => toast.error('Failed to load assignments')).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSubmit = async (assignmentId) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.zip'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      setSubmitting(assignmentId)
      const fd = new FormData()
      fd.append('file', file)
      try {
        await api.post(`/assignments/${assignmentId}/submit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Assignment submitted successfully!')
        load()
      } catch (err) { toast.error(err.response?.data?.error || 'Submission failed') }
      finally { setSubmitting(null) }
    }
    input.click()
  }

  const now = new Date()
  const filtered = assignments.filter(a => {
    const isOverdue = new Date(a.due_date) < now
    if (filter === 'submitted') return a.submitted
    if (filter === 'pending') return !a.submitted && !isOverdue
    if (filter === 'overdue') return !a.submitted && isOverdue
    return true
  })

  const counts = {
    all: assignments.length,
    pending: assignments.filter(a => !a.submitted && new Date(a.due_date) >= now).length,
    submitted: assignments.filter(a => a.submitted).length,
    overdue: assignments.filter(a => !a.submitted && new Date(a.due_date) < now).length
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary-500" /> My Assignments</h1>
        <p className="page-subtitle">Track and submit your assignments</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',       label: 'All',       color: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
          { key: 'pending',   label: 'Pending',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
          { key: 'submitted', label: 'Submitted', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
          { key: 'overdue',   label: 'Overdue',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${filter === f.key ? 'bg-primary-600 text-white shadow-glow-purple' : f.color}`}>
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No assignments in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const isOverdue = new Date(a.due_date) < now
            const daysLeft = Math.ceil((new Date(a.due_date) - now) / (1000*60*60*24))

            return (
              <div key={a.id} className={`card p-5 border-l-4 ${a.submitted ? 'border-emerald-500' : isOverdue ? 'border-red-500' : 'border-amber-500'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.submitted ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-amber-500'}`}>
                      {a.submitted
                        ? <Check className="w-5 h-5 text-white" />
                        : isOverdue ? <Clock className="w-5 h-5 text-white" /> : <BookOpen className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white">{a.title}</h4>
                      {a.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.description}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="badge badge-primary">{a.subject}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {isOverdue ? 'Was due' : 'Due'} {new Date(a.due_date).toLocaleDateString('en-IN')}
                        </span>
                        {!isOverdue && !a.submitted && (
                          <span className={`badge ${daysLeft <= 3 ? 'badge-danger' : 'badge-warning'}`}>
                            {daysLeft === 0 ? 'Due today!' : `${daysLeft} days left`}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">By {a.faculty_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {a.submitted ? (
                      <span className="badge badge-success"><Check className="w-3 h-3" /> Submitted</span>
                    ) : (
                      <button
                        id={`submit-assignment-${a.id}`}
                        onClick={() => handleSubmit(a.id)}
                        disabled={submitting === a.id}
                        className={`btn btn-sm ${isOverdue ? 'btn-secondary' : 'btn-primary'}`}
                      >
                        {submitting === a.id ? (
                          <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="w-3.5 h-3.5" /> {isOverdue ? 'Submit Late' : 'Submit'}</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

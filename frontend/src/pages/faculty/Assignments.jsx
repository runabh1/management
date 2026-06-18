import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Trash2, Edit2, X, Users, Calendar } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const SUBJECTS = ['Data Structures', 'Database Management', 'Linear Algebra', 'Operating Systems']

function AssignmentModal({ assignment, onClose, onSave }) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 7)
  const [form, setForm] = useState(assignment || { title: '', description: '', due_date: tomorrow.toISOString().split('T')[0], subject: SUBJECTS[0] })
  const [loading, setLoading] = useState(false)
  const isEdit = !!assignment?.id

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = isEdit ? await api.put(`/assignments/${assignment.id}`, form) : await api.post('/assignments', form)
      toast.success(isEdit ? 'Assignment updated' : 'Assignment posted')
      onSave(res.data, isEdit)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Assignment' : 'Post Assignment'}</h3>
          <button onClick={onClose} className="btn-icon btn-ghost"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Assignment title" />
          </div>
          <div className="form-group">
            <label className="label">Subject *</label>
            <select className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Due Date *</label>
            <input type="date" className="input" required value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input min-h-[100px] resize-none" value={form.description || ''}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Assignment details and instructions..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Post Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FacultyAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [submissions, setSubmissions] = useState({})

  const load = () => {
    api.get('/assignments').then(r => setAssignments(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const loadSubmissions = async (id) => {
    if (submissions[id]) { setExpandedId(expandedId === id ? null : id); return }
    try {
      const r = await api.get(`/assignments/${id}/submissions`)
      setSubmissions(p => ({ ...p, [id]: r.data }))
      setExpandedId(id)
    } catch { toast.error('Failed to load submissions') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return
    try { await api.delete(`/assignments/${id}`); setAssignments(p => p.filter(a => a.id !== id)); toast.success('Deleted') }
    catch (err) { toast.error(err.response?.data?.error || 'Delete failed') }
  }

  const handleSave = (a, isEdit) => {
    if (isEdit) setAssignments(p => p.map(x => x.id === a.id ? a : x))
    else setAssignments(p => [a, ...p])
    setModal(null)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {modal && <AssignmentModal assignment={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary-500" /> Assignments</h1>
          <p className="page-subtitle">{assignments.length} posted assignments</p>
        </div>
        <button id="post-assignment-btn" onClick={() => setModal('add')} className="btn btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Post Assignment
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {assignments.length === 0 && (
            <div className="card p-12 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No assignments posted yet</p>
            </div>
          )}
          {assignments.map(a => {
            const isOverdue = new Date(a.due_date) < new Date()
            const subs = submissions[a.id] || []
            const isExpanded = expandedId === a.id

            return (
              <div key={a.id} className="card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{a.title}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="badge badge-primary">{a.subject}</span>
                            <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-success'}`}>
                              <Calendar className="w-3 h-3" /> {isOverdue ? 'Overdue' : `Due ${new Date(a.due_date).toLocaleDateString('en-IN')}`}
                            </span>
                          </div>
                          {a.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{a.description}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setModal(a)} className="btn btn-sm btn-ghost text-primary-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(a.id)} className="btn btn-sm btn-ghost text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button onClick={() => loadSubmissions(a.id)}
                    className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {isExpanded ? 'Hide' : 'View'} submissions {submissions[a.id] ? `(${subs.length})` : ''}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {subs.length === 0 ? (
                        <p className="text-sm text-slate-400 py-2">No submissions yet</p>
                      ) : subs.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sub.student_name}</p>
                            <p className="text-xs text-slate-400">{sub.roll_no} · {new Date(sub.submitted_at).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

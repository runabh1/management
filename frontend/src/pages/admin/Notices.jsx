import { useState, useEffect } from 'react'
import { Plus, Bell, Edit2, Trash2, X, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const PRIORITY_CONFIG = {
  urgent: { badge: 'badge-danger',   label: 'Urgent',  dot: 'bg-red-500' },
  high:   { badge: 'badge-warning',  label: 'High',    dot: 'bg-amber-500' },
  normal: { badge: 'badge-info',     label: 'Normal',  dot: 'bg-sky-500' },
  low:    { badge: 'badge-primary',  label: 'Low',     dot: 'bg-primary-500' }
}

function NoticeModal({ notice, onClose, onSave }) {
  const [form, setForm] = useState(notice || { title: '', content: '', priority: 'normal' })
  const [loading, setLoading] = useState(false)
  const isEdit = !!notice?.id

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = isEdit ? await api.put(`/notices/${notice.id}`, form) : await api.post('/notices', form)
      toast.success(isEdit ? 'Notice updated' : 'Notice created')
      onSave(res.data, isEdit)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Notice' : 'Post Notice'}</h3>
          <button onClick={onClose} className="btn-icon btn-ghost"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group"><label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Notice title..." />
          </div>
          <div className="form-group"><label className="label">Content *</label>
            <textarea className="input min-h-[120px] resize-none" required value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Notice content..." />
          </div>
          <div className="form-group"><label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Post Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = () => {
    api.get('/notices').then(r => setNotices(r.data)).catch(() => toast.error('Failed to load notices')).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return
    try { await api.delete(`/notices/${id}`); setNotices(p => p.filter(n => n.id !== id)); toast.success('Notice deleted') }
    catch (err) { toast.error(err.response?.data?.error || 'Delete failed') }
  }

  const handleSave = (notice, isEdit) => {
    if (isEdit) setNotices(p => p.map(n => n.id === notice.id ? notice : n))
    else setNotices(p => [notice, ...p])
    setModal(null)
  }

  const filtered = filter === 'all' ? notices : notices.filter(n => n.priority === filter)

  return (
    <div className="space-y-6 animate-slide-up">
      {modal && <NoticeModal notice={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2"><Bell className="w-6 h-6 text-amber-500" /> Notices</h1>
          <p className="page-subtitle">{notices.length} announcements</p>
        </div>
        <button id="add-notice-btn" onClick={() => setModal('add')} className="btn btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      {/* Priority filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'urgent', 'high', 'normal', 'low'].map(p => (
          <button key={p} onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === p ? 'bg-primary-600 text-white shadow-glow-purple' : 'btn btn-secondary'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)} {p !== 'all' && `(${notices.filter(n => n.priority === p).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="card p-12 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No notices found</p>
            </div>
          )}
          {filtered.map(n => {
            const pc = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.normal
            return (
              <div key={n.id} className="card-hover p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    {n.priority === 'urgent' ? <AlertTriangle className="w-5 h-5 text-white" /> : <Bell className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">{n.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{n.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={pc.badge}><span className={`status-dot ${pc.dot} mr-1`} />{pc.label}</span>
                          <span className="text-xs text-slate-400">By {n.author_name} · {new Date(n.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setModal(n)} className="btn btn-sm btn-ghost text-primary-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(n.id)} className="btn btn-sm btn-ghost text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
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

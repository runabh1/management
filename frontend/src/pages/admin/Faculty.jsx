import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, X, UserCheck } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

function FacultyModal({ faculty, onClose, onSave }) {
  const [form, setForm] = useState(faculty || { name: '', email: '', password: '', department: 'Computer Science', subject: '' })
  const [loading, setLoading] = useState(false)
  const isEdit = !!faculty?.id

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = isEdit ? await api.put(`/faculty/${faculty.id}`, form) : await api.post('/faculty', form)
      toast.success(isEdit ? 'Faculty updated' : 'Faculty added')
      onSave(res.data, isEdit)
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed') }
    finally { setLoading(false) }
  }
  const f = (k) => ({ value: form[k], onChange: (e) => setForm(p => ({ ...p, [k]: e.target.value })) })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Faculty' : 'Add Faculty'}</h3>
          <button onClick={onClose} className="btn-icon btn-ghost"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group"><label className="label">Full Name *</label><input className="input" required {...f('name')} placeholder="Dr. John Smith" /></div>
          <div className="form-group"><label className="label">Email *</label><input className="input" type="email" required {...f('email')} placeholder="john@smartcampus.edu" /></div>
          {!isEdit && <div className="form-group"><label className="label">Password *</label><input className="input" type="password" required {...f('password')} placeholder="••••••••" /></div>}
          <div className="form-group"><label className="label">Department *</label>
            <select className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
              {['Computer Science','Information Technology','Mathematics','Physics','Electronics'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="label">Subject *</label><input className="input" required {...f('subject')} placeholder="Data Structures" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/faculty').then(r => setFaculty(r.data)).catch(() => toast.error('Failed to load faculty')).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete faculty "${name}"?`)) return
    try { await api.delete(`/faculty/${id}`); setFaculty(p => p.filter(f => f.id !== id)); toast.success('Faculty deleted') }
    catch (err) { toast.error(err.response?.data?.error || 'Delete failed') }
  }

  const handleSave = (f, isEdit) => {
    if (isEdit) setFaculty(p => p.map(x => x.id === f.id ? f : x))
    else setFaculty(p => [...p, f])
    setModal(null)
  }

  const filtered = faculty.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.subject?.toLowerCase().includes(search.toLowerCase()) ||
    f.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-slide-up">
      {modal && <FacultyModal faculty={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2"><UserCheck className="w-6 h-6 text-emerald-500" /> Faculty</h1>
          <p className="page-subtitle">{faculty.length} faculty members</p>
        </div>
        <button id="add-faculty-btn" onClick={() => setModal('add')} className="btn btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      <div className="card p-5">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search faculty..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Name</th><th>Department</th><th>Subject</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-10 text-slate-400">No faculty found</td></tr>
                )}
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                          {f.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{f.name}</p>
                          <p className="text-xs text-slate-400">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-success">{f.department}</span></td>
                    <td className="font-medium text-slate-700 dark:text-slate-300">{f.subject}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setModal(f)} className="btn btn-sm btn-ghost text-primary-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(f.id, f.name)} className="btn btn-sm btn-ghost text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Faculty cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(f => (
          <div key={f.id} className="card-hover p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                {f.name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{f.name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{f.subject}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge badge-success">{f.department}</span>
              <div className="flex gap-1">
                <button onClick={() => setModal(f)} className="btn btn-sm btn-ghost text-primary-600"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(f.id, f.name)} className="btn btn-sm btn-ghost text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

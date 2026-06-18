import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, X, Users, Phone, Hash, GraduationCap } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

function StudentModal({ student, onClose, onSave }) {
  const [form, setForm] = useState(student || { name: '', email: '', password: '', roll_no: '', department: 'Computer Science', semester: 1, phone: '' })
  const [loading, setLoading] = useState(false)
  const isEdit = !!student?.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (isEdit) {
        res = await api.put(`/students/${student.id}`, form)
        toast.success('Student updated successfully')
      } else {
        res = await api.post('/students', form)
        toast.success('Student created successfully')
      }
      onSave(res.data, isEdit)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const f = (k) => ({ value: form[k], onChange: (e) => setForm(p => ({ ...p, [k]: e.target.value })) })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Student' : 'Add New Student'}</h3>
          <button onClick={onClose} className="btn-icon btn-ghost"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2"><label className="label">Full Name *</label><input className="input" required {...f('name')} placeholder="John Doe" /></div>
            <div className="form-group col-span-2"><label className="label">Email *</label><input className="input" type="email" required {...f('email')} placeholder="john@smartcampus.edu" /></div>
            {!isEdit && <div className="form-group col-span-2"><label className="label">Password *</label><input className="input" type="password" required {...f('password')} placeholder="••••••••" /></div>}
            <div className="form-group"><label className="label">Roll No. *</label><input className="input" required {...f('roll_no')} placeholder="CS2024001" /></div>
            <div className="form-group"><label className="label">Semester *</label>
              <select className="input" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="form-group col-span-2"><label className="label">Department *</label>
              <select className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                {['Computer Science','Information Technology','Mathematics','Physics','Electronics'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group col-span-2"><label className="label">Phone</label><input className="input" {...f('phone')} placeholder="9876543210" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | student obj

  const load = () => {
    setLoading(true)
    api.get('/students').then(r => setStudents(r.data)).catch(() => toast.error('Failed to load students')).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/students/${id}`)
      setStudents(p => p.filter(s => s.id !== id))
      toast.success('Student deleted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  const handleSave = (student, isEdit) => {
    if (isEdit) setStudents(p => p.map(s => s.id === student.id ? student : s))
    else setStudents(p => [...p, student])
    setModal(null)
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-slide-up">
      {modal && <StudentModal student={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2"><Users className="w-6 h-6 text-primary-500" /> Students</h1>
          <p className="page-subtitle">{students.length} registered students</p>
        </div>
        <button id="add-student-btn" onClick={() => setModal('add')} className="btn btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input id="student-search" className="input pl-9" placeholder="Search by name, roll no, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr>
                <th>Roll No.</th><th>Name</th><th>Department</th><th>Semester</th><th>Phone</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-400"><GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No students found</p></td></tr>
                )}
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><span className="badge badge-primary"><Hash className="w-3 h-3" />{s.roll_no}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                          {s.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-400">{s.department}</td>
                    <td><span className="badge badge-info">Sem {s.semester}</span></td>
                    <td><span className="flex items-center gap-1 text-slate-500"><Phone className="w-3 h-3" />{s.phone || '—'}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(s)} className="btn btn-sm btn-ghost text-primary-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="btn btn-sm btn-ghost text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

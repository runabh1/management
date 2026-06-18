import { useState } from 'react'
import { Brain, Calendar, Clock, Sparkles, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const SUBJECTS_LIST = ['Data Structures', 'Database Management', 'Linear Algebra', 'Operating Systems', 'Computer Networks', 'Algorithms']

export default function StudyPlanner() {
  const [form, setForm] = useState({
    subjects: [],
    examDate: '',
    hoursPerDay: 4,
    currentLevel: 'intermediate'
  })
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState(0)

  const toggleSubject = (subj) => {
    setForm(p => ({
      ...p,
      subjects: p.subjects.includes(subj) ? p.subjects.filter(s => s !== subj) : [...p.subjects, subj]
    }))
  }

  const generate = async () => {
    if (form.subjects.length === 0) { toast.error('Select at least one subject'); return }
    if (!form.examDate) { toast.error('Select exam date'); return }

    setLoading(true)
    try {
      const res = await api.post('/ai/study-planner', form)
      setPlan(res.data.plan)
      toast.success('Study plan generated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate plan')
    } finally { setLoading(false) }
  }

  const priorityColor = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-info' }

  return (
    <div className="space-y-5">
      <div className="ai-card rounded-2xl p-5">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet-500" /> Configure Your Study Plan
        </h3>

        <div className="space-y-4">
          {/* Subjects */}
          <div>
            <label className="label">Select Subjects *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SUBJECTS_LIST.map(s => (
                <button key={s} onClick={() => toggleSubject(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    form.subjects.includes(s)
                      ? 'bg-primary-600 text-white border-primary-600 shadow-glow-purple'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-300'
                  }`}
                >
                  {form.subjects.includes(s) && '✓ '}{s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Exam Date *</label>
              <input type="date" className="input" value={form.examDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Hours / Day</label>
              <input type="number" className="input" min={1} max={12} value={form.hoursPerDay}
                onChange={e => setForm(p => ({ ...p, hoursPerDay: parseInt(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="label">Current Level</label>
              <select className="input" value={form.currentLevel} onChange={e => setForm(p => ({ ...p, currentLevel: e.target.value }))}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button id="generate-study-plan" onClick={generate} disabled={loading} className="btn btn-primary w-full">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating with Gemini...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Study Plan</>
            )}
          </button>
        </div>
      </div>

      {/* Plan output */}
      {plan && (
        <div className="space-y-4 animate-slide-up">
          {/* Overview */}
          <div className="card p-5 bg-gradient-to-br from-violet-50 to-primary-50 dark:from-violet-900/20 dark:to-primary-900/10 border border-violet-100 dark:border-violet-900/30">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">📋 Overview</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">{plan.overview}</p>
            <div className="flex gap-4 mt-3 flex-wrap">
              <span className="badge badge-primary"><Calendar className="w-3 h-3" /> {plan.totalDays} days</span>
              <span className="badge badge-info"><Clock className="w-3 h-3" /> {plan.hoursPerDay}h/day</span>
            </div>
          </div>

          {/* Weekly plan */}
          {plan.weeklyPlan?.map((week, wi) => (
            <div key={wi} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpandedWeek(expandedWeek === wi ? -1 : wi)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">W{week.week}</div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white">Week {week.week}</p>
                    <p className="text-xs text-slate-500">{week.focus}</p>
                  </div>
                </div>
                {expandedWeek === wi ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {expandedWeek === wi && week.days && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
                  {week.days.map((day, di) => (
                    <div key={di} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{day.day}</p>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-info"><Clock className="w-3 h-3" />{day.hours}h</span>
                          <span className={`badge ${priorityColor[day.priority] || 'badge-info'}`}>{day.priority}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {day.topics?.map((t, ti) => <span key={ti} className="badge badge-primary text-xs">{t}</span>)}
                      </div>
                      <ul className="space-y-1">
                        {day.tasks?.map((task, ti) => (
                          <li key={ti} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" /> {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Tips */}
          {plan.tips?.length > 0 && (
            <div className="card p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">💡 Study Tips</h4>
              <ul className="space-y-2">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-primary-500 font-bold flex-shrink-0">{i + 1}.</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

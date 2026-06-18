import { useState } from 'react'
import { HelpCircle, Sparkles, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function QuestionGenerator() {
  const [form, setForm] = useState({
    topic: '',
    text: '',
    difficulty: 'medium',
    count: 10,
    questionTypes: ['mcq', 'short']
  })
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState({})

  const toggleType = (type) => {
    setForm(p => ({
      ...p,
      questionTypes: p.questionTypes.includes(type)
        ? p.questionTypes.filter(t => t !== type)
        : [...p.questionTypes, type]
    }))
  }

  const generate = async () => {
    if (!form.topic && !form.text) { toast.error('Enter a topic or paste content'); return }
    if (form.questionTypes.length === 0) { toast.error('Select at least one question type'); return }

    setLoading(true)
    setRevealed({})
    try {
      const res = await api.post('/ai/generate-questions', form)
      setQuestions(res.data.questions || [])
      toast.success(`${res.data.questions?.length || 0} questions generated!`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed')
    } finally { setLoading(false) }
  }

  const toggleReveal = (id) => setRevealed(p => ({ ...p, [id]: !p[id] }))

  const typeConfig = {
    mcq:   { label: 'MCQ',          badge: 'badge-primary' },
    short: { label: 'Short Answer', badge: 'badge-info' },
    long:  { label: 'Long Answer',  badge: 'badge-warning' }
  }

  return (
    <div className="space-y-5">
      <div className="ai-card rounded-2xl p-5">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-emerald-500" /> Question Generator
        </h3>

        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Topic / Subject *</label>
            <input className="input" placeholder="e.g., Binary Trees, Recursion, SQL Joins..."
              value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="label">Reference Content (optional)</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Paste notes or content for context..."
              value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Number of Questions</label>
              <input type="number" className="input" min={5} max={30} value={form.count}
                onChange={e => setForm(p => ({ ...p, count: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div>
            <label className="label">Question Types *</label>
            <div className="flex gap-2 mt-1">
              {['mcq', 'short', 'long'].map(type => (
                <button key={type} onClick={() => toggleType(type)}
                  className={`btn btn-sm flex-1 ${form.questionTypes.includes(type) ? 'btn-primary' : 'btn-secondary'}`}>
                  {typeConfig[type].label}
                </button>
              ))}
            </div>
          </div>

          <button id="generate-questions-btn" onClick={generate} disabled={loading} className="btn btn-primary w-full">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Questions...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Questions</>
            )}
          </button>
        </div>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white">{questions.length} Questions Generated</h4>
            <button onClick={() => setRevealed(Object.fromEntries(questions.map(q => [q.id, true])))}
              className="btn btn-sm btn-secondary">Reveal All Answers</button>
          </div>

          {questions.map((q, i) => {
            const cfg = typeConfig[q.type] || typeConfig.short
            const isRevealed = revealed[q.id]
            return (
              <div key={q.id || i} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i+1}</span>
                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    {q.marks && <span className="badge badge-info">{q.marks} marks</span>}
                  </div>
                  <button onClick={() => toggleReveal(q.id || i)}
                    className="btn btn-sm btn-ghost text-primary-600 flex-shrink-0">
                    {isRevealed ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</> : <><ChevronDown className="w-3.5 h-3.5" /> Answer</>}
                  </button>
                </div>

                <p className="text-slate-900 dark:text-slate-100 font-medium text-sm mb-3">{q.question}</p>

                {/* MCQ options */}
                {q.type === 'mcq' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`text-xs p-2 rounded-lg border transition-colors ${
                        isRevealed && opt === q.answer
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {isRevealed && opt === q.answer && <CheckCircle className="w-3 h-3 inline mr-1 text-emerald-500" />}
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                {/* Hints */}
                {q.hints && isRevealed && (
                  <div className="mb-2">
                    {q.hints.map((h, hi) => <p key={hi} className="text-xs text-slate-400">💡 {h}</p>)}
                  </div>
                )}

                {/* Answer */}
                {isRevealed && q.answer && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">✓ Answer:</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{q.answer}</p>
                    {q.explanation && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 italic">{q.explanation}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

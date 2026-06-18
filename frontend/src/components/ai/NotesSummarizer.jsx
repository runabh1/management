import { useState } from 'react'
import { FileText, Upload, Sparkles, BookOpen, Zap, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function NotesSummarizer() {
  const [mode, setMode] = useState('text') // text | pdf
  const [text, setText] = useState('')
  const [topic, setTopic] = useState('')
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const summarize = async () => {
    if (mode === 'text' && text.trim().length < 10) { toast.error('Enter at least 10 characters of text'); return }
    if (mode === 'pdf' && !file) { toast.error('Please select a PDF file'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      if (mode === 'pdf') fd.append('pdf', file)
      else fd.append('text', text)
      fd.append('topic', topic)

      const res = await api.post('/ai/summarize', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data.summary)
      toast.success('Notes summarized!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Summarization failed')
    } finally { setLoading(false) }
  }

  const difficultyColor = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger' }

  return (
    <div className="space-y-5">
      <div className="ai-card rounded-2xl p-5">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-cyan-500" /> Notes Summarizer
        </h3>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('text')}
            className={`btn btn-sm flex-1 ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`}>
            <BookOpen className="w-3.5 h-3.5" /> Paste Text
          </button>
          <button onClick={() => setMode('pdf')}
            className={`btn btn-sm flex-1 ${mode === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}>
            <Upload className="w-3.5 h-3.5" /> Upload PDF
          </button>
        </div>

        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Topic (optional)</label>
            <input className="input" placeholder="e.g., Binary Trees, Acid Properties..." value={topic} onChange={e => setTopic(e.target.value)} />
          </div>

          {mode === 'text' ? (
            <div className="form-group">
              <label className="label">Notes Content *</label>
              <textarea
                className="input min-h-[180px] resize-y"
                placeholder="Paste your notes here... (minimum 10 characters)"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">{text.length} characters</p>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
              onClick={() => document.getElementById('pdf-upload').click()}
            >
              <input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  <span className="font-medium text-slate-900 dark:text-white">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="text-red-500 text-xs ml-2">×</button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-slate-500 text-sm">Click to upload PDF</p>
                  <p className="text-slate-400 text-xs mt-1">Max 20MB</p>
                </>
              )}
            </div>
          )}

          <button id="summarize-btn" onClick={summarize} disabled={loading} className="btn btn-primary w-full">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Summarizing with Gemini...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Summarize Notes</>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          <div className="card p-5 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/10 border border-cyan-100 dark:border-cyan-900/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 dark:text-white">{result.title}</h4>
              <span className={`badge ${difficultyColor[result.difficulty] || 'badge-info'}`}>{result.difficulty}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.summary}</p>
          </div>

          {result.keyPoints?.length > 0 && (
            <div className="card p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Key Points
              </h4>
              <ul className="space-y-2">
                {result.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.importantTerms?.length > 0 && (
            <div className="card p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">📚 Important Terms</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.importantTerms.map((t, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="font-semibold text-primary-600 dark:text-primary-400 text-sm">{t.term}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.examTips?.length > 0 && (
            <div className="card p-5 border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Exam Tips
              </h4>
              <ul className="space-y-1.5">
                {result.examTips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-amber-500">→</span> {tip}
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

import { useState, useEffect } from 'react'
import { TrendingUp, Sparkles, AlertTriangle, CheckCircle, Target, Zap, Star } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function PerformanceAdvisor() {
  const { user } = useAuth()
  const [marksData, setMarksData] = useState([])
  const [attendanceData, setAttendanceData] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/marks'),
      api.get('/attendance/summary')
    ]).then(([marksRes, attRes]) => {
      setMarksData(marksRes.data)
      setAttendanceData(attRes.data)
    }).catch(() => toast.error('Failed to load performance data'))
      .finally(() => setDataLoading(false))
  }, [])

  const analyze = async () => {
    if (marksData.length === 0 && attendanceData.length === 0) { toast.error('No data found to analyze'); return }

    setLoading(true)
    try {
      const res = await api.post('/ai/performance-advisor', {
        marksData,
        attendanceData,
        studentName: user?.name
      })
      setAnalysis(res.data.analysis)
      toast.success('Performance analysis complete!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed')
    } finally { setLoading(false) }
  }

  const gradeColor = { 'A+': 'text-emerald-500', A: 'text-emerald-500', B: 'text-blue-500', C: 'text-amber-500', D: 'text-orange-500', F: 'text-red-500' }
  const priorityColor = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-info' }
  const statusColor = { excellent: 'badge-success', good: 'badge-info', average: 'badge-warning', poor: 'badge-danger' }

  return (
    <div className="space-y-5">
      <div className="ai-card rounded-2xl p-5">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-amber-500" /> Performance Advisor
        </h3>

        {dataLoading ? (
          <div className="skeleton h-16 rounded-xl" />
        ) : (
          <div className="mb-5 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">{marksData.length} marks records loaded</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">{attendanceData.length} subjects' attendance loaded</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Your academic data is ready. Click below to get an AI-powered analysis and personalized recommendations.</p>
          </div>
        )}

        <button id="analyze-performance-btn" onClick={analyze} disabled={loading || dataLoading} className="btn btn-primary w-full">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing with Gemini...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Analyze My Performance</>
          )}
        </button>
      </div>

      {/* Analysis output */}
      {analysis && (
        <div className="space-y-4 animate-slide-up">
          {/* Grade card */}
          <div className="card p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={`text-6xl font-extrabold ${gradeColor[analysis.overallGrade] || 'text-slate-900'}`}>{analysis.overallGrade}</p>
                <p className="text-xs text-slate-500 mt-1">Overall Grade</p>
              </div>
              <div className="h-14 w-px bg-amber-200 dark:bg-amber-800" />
              <div className="flex-1">
                <p className={`text-4xl font-extrabold ${gradeColor[analysis.overallGrade] || 'text-slate-900 dark:text-white'}`}>
                  {analysis.overallPercentage?.toFixed(1)}%
                </p>
                <p className="text-slate-500 text-sm mt-1">Combined average</p>
                {analysis.attendanceAlert && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Attendance below 75%!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" /> Strengths
              </h4>
              <ul className="space-y-2">
                {analysis.strengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h4 className="font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Areas to Improve
              </h4>
              <ul className="space-y-2">
                {analysis.weaknesses?.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Target className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div className="card p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Action Plan
              </h4>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className={`badge flex-shrink-0 mt-0.5 ${priorityColor[rec.priority] || 'badge-info'}`}>{rec.priority}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">{rec.category}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">{rec.action}</p>
                      {rec.timeframe && <p className="text-xs text-slate-400 mt-1">⏱ {rec.timeframe}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject Insights */}
          {analysis.subjectInsights?.length > 0 && (
            <div className="card p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">📊 Subject-wise Insights</h4>
              <div className="space-y-3">
                {analysis.subjectInsights.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{s.subject}</p>
                      <span className={`badge ${statusColor[s.status] || 'badge-info'} capitalize`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.insight}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">→ {s.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivational message */}
          {analysis.motivationalMessage && (
            <div className="card p-5 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/10 border border-primary-100 dark:border-primary-900/30">
              <p className="text-center text-slate-700 dark:text-slate-300 italic text-sm">💬 "{analysis.motivationalMessage}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

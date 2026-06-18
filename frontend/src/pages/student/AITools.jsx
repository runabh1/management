import { useState } from 'react'
import { Sparkles, Brain, FileText, HelpCircle, TrendingUp } from 'lucide-react'
import StudyPlanner from '../../components/ai/StudyPlanner'
import NotesSummarizer from '../../components/ai/NotesSummarizer'
import QuestionGenerator from '../../components/ai/QuestionGenerator'
import PerformanceAdvisor from '../../components/ai/PerformanceAdvisor'

const TOOLS = [
  {
    id: 'planner',
    label: 'Study Planner',
    desc: 'Generate a personalized day-by-day study schedule for your exams',
    icon: Brain,
    gradient: 'from-violet-500 to-purple-600',
    component: StudyPlanner
  },
  {
    id: 'summarizer',
    label: 'Notes Summarizer',
    desc: 'Paste your notes or upload a PDF and get key points instantly',
    icon: FileText,
    gradient: 'from-cyan-500 to-blue-600',
    component: NotesSummarizer
  },
  {
    id: 'questions',
    label: 'Question Generator',
    desc: 'Generate MCQs, short & long answer questions on any topic',
    icon: HelpCircle,
    gradient: 'from-emerald-500 to-teal-600',
    component: QuestionGenerator
  },
  {
    id: 'advisor',
    label: 'Performance Advisor',
    desc: 'Get AI insights on your academic performance with actionable tips',
    icon: TrendingUp,
    gradient: 'from-amber-500 to-orange-600',
    component: PerformanceAdvisor
  }
]

export default function AITools() {
  const [activeTool, setActiveTool] = useState('planner')
  const ActiveComponent = TOOLS.find(t => t.id === activeTool)?.component

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="ai-card rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-purple">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">AI Study Hub</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Powered by Gemini 3.5 Flash</p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Use AI to supercharge your studies — generate study plans, summarize notes, create practice questions, and get personalized performance insights.
        </p>
      </div>

      {/* Tool selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TOOLS.map(tool => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id
          return (
            <button
              key={tool.id}
              id={`ai-tool-${tool.id}`}
              onClick={() => setActiveTool(tool.id)}
              className={`p-4 rounded-2xl text-left transition-all border ${isActive
                  ? 'bg-white dark:bg-slate-800 border-primary-300 dark:border-primary-700 shadow-card-hover'
                  : 'card hover:shadow-card-hover border-transparent'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-3 ${isActive ? 'shadow-sm' : ''}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className={`font-bold text-sm ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-900 dark:text-white'}`}>{tool.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{tool.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Active tool */}
      <div className="animate-fade-in">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}

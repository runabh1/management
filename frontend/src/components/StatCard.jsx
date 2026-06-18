import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend, className = '' }) {
  const colors = {
    primary:  { bg: 'from-primary-500 to-violet-600', light: 'bg-primary-50 dark:bg-primary-900/20',  text: 'text-primary-600 dark:text-primary-400' },
    success:  { bg: 'from-emerald-500 to-teal-600',   light: 'bg-emerald-50 dark:bg-emerald-900/20',  text: 'text-emerald-600 dark:text-emerald-400' },
    warning:  { bg: 'from-amber-500 to-orange-600',   light: 'bg-amber-50 dark:bg-amber-900/20',      text: 'text-amber-600 dark:text-amber-400' },
    danger:   { bg: 'from-red-500 to-rose-600',       light: 'bg-red-50 dark:bg-red-900/20',          text: 'text-red-600 dark:text-red-400' },
    info:     { bg: 'from-sky-500 to-blue-600',       light: 'bg-sky-50 dark:bg-sky-900/20',          text: 'text-sky-600 dark:text-sky-400' },
    violet:   { bg: 'from-violet-500 to-purple-600',  light: 'bg-violet-50 dark:bg-violet-900/20',    text: 'text-violet-600 dark:text-violet-400' }
  }
  const c = colors[color] || colors.primary
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-slate-400'

  return (
    <div className={`card p-5 animate-fade-in ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center flex-shrink-0 ml-3 shadow-sm`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

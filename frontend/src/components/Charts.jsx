import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '12px',
    padding: '10px 14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    fontSize: '12px',
    color: '#e2e8f0'
  },
  labelStyle: { color: '#a5b4fc', fontWeight: 600 }
}

// ─── Attendance Bar Chart ──────────────────────────────────────
export function AttendanceBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
          tickFormatter={v => v.length > 8 ? v.substring(0, 8) + '…' : v} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]}
          tickFormatter={v => `${v}%`} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
        <Bar dataKey="percentage" fill="url(#attendanceGrad)" radius={[6, 6, 0, 0]} maxBarSize={50} />
        <defs>
          <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Marks Bar Chart ───────────────────────────────────────────
export function MarksBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
          tickFormatter={v => v.length > 8 ? v.substring(0, 8) + '…' : v} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]}
          tickFormatter={v => `${v}%`} />
        <Tooltip {...tooltipStyle} formatter={(v, n) => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, n]} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="avg_pct" name="Avg %" fill="url(#marksGrad)" radius={[6,6,0,0]} maxBarSize={50} />
        <defs>
          <linearGradient id="marksGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Attendance Trend Line ─────────────────────────────────────
export function AttendanceTrendLine({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        <Line type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Present" />
        <Line type="monotone" dataKey="absent"  stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Absent" />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Subject Pie Chart ─────────────────────────────────────────
export function AttendancePieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={4}
          dataKey="percentage"
          nameKey="subject"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }}
          formatter={(v) => v.length > 12 ? v.substring(0, 12) + '…' : v} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Radial Progress ───────────────────────────────────────────
export function RadialProgress({ value, max = 100, color = '#6366f1', label, size = 120 }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width={size} height={size}>
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: pct, fill: color }]} startAngle={90} endAngle={90 - (pct * 3.6)}>
          <RadialBar dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-slate-900 dark:text-white">{pct}%</span>
        {label && <span className="text-[10px] text-slate-500 mt-0.5">{label}</span>}
      </div>
    </div>
  )
}

// ─── Multi-Subject Marks Line ──────────────────────────────────
export function MarksLineChart({ data }) {
  // data: [{subject, quiz, midterm, final}]
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
          tickFormatter={v => v.length > 8 ? v.substring(0, 8) + '…' : v} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
        <Line type="monotone" dataKey="quiz"    stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="Quiz" />
        <Line type="monotone" dataKey="midterm" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Midterm" />
        <Line type="monotone" dataKey="final"   stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Final" />
      </LineChart>
    </ResponsiveContainer>
  )
}

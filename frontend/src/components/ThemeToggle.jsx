import { Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('sc_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      id="theme-toggle"
      onClick={() => setDark(d => !d)}
      className="relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0"
      style={{ background: dark ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }}
      aria-label="Toggle dark mode"
    >
      <span className={`
        absolute top-0.5 w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-all duration-300
        ${dark ? 'left-7 bg-slate-900' : 'left-0.5 bg-white'}
      `}>
        {dark
          ? <Moon className="w-3.5 h-3.5 text-primary-400" />
          : <Sun className="w-3.5 h-3.5 text-amber-500" />
        }
      </span>
    </button>
  )
}

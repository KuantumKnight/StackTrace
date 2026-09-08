import { useEffect, useMemo, useState } from 'react'
import { ArrowUpIcon, CommandIcon, LayersIcon, MoonIcon, SearchIcon, SunIcon } from './LucideIcons'

type Theme = 'paper' | 'glass' | 'night'

const commands = [
  { id: 'debug', label: 'Open debugger', hint: 'D', action: () => document.querySelector<HTMLElement>('[aria-label="Open StackTrace debugger"]')?.click() },
  { id: 'learn', label: 'Open Learn', hint: 'L', action: () => document.querySelector<HTMLElement>('nav button:nth-child(2)')?.click() },
  { id: 'build', label: 'Open Build', hint: 'B', action: () => document.querySelector<HTMLElement>('nav button:nth-child(3)')?.click() },
  { id: 'practice', label: 'Open Practice', hint: 'P', action: () => document.querySelector<HTMLElement>('nav button:nth-child(4)')?.click() },
  { id: 'top', label: 'Back to top', hint: '↑', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
]

function readTheme(): Theme {
  const saved = window.localStorage.getItem('stacktrace-theme') as Theme | null
  if (saved === 'paper' || saved === 'glass' || saved === 'night') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'glass'
}

function themeLabel(theme: Theme) {
  if (theme === 'paper') return 'Paper'
  if (theme === 'night') return 'Night'
  return 'Glass'
}

export function ExperienceLayer() {
  const [theme, setTheme] = useState<Theme>(() => readTheme())
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return normalized ? commands.filter((command) => command.label.toLowerCase().includes(normalized)) : commands
  }, [query])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('stacktrace-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const root = document.documentElement
    const onScroll = () => {
      const max = Math.max(root.scrollHeight - window.innerHeight, 1)
      const progress = Math.min(1, window.scrollY / max)
      setScrollProgress(progress)
      setShowTop(window.scrollY > 720)
      root.dataset.scrolled = window.scrollY > 24 ? 'true' : 'false'
      root.style.setProperty('--scroll-y', `${window.scrollY}px`)
      root.style.setProperty('--scroll-progress', String(progress))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((value) => !value)
      }
      if (event.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (!window.matchMedia('(pointer: fine)').matches) return

    const cursor = document.createElement('div')
    cursor.className = 'custom-cursor'
    const dot = document.createElement('div')
    dot.className = 'custom-cursor-dot'
    document.body.append(cursor, dot)

    const onMove = (event: PointerEvent) => {
      root.style.setProperty('--cursor-x', `${event.clientX}px`)
      root.style.setProperty('--cursor-y', `${event.clientY}px`)
      const interactive = (event.target as HTMLElement | null)?.closest('button, a, input, textarea, select, [role="button"], [role="tab"]')
      root.dataset.cursorHover = interactive ? 'true' : 'false'
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cursor.remove()
      dot.remove()
      delete root.dataset.cursorHover
    }
  }, [])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('.hero-run, .primary-control, .load-button'))
    const cleanups = buttons.map((button) => {
      const move = (event: PointerEvent) => {
        const rect = button.getBoundingClientRect()
        const x = (event.clientX - rect.left - rect.width / 2) * 0.08
        const y = (event.clientY - rect.top - rect.height / 2) * 0.08
        button.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
      const leave = () => { button.style.transform = '' }
      button.addEventListener('pointermove', move)
      button.addEventListener('pointerleave', leave)
      return () => {
        button.removeEventListener('pointermove', move)
        button.removeEventListener('pointerleave', leave)
      }
    })
    return () => cleanups.forEach((cleanup) => cleanup())
  })

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>('.workspace-hero, .learning-thread, .workspace-stage, .playback-dock, .inspector-shell, .panel, .learn-workspace > *, .challenge-workspace > *, .examples-workspace > *'))
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealTargets.forEach((element) => element.classList.add('is-revealed'))
      return
    }
    revealTargets.forEach((element, index) => {
      element.classList.add('reveal-ready')
      element.style.setProperty('--reveal-order', String(index % 5))
    })
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ;(entry.target as HTMLElement).classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' })
    revealTargets.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  })

  const cycleTheme = () => {
    setTheme((current) => {
      const next = current === 'paper' ? 'glass' : current === 'glass' ? 'night' : 'paper'
      setToast(`${themeLabel(next)} theme enabled`)
      return next
    })
  }

  const themeIcon = theme === 'night' ? <MoonIcon /> : theme === 'paper' ? <SunIcon /> : <LayersIcon />

  return (
    <>
      <div className="scroll-progress" aria-hidden="true"><span style={{ transform: `scaleX(${scrollProgress})` }} /></div>

      <div className="experience-controls" aria-label="Experience controls">
        <button className="icon-button theme-button" type="button" onClick={cycleTheme} aria-label={`Theme: ${themeLabel(theme)}. Change theme`} title={`Theme: ${themeLabel(theme)}`}>
          {themeIcon}
        </button>
        <button className="command-button" type="button" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
          <SearchIcon /><span>Search</span><kbd><CommandIcon />K</kbd>
        </button>
      </div>

      {showTop && <button className="back-to-top" type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUpIcon /></button>}

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}

      {paletteOpen && (
        <div className="command-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setPaletteOpen(false) }}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
            <div className="command-search">
              <SearchIcon />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a StackTrace tool…" aria-label="Search commands" />
              <kbd>ESC</kbd>
            </div>
            <div className="command-list">
              {filteredCommands.map((command) => (
                <button key={command.id} type="button" onClick={() => { command.action(); setPaletteOpen(false); setQuery(''); setToast(command.label) }}>
                  <span>{command.label}</span><kbd>{command.hint}</kbd>
                </button>
              ))}
              {!filteredCommands.length && <p>No matching command.</p>}
            </div>
            <footer><span>StackTrace command center</span><span>Ctrl/⌘ K anywhere</span></footer>
          </section>
        </div>
      )}

      <footer className="global-footer">
        <div>
          <strong>StackTrace</strong>
          <span>CFG + PDA visual debugger</span>
        </div>
        <nav aria-label="Footer links">
          <button type="button" onClick={() => document.querySelector<HTMLElement>('nav button:nth-child(2)')?.click()}>Learn</button>
          <button type="button" onClick={() => document.querySelector<HTMLElement>('nav button:nth-child(3)')?.click()}>Build</button>
          <button type="button" onClick={() => document.querySelector<HTMLElement>('nav button:nth-child(4)')?.click()}>Practice</button>
        </nav>
        <span className="footer-note">Built for understanding formal languages, not hiding them.</span>
      </footer>
    </>
  )
}

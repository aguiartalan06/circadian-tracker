import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'
import { sortPeriodsByTime, getCurrentPeriod } from './utils/circadian'
import {
  loadLogs, saveLogs, todayKey, logPeriod,
  getPeriodStatus, getStreak, getUnpromptedPeriodId,
  getWindow, getWindowPhase, getDayScore,
} from './utils/logs'
import Onboarding from './components/Onboarding'
import AnalogClock from './components/AnalogClock'
import LinearClock from './components/LinearClock'
import PeriodLegend from './components/PeriodLegend'
import SettingsPanel from './components/SettingsPanel'
import LogPrompt from './components/LogPrompt'
import DayScore from './components/DayScore'
import CalendarView from './components/CalendarView'
import LearnView from './components/LearnView'

const DEFAULT_PERIODS = [
  { id: 'wake',           label: 'Wake Time',     time: '06:00', color: '#f59e0b',
    description: 'Cortisol surges. Get morning light within 30 min to anchor your rhythm.' },
  { id: 'daylight',       label: 'Daylight',       time: '07:00', color: '#fbbf24',
    description: 'Natural light resets your clock. Step outside for at least 5 minutes.' },
  { id: 'breakfast',      label: 'Breakfast',      time: '07:30', color: '#fb923c',
    description: 'Break your fast after first light for optimal metabolic signaling.' },
  { id: 'peak-cognitive', label: 'Peak Cognitive', time: '10:00', color: '#facc15',
    description: 'Core body temperature rises. Tackle deep work and complex thinking now.' },
  { id: 'lunch',          label: 'Lunch',          time: '12:00', color: '#a3e635',
    description: 'Sustain your afternoon with a balanced meal near solar midday.' },
  { id: 'peak-exercise',  label: 'Peak Exercise',  time: '17:00', color: '#34d399',
    description: 'Reaction time, strength, and cardiovascular efficiency peak here.' },
  { id: 'dinner',         label: 'Dinner',         time: '18:30', color: '#f97316',
    description: 'Eat while daylight fades. Digestion slows significantly after sunset.' },
  { id: 'fasting-start',  label: 'Fasting Start',  time: '20:00', color: '#c084fc',
    description: 'Begin your overnight fast. Your gut and liver need darkness to repair.' },
  { id: 'nightfall',      label: 'Nightfall',      time: '20:30', color: '#818cf8',
    description: 'Avoid blue light. Switch to amber lighting to protect melatonin.' },
  { id: 'bedtime',        label: 'Bedtime',        time: '22:30', color: '#6366f1',
    description: 'Consistent sleep timing matters more than duration for quality rest.' },
  { id: 'fasting-end',    label: 'Fasting End',    time: '06:30', color: '#38bdf8',
    description: 'Your overnight fast is complete. Hydrate well before eating.' },
]

function loadPeriods() {
  try {
    const stored = localStorage.getItem('circadian-periods')
    if (!stored) return DEFAULT_PERIODS
    const parsed = JSON.parse(stored)
    const storedById = Object.fromEntries(parsed.map(p => [p.id, p]))
    return DEFAULT_PERIODS.map(d => ({
      ...d,
      ...(storedById[d.id] ? { time: storedById[d.id].time } : {}),
    }))
  } catch {
    return DEFAULT_PERIODS
  }
}

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem('circadian-user') || '{}')
  } catch {
    return {}
  }
}

function getGreeting(now) {
  const h = now.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function applySchedule(periods, wakeTime, bedtime) {
  return periods.map(p => {
    if (p.id === 'wake') return { ...p, time: wakeTime }
    if (p.id === 'bedtime') return { ...p, time: bedtime }
    return p
  })
}

export default function App() {
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('circadian-onboarded'))
  const [userName, setUserName] = useState(() => loadUser().name || '')
  const [view, setView] = useState(() => localStorage.getItem('circadian-view') || 'analog')
  const [periods, setPeriods] = useState(loadPeriods)
  const [now, setNow] = useState(new Date())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logs, setLogs] = useState(loadLogs)
  const [promptPeriodId, setPromptPeriodId] = useState(null)
  const autoPromptedRef = useRef(new Set())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem('circadian-periods', JSON.stringify(periods))
  }, [periods])

  useEffect(() => {
    localStorage.setItem('circadian-view', view)
  }, [view])

  useEffect(() => {
    saveLogs(logs)
  }, [logs])

  const sortedPeriods = useMemo(() => sortPeriodsByTime(periods), [periods])
  const currentPeriod = useMemo(() => getCurrentPeriod(sortedPeriods, now), [sortedPeriods, now])
  const dateKey = todayKey(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const todayScore = useMemo(
    () => getDayScore(sortedPeriods, dateKey, logs, now),
    [sortedPeriods, dateKey, logs, now],
  )

  const getStatus = useCallback(
    (periodId) => getPeriodStatus(sortedPeriods, periodId, nowMin, logs, dateKey),
    [sortedPeriods, nowMin, logs, dateKey],
  )
  const getStreakFor = useCallback(
    (periodId) => getStreak(logs, periodId, dateKey),
    [logs, dateKey],
  )

  // Auto-prompt: when a window ends without being logged, open the prompt once per session.
  useEffect(() => {
    if (!onboarded) return
    if (promptPeriodId) return
    const id = getUnpromptedPeriodId(sortedPeriods, nowMin, logs, dateKey, null)
    if (id && !autoPromptedRef.current.has(id)) {
      autoPromptedRef.current.add(id)
      setPromptPeriodId(id)
    }
  }, [onboarded, sortedPeriods, nowMin, logs, dateKey, promptPeriodId])

  function handlePeriodChange(id, newTime) {
    setPeriods(prev => prev.map(p => p.id === id ? { ...p, time: newTime } : p))
  }

  function handleOnboardingComplete({ name, wakeTime, bedtime }) {
    const displayName = name || 'Friend'
    localStorage.setItem('circadian-user', JSON.stringify({ name: displayName }))
    localStorage.setItem('circadian-onboarded', '1')
    setPeriods(prev => applySchedule(prev, wakeTime, bedtime))
    setUserName(displayName)
    setOnboarded(true)
  }

  function handleOpenPrompt(periodId) {
    setPromptPeriodId(periodId)
  }

  function handleLog(status) {
    if (!promptPeriodId) return
    setLogs(prev => logPeriod(prev, dateKey, promptPeriodId, status, now))
    setPromptPeriodId(null)
  }

  const promptPeriod = promptPeriodId
    ? sortedPeriods.find(p => p.id === promptPeriodId)
    : null
  const promptPhase = promptPeriod
    ? getWindowPhase(getWindow(sortedPeriods, promptPeriod.id), nowMin)
    : 'future'

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">Circadian</h1>
          {userName && (
            <p className="app-greeting">{getGreeting(now)}, {userName.split(' ')[0]}</p>
          )}
        </div>
        <div className="view-toggle">
          <button
            className={`toggle-btn${view === 'analog' ? ' toggle-btn--active' : ''}`}
            onClick={() => setView('analog')}
          >
            Analog
          </button>
          <button
            className={`toggle-btn${view === 'linear' ? ' toggle-btn--active' : ''}`}
            onClick={() => setView('linear')}
          >
            Linear
          </button>
          <button
            className={`toggle-btn${view === 'calendar' ? ' toggle-btn--active' : ''}`}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
          <button
            className={`toggle-btn${view === 'learn' ? ' toggle-btn--active' : ''}`}
            onClick={() => setView('learn')}
          >
            Learn
          </button>
        </div>
      </header>

      <main className="app-main">
        {view !== 'calendar' && view !== 'learn' && currentPeriod && (
          <button
            type="button"
            className="current-period-badge"
            style={{ '--period-color': currentPeriod.color }}
            onClick={() => handleOpenPrompt(currentPeriod.id)}
            aria-label={`Log ${currentPeriod.label}`}
          >
            <span className="current-period-dot" />
            <span className="current-period-label">{currentPeriod.label}</span>
            <span className="current-period-hint">· Tap to log</span>
          </button>
        )}

        {view !== 'calendar' && view !== 'learn' && <DayScore result={todayScore} />}

        {view === 'analog' && (
          <AnalogClock
            periods={sortedPeriods}
            now={now}
            currentPeriod={currentPeriod}
            getStatus={getStatus}
          />
        )}
        {view === 'linear' && (
          <LinearClock
            periods={sortedPeriods}
            now={now}
            getStatus={getStatus}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            sortedPeriods={sortedPeriods}
            logs={logs}
            now={now}
          />
        )}
        {view === 'learn' && <LearnView />}

        {view !== 'calendar' && view !== 'learn' && (
          <PeriodLegend
            periods={sortedPeriods}
            currentPeriodId={currentPeriod?.id}
            getStatus={getStatus}
            getStreak={getStreakFor}
            onOpenPrompt={handleOpenPrompt}
          />
        )}
      </main>

      <footer className="app-footer">
        <SettingsPanel
          periods={periods}
          onPeriodChange={handlePeriodChange}
          onReset={() => setPeriods(DEFAULT_PERIODS)}
          isOpen={settingsOpen}
          onToggle={() => setSettingsOpen(o => !o)}
        />
      </footer>

      {promptPeriod && (
        <LogPrompt
          period={promptPeriod}
          sortedPeriods={sortedPeriods}
          windowPhase={promptPhase}
          onLog={handleLog}
          onDismiss={() => setPromptPeriodId(null)}
        />
      )}
    </div>
  )
}

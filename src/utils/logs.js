import { timeToMinutes } from './circadian'

const STORAGE_KEY = 'circadian-logs'

export function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function todayKey(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysKey(key, delta) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  return todayKey(date)
}

// Window for a given period: from its own time to the next sorted period's time.
// endMin may be > 1440 when wrapping past midnight.
export function getWindow(sortedPeriods, periodId) {
  const idx = sortedPeriods.findIndex(p => p.id === periodId)
  if (idx === -1) return null
  const startMin = timeToMinutes(sortedPeriods[idx].time)
  const next = sortedPeriods[(idx + 1) % sortedPeriods.length]
  let endMin = timeToMinutes(next.time)
  if (endMin <= startMin) endMin += 24 * 60
  return { startMin, endMin }
}

// Phase of a window given the current time in minutes (0-1439).
// Returns 'past' | 'active' | 'future'.
export function getWindowPhase(win, nowMin) {
  if (!win) return 'future'
  const { startMin, endMin } = win
  // Window may extend past 1440 (wraps midnight). Also consider nowMin "wrap-adjusted":
  // if startMin > nowMin but the window wraps, nowMin < endMin - 1440 means active.
  if (nowMin >= startMin && nowMin < endMin) return 'active'
  if (endMin > 1440 && nowMin < endMin - 1440) return 'active'
  if (nowMin >= endMin && endMin <= 1440) return 'past'
  // For wrapping windows, "past" is when we've crossed endMin (unreachable in 24h cycle
  // without date change, so treat other cases as future/pending).
  if (nowMin < startMin) return 'future'
  return 'past'
}

// Status for rendering. Checks logs[dateKey][periodId] first, falls back to phase.
export function getPeriodStatus(sortedPeriods, periodId, nowMin, logs, dateKey) {
  const entry = logs?.[dateKey]?.[periodId]
  if (entry?.status) return `logged-${entry.status}`
  const win = getWindow(sortedPeriods, periodId)
  const phase = getWindowPhase(win, nowMin)
  if (phase === 'active') return 'active'
  if (phase === 'past') return 'needs-log'
  return 'pending'
}

export function logPeriod(logs, dateKey, periodId, status, now = new Date()) {
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return {
    ...logs,
    [dateKey]: {
      ...(logs[dateKey] || {}),
      [periodId]: { status, at: `${hh}:${mm}` },
    },
  }
}

// Walk backward from today computing a streak. Any non-skipped log increments.
// Skipped or (unlogged AND window is past) breaks. Today's pending/active doesn't break.
// Cap the walk at 365 days so we don't loop forever on fresh installs.
export function getStreak(logs, periodId, today = todayKey()) {
  let streak = 0
  let key = today
  for (let i = 0; i < 365; i++) {
    const entry = logs?.[key]?.[periodId]
    if (entry?.status === 'skipped') break
    if (entry?.status) {
      streak += 1
    } else {
      // Unlogged. If this is today, don't break — window may still be active/future.
      if (i === 0) {
        key = addDaysKey(key, -1)
        continue
      }
      break
    }
    key = addDaysKey(key, -1)
  }
  return streak
}

// Per-status weight out of 100. on-time = full credit; early/late = partial; skipped = 0.
const SCORE_WEIGHTS = { 'on-time': 100, 'early': 65, 'late': 65, 'skipped': 0 }

// Score for a given day.
// Returns null for future dates. For today, denominator = periods whose window has ended
// OR have a log entry (so the score reflects progress so far).
// For past days, denominator = all periods (fully baked day).
// Unlogged past windows count as 0.
export function getDayScore(sortedPeriods, dateKey, logs, now = new Date()) {
  const today = todayKey(now)
  if (dateKey > today) return null
  const isToday = dateKey === today
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const dateLogs = logs[dateKey] || {}

  let sum = 0
  let counted = 0
  const breakdown = { onTime: 0, early: 0, late: 0, skipped: 0, unlogged: 0 }

  for (const p of sortedPeriods) {
    const entry = dateLogs[p.id]
    if (entry) {
      counted++
      const s = entry.status
      sum += SCORE_WEIGHTS[s] ?? 0
      if (s === 'on-time') breakdown.onTime++
      else if (s === 'early') breakdown.early++
      else if (s === 'late') breakdown.late++
      else if (s === 'skipped') breakdown.skipped++
      continue
    }
    if (!isToday) {
      counted++
      breakdown.unlogged++
      continue
    }
    const win = getWindow(sortedPeriods, p.id)
    if (!win) continue
    if (getWindowPhase(win, nowMin) === 'past') {
      counted++
      breakdown.unlogged++
    }
  }

  if (counted === 0) return null
  return {
    score: Math.round(sum / counted),
    counted,
    logged: breakdown.onTime + breakdown.early + breakdown.late + breakdown.skipped,
    total: sortedPeriods.length,
    breakdown,
  }
}

// Build a list of day scores for a given calendar month.
// year is full year (e.g. 2026); month is 0-11.
export function getMonthScores(sortedPeriods, logs, year, month, now = new Date()) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    const key = todayKey(dt)
    const result = getDayScore(sortedPeriods, key, logs, now)
    days.push({
      date: d,
      dateKey: key,
      weekday: dt.getDay(),
      isFuture: key > todayKey(now),
      score: result?.score ?? null,
      logged: result?.logged ?? 0,
      total: result?.total ?? sortedPeriods.length,
      breakdown: result?.breakdown ?? null,
    })
  }
  const scored = days.filter(d => d.score !== null && !d.isFuture)
  const avg = scored.length
    ? Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length)
    : null
  return {
    year,
    month,
    firstWeekday: first.getDay(),
    days,
    average: avg,
    scoredDays: scored.length,
  }
}

// Decide whether to auto-prompt. Returns the most recently ended un-logged period,
// or null. lastPromptedId prevents re-prompting the same period within a session.
export function getUnpromptedPeriodId(sortedPeriods, nowMin, logs, dateKey, lastPromptedId) {
  let best = null
  let bestEnd = -1
  for (const p of sortedPeriods) {
    const win = getWindow(sortedPeriods, p.id)
    if (!win) continue
    const phase = getWindowPhase(win, nowMin)
    if (phase !== 'past') continue
    if (logs?.[dateKey]?.[p.id]) continue
    if (p.id === lastPromptedId) continue
    if (win.endMin > bestEnd) {
      bestEnd = win.endMin
      best = p.id
    }
  }
  return best
}

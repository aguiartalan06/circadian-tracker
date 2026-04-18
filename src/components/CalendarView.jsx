import { useMemo, useState } from 'react'
import { getMonthScores, getDayScore, todayKey } from '../utils/logs'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function scoreBand(score) {
  if (score == null) return 'empty'
  if (score >= 85) return 'high'
  if (score >= 65) return 'mid'
  if (score >= 40) return 'low'
  return 'poor'
}

function formatDateLong(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const STATUS_LABEL = {
  'on-time':  { label: 'On time', cls: 'on-time' },
  'early':    { label: 'Early',   cls: 'early' },
  'late':     { label: 'Late',    cls: 'late' },
  'skipped':  { label: 'Skipped', cls: 'skipped' },
}

export default function CalendarView({ sortedPeriods, logs, now }) {
  const today = todayKey(now)
  const [cursor, setCursor] = useState(() => ({
    year: now.getFullYear(),
    month: now.getMonth(),
  }))
  const [selectedKey, setSelectedKey] = useState(today)

  const monthData = useMemo(
    () => getMonthScores(sortedPeriods, logs, cursor.year, cursor.month, now),
    [sortedPeriods, logs, cursor.year, cursor.month, now],
  )

  const selectedResult = useMemo(
    () => selectedKey ? getDayScore(sortedPeriods, selectedKey, logs, now) : null,
    [sortedPeriods, selectedKey, logs, now],
  )

  const selectedDayLogs = selectedKey ? (logs[selectedKey] || {}) : {}

  function shiftMonth(delta) {
    setCursor(c => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  // Build a 6x7 grid of slots (some empty at start/end)
  const slots = []
  for (let i = 0; i < monthData.firstWeekday; i++) slots.push(null)
  for (const day of monthData.days) slots.push(day)
  while (slots.length % 7 !== 0) slots.push(null)

  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth()

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">◀</button>
        <div className="calendar-title">
          <span className="calendar-month">{MONTHS[cursor.month]} {cursor.year}</span>
          {monthData.average !== null && (
            <span className="calendar-avg" title={`Average across ${monthData.scoredDays} logged days`}>
              Avg <strong>{monthData.average}</strong> / 100
            </span>
          )}
        </div>
        <button className="calendar-nav" onClick={() => shiftMonth(1)} aria-label="Next month">▶</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map(w => (
          <div key={w} className="calendar-weekday">{w}</div>
        ))}
        {slots.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="calendar-cell calendar-cell--empty" />
          const isToday = day.dateKey === today
          const isSelected = day.dateKey === selectedKey
          const band = scoreBand(day.score)
          return (
            <button
              key={day.dateKey}
              type="button"
              className={`calendar-cell calendar-cell--${band}${isToday ? ' calendar-cell--today' : ''}${isSelected ? ' calendar-cell--selected' : ''}${day.isFuture ? ' calendar-cell--future' : ''}`}
              onClick={() => setSelectedKey(day.dateKey)}
              disabled={day.isFuture}
              aria-label={`${formatDateLong(day.dateKey)}${day.score !== null ? `, score ${day.score}` : ''}`}
            >
              <span className="calendar-date">{day.date}</span>
              {day.score !== null && (
                <span className="calendar-score">{day.score}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="calendar-legend" aria-hidden="true">
        <span className="calendar-legend-label">Score:</span>
        <span className="calendar-legend-dot calendar-cell--poor" /><span>0-39</span>
        <span className="calendar-legend-dot calendar-cell--low" /><span>40-64</span>
        <span className="calendar-legend-dot calendar-cell--mid" /><span>65-84</span>
        <span className="calendar-legend-dot calendar-cell--high" /><span>85-100</span>
      </div>

      {selectedKey && (
        <div className="calendar-detail">
          <div className="calendar-detail-header">
            <h3 className="calendar-detail-title">{formatDateLong(selectedKey)}</h3>
            {selectedResult?.score != null ? (
              <div className={`calendar-detail-score calendar-detail-score--${scoreBand(selectedResult.score)}`}>
                <span className="calendar-detail-num">{selectedResult.score}</span>
                <span className="calendar-detail-denom">/ 100</span>
              </div>
            ) : (
              <div className="calendar-detail-score calendar-detail-score--empty">
                {isCurrentMonth && selectedKey > today ? 'Future' : 'No data'}
              </div>
            )}
          </div>

          {selectedResult && selectedResult.counted > 0 && (
            <div className="calendar-detail-meta">
              {selectedResult.logged} of {selectedResult.total} logged
              {selectedResult.breakdown.unlogged > 0 && ` · ${selectedResult.breakdown.unlogged} missed`}
            </div>
          )}

          <ul className="calendar-detail-list">
            {sortedPeriods.map(p => {
              const entry = selectedDayLogs[p.id]
              const info = entry ? STATUS_LABEL[entry.status] : null
              return (
                <li key={p.id} className="calendar-detail-row">
                  <span className="calendar-detail-dot" style={{ background: p.color }} />
                  <span className="calendar-detail-label">{p.label}</span>
                  <span className="calendar-detail-time">{p.time}</span>
                  {info ? (
                    <span className={`calendar-detail-status calendar-detail-status--${info.cls}`}>
                      {info.label}{entry.at ? ` · ${entry.at}` : ''}
                    </span>
                  ) : (
                    <span className="calendar-detail-status calendar-detail-status--none">—</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

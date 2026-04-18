function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

const STATUS_LABEL = {
  'logged-on-time': { char: '✓', cls: 'on-time', title: 'Logged on time' },
  'logged-early':   { char: '←', cls: 'early',   title: 'Logged early' },
  'logged-late':    { char: '→', cls: 'late',    title: 'Logged late' },
  'logged-skipped': { char: '—', cls: 'skipped', title: 'Skipped' },
  'needs-log':      { char: '',  cls: 'needs-log', title: 'Window ended — tap to log' },
}

export default function PeriodLegend({ periods, currentPeriodId, getStatus, getStreak, onOpenPrompt }) {
  return (
    <div className="legend" role="list" aria-label="Circadian periods">
      {periods.map(p => {
        const isActive = p.id === currentPeriodId
        const status = getStatus ? getStatus(p.id) : 'pending'
        const streak = getStreak ? getStreak(p.id) : 0
        const badge = STATUS_LABEL[status]
        const style = { '--item-color': p.color }
        return (
          <button
            type="button"
            key={p.id}
            className={`legend-item${isActive ? ' legend-item--active' : ''}`}
            style={style}
            role="listitem"
            onClick={() => onOpenPrompt?.(p.id)}
            aria-label={`Log ${p.label}`}
          >
            <span className="legend-dot" style={{ backgroundColor: p.color }} aria-hidden="true" />
            <span className="legend-text">
              <span className="legend-label">{p.label}</span>
              {isActive && p.description && (
                <span className="legend-description">{p.description}</span>
              )}
            </span>
            {streak >= 2 && (
              <span className="legend-streak" title={`${streak}-day streak`}>
                <span className="legend-streak-flame" aria-hidden="true">🔥</span>
                {streak}
              </span>
            )}
            {badge && (
              <span
                className={`legend-status legend-status--${badge.cls}`}
                title={badge.title}
                aria-label={badge.title}
              >
                {badge.char}
              </span>
            )}
            <span className="legend-time">{formatTime(p.time)}</span>
          </button>
        )
      })}
    </div>
  )
}

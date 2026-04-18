import { useEffect } from 'react'
import { getWindow } from '../utils/logs'

function fmt12(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`
}

const LABELS = {
  active: {
    title: (p) => `How's ${p.label} going?`,
    'on-time': 'Done now',
    early: 'Already did it earlier',
    late: 'Will do it later',
    skipped: 'Skipping today',
  },
  past: {
    title: (p) => `How did ${p.label} go?`,
    'on-time': 'Did it during the window',
    early: 'Did it before the window',
    late: 'Did it after the window',
    skipped: "Didn't do it",
  },
  future: {
    title: (p) => `Log ${p.label}`,
    'on-time': null, // hidden for future
    early: 'Already did it earlier',
    late: null,
    skipped: 'Skipping today',
  },
}

const ORDER = ['on-time', 'early', 'late', 'skipped']

export default function LogPrompt({ period, sortedPeriods, windowPhase, onLog, onDismiss, isMock = false }) {
  useEffect(() => {
    if (isMock) return
    function onKey(e) {
      if (e.key === 'Escape') onDismiss?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss, isMock])

  if (!period) return null

  const win = getWindow(sortedPeriods, period.id)
  const labels = LABELS[windowPhase] || LABELS.past

  const body = (
    <div
      className="log-prompt-card"
      style={{ '--period-color': period.color }}
      role="dialog"
      aria-modal={!isMock}
      aria-label={labels.title(period)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="log-prompt-header">
        <span className="log-prompt-dot" aria-hidden="true" />
        <div className="log-prompt-title-block">
          <h2 className="log-prompt-title">{labels.title(period)}</h2>
          {win && (
            <p className="log-prompt-window">
              {fmt12(win.startMin)} – {fmt12(win.endMin)}
            </p>
          )}
        </div>
        {!isMock && (
          <button className="log-prompt-close" onClick={onDismiss} aria-label="Dismiss">×</button>
        )}
      </div>

      {period.description && (
        <p className="log-prompt-desc">{period.description}</p>
      )}

      <div className="log-prompt-options">
        {ORDER.map(status => {
          const label = labels[status]
          if (!label) return null
          return (
            <button
              key={status}
              className={`log-prompt-option log-prompt-option--${status}`}
              onClick={() => onLog?.(status)}
              disabled={isMock}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (isMock) return body

  return (
    <div className="log-prompt-backdrop" onClick={onDismiss}>
      {body}
    </div>
  )
}

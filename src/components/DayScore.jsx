function scoreBand(score) {
  if (score === null || score === undefined) return 'empty'
  if (score >= 85) return 'high'
  if (score >= 65) return 'mid'
  if (score >= 40) return 'low'
  return 'poor'
}

export default function DayScore({ result, label = "Today's rhythm", compact = false }) {
  const score = result?.score
  const band = scoreBand(score)
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score))

  return (
    <div className={`day-score day-score--${band}${compact ? ' day-score--compact' : ''}`}>
      <div className="day-score-label">{label}</div>
      <div className="day-score-row">
        <div className="day-score-value">
          <span className="day-score-num">{score == null ? '—' : score}</span>
          <span className="day-score-denom">/ 100</span>
        </div>
        {result && result.counted > 0 && (
          <div className="day-score-meta">
            {result.logged} logged · {result.breakdown.onTime} on-time
            {result.breakdown.early + result.breakdown.late > 0 && (
              <> · {result.breakdown.early + result.breakdown.late} off-window</>
            )}
            {result.breakdown.skipped > 0 && (
              <> · {result.breakdown.skipped} skipped</>
            )}
          </div>
        )}
        {(!result || result.counted === 0) && (
          <div className="day-score-meta">Log a period to start your score</div>
        )}
      </div>
      <div className="day-score-bar" aria-hidden="true">
        <div className="day-score-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

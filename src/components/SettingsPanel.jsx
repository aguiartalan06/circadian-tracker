export default function SettingsPanel({ periods, onPeriodChange, onReset, isOpen, onToggle }) {
  return (
    <div>
      <button
        className="settings-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="settings-panel"
      >
        <span>Schedule Settings</span>
        <span className={`settings-caret${isOpen ? ' settings-caret--open' : ''}`} aria-hidden="true">▼</span>
      </button>

      <div
        id="settings-panel"
        className={`settings-panel${isOpen ? ' settings-panel--open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="settings-inner">
          {periods.map(p => (
            <div key={p.id} className="settings-row">
              <span className="settings-dot" style={{ backgroundColor: p.color }} aria-hidden="true" />
              <label className="settings-label" htmlFor={`time-${p.id}`}>
                {p.label}
              </label>
              <input
                id={`time-${p.id}`}
                className="settings-input"
                type="time"
                value={p.time}
                onChange={e => onPeriodChange(p.id, e.target.value)}
                aria-label={`${p.label} time`}
              />
            </div>
          ))}
        </div>
        <div className="settings-footer">
          <button className="reset-btn" onClick={onReset}>
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}

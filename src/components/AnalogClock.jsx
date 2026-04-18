import { polarToCartesian, arcPath, getSegments, minutesToAngleDeg, timeToMinutes } from '../utils/circadian'

const CX = 250
const CY = 250
const R_OUTER = 230
const R_INNER = 182
const R_TICKS_OUT = 180
const R_TICKS_IN_MAJOR = 165
const R_TICKS_IN_MINOR = 172
const R_HOUR_LABELS = 152
const R_HOUR = 108
const R_MINUTE = 148
const R_SECOND = 157
const R_NOTCH_OUTER = R_OUTER + 8   // period boundary notch: just outside arc
const R_NOTCH_INNER = R_OUTER - 8   // notch inner point: just inside arc outer edge

function pad(n) { return String(n).padStart(2, '0') }

function formatTime(date) {
  const h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`
}

function HourLabels() {
  const labels = []
  for (let h = 0; h < 24; h += 3) {
    const angleDeg = minutesToAngleDeg(h * 60)
    const pos = polarToCartesian(CX, CY, R_HOUR_LABELS, angleDeg)
    const normAngle = ((angleDeg + 90) % 360 + 360) % 360
    const flip = normAngle > 90 && normAngle < 270
    const label = h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`
    labels.push(
      <text
        key={h}
        x={pos.x}
        y={pos.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill="rgba(255,255,255,0.3)"
        transform={flip ? `rotate(180, ${pos.x}, ${pos.y})` : undefined}
      >
        {label}
      </text>
    )
  }
  return <>{labels}</>
}

function Ticks() {
  const ticks = []
  const total = 24 * 4
  for (let i = 0; i < total; i++) {
    const angleDeg = (i / total) * 360 - 90
    const isMajor = i % 4 === 0
    const innerR = isMajor ? R_TICKS_IN_MAJOR : R_TICKS_IN_MINOR
    const p1 = polarToCartesian(CX, CY, R_TICKS_OUT, angleDeg)
    const p2 = polarToCartesian(CX, CY, innerR, angleDeg)
    ticks.push(
      <line
        key={i}
        x1={p1.x} y1={p1.y}
        x2={p2.x} y2={p2.y}
        stroke={isMajor ? 'var(--tick-major)' : 'var(--tick-color)'}
        strokeWidth={isMajor ? 1.5 : 0.8}
      />
    )
  }
  return <>{ticks}</>
}

// Colored notch marks at each period boundary
function PeriodNotches({ periods }) {
  return periods.map(p => {
    const angleDeg = minutesToAngleDeg(timeToMinutes(p.time))
    const outer = polarToCartesian(CX, CY, R_NOTCH_OUTER, angleDeg)
    const inner = polarToCartesian(CX, CY, R_NOTCH_INNER, angleDeg)
    return (
      <line
        key={p.id}
        x1={inner.x} y1={inner.y}
        x2={outer.x} y2={outer.y}
        stroke={p.color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${p.color})` }}
      />
    )
  })
}

function segVisual(status, isActive) {
  if (status === 'logged-on-time') return { fill: 1.0,  glow: 9, stroke: false, className: '' }
  if (status === 'logged-early')   return { fill: 0.85, glow: 5, stroke: false, className: '' }
  if (status === 'logged-late')    return { fill: 0.85, glow: 5, stroke: false, className: '' }
  if (status === 'logged-skipped') return { fill: 0,    glow: 0, stroke: true,  className: '' }
  if (status === 'needs-log')      return { fill: 0.55, glow: 3, stroke: false, className: 'seg-needs-log' }
  if (isActive)                    return { fill: 0.92, glow: 7, stroke: false, className: '' }
  return { fill: 0.6, glow: 3, stroke: false, className: '' }
}

export default function AnalogClock({ periods, now, currentPeriod, getStatus }) {
  const segments = getSegments(periods)

  const totalMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const hourAngle = (totalMinutes / (24 * 60)) * 360 - 90
  const minuteAngle = ((now.getMinutes() * 60 + now.getSeconds()) / 3600) * 360 - 90
  const secondAngle = (now.getSeconds() / 60) * 360 - 90

  const hourEnd = polarToCartesian(CX, CY, R_HOUR, hourAngle)
  const minuteEnd = polarToCartesian(CX, CY, R_MINUTE, minuteAngle)
  const secondEnd = polarToCartesian(CX, CY, R_SECOND, secondAngle)

  return (
    <svg
      className="analog-clock"
      viewBox="-10 -10 520 520"
      aria-label="Analog circadian clock"
      role="img"
    >
      <defs>
        <radialGradient id="face-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1f27" />
          <stop offset="100%" stopColor="#13141a" />
        </radialGradient>
      </defs>

      {/* Face */}
      <circle cx={CX} cy={CY} r={R_OUTER + 2} fill="url(#face-grad)" />
      <circle cx={CX} cy={CY} r={R_OUTER + 2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Colored arc segments — reflect log status */}
      {segments.map((seg) => {
        const isActive = currentPeriod && seg.id === currentPeriod.id
        const status = getStatus ? getStatus(seg.id) : (isActive ? 'active' : 'pending')
        const v = segVisual(status, isActive)
        const d = arcPath(CX, CY, R_OUTER, R_INNER, seg.startDeg, seg.endDeg)
        if (v.stroke) {
          return (
            <path
              key={seg.id}
              d={d}
              fill="none"
              stroke={seg.color}
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          )
        }
        return (
          <path
            key={seg.id}
            className={v.className || undefined}
            d={d}
            fill={seg.color}
            fillOpacity={v.fill}
            style={v.glow ? { filter: `drop-shadow(0 0 ${v.glow}px ${seg.color})` } : undefined}
          />
        )
      })}

      {/* Inner fill */}
      <circle cx={CX} cy={CY} r={R_INNER - 1} fill="url(#face-grad)" />

      {/* Tick marks */}
      <Ticks />

      {/* Hour labels */}
      <HourLabels />

      {/* Period boundary notches */}
      <PeriodNotches periods={periods} />

      {/* Clock hands */}
      <line x1={CX} y1={CY} x2={hourEnd.x} y2={hourEnd.y}
        stroke="var(--hand-color)" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
      <line x1={CX} y1={CY} x2={minuteEnd.x} y2={minuteEnd.y}
        stroke="var(--hand-color)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <line x1={CX} y1={CY} x2={secondEnd.x} y2={secondEnd.y}
        stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r="5.5" fill="var(--hand-color)" />
      <circle cx={CX} cy={CY} r="2.5" fill="#f87171" />

      {/* Digital time */}
      <text
        x={CX}
        y={CY + 36}
        textAnchor="middle"
        fontSize="16"
        fill="rgba(255,255,255,0.75)"
        fontFamily="var(--mono)"
        letterSpacing="0.5"
      >
        {formatTime(now)}
      </text>
    </svg>
  )
}

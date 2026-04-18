import { getSegments, timeToMinutes } from '../utils/circadian'

const W = 1000
const BAR_Y = 40
const BAR_H = 28
const TICK_Y_TOP = BAR_Y + BAR_H
const TICK_Y_BOT = TICK_Y_TOP + 8
const LABEL_Y_ABOVE = BAR_Y - 8
const LABEL_Y_BELOW = TICK_Y_BOT + 12

function minutesToX(minutes) {
  return (minutes / (24 * 60)) * W
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function HourTicks() {
  const ticks = []
  for (let h = 0; h <= 24; h++) {
    const x = (h / 24) * W
    const isMajor = h % 6 === 0
    ticks.push(
      <line
        key={h}
        x1={x} y1={TICK_Y_TOP}
        x2={x} y2={isMajor ? TICK_Y_BOT + 2 : TICK_Y_BOT}
        stroke={isMajor ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}
        strokeWidth={isMajor ? 1.5 : 0.8}
      />
    )
    if (isMajor && h < 24) {
      const label = h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`
      ticks.push(
        <text
          key={`lbl-${h}`}
          x={x}
          y={TICK_Y_BOT + 20}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.35)"
        >
          {label}
        </text>
      )
    }
  }
  return <>{ticks}</>
}

function segVisual(status) {
  if (status === 'logged-on-time') return { fill: 1.0,  glow: 5, stroke: false, className: '' }
  if (status === 'logged-early')   return { fill: 0.85, glow: 3, stroke: false, className: '' }
  if (status === 'logged-late')    return { fill: 0.85, glow: 3, stroke: false, className: '' }
  if (status === 'logged-skipped') return { fill: 0,    glow: 0, stroke: true,  className: '' }
  if (status === 'needs-log')      return { fill: 0.5,  glow: 2, stroke: false, className: 'seg-needs-log' }
  if (status === 'active')         return { fill: 0.92, glow: 5, stroke: false, className: '' }
  return { fill: 0.6, glow: 3, stroke: false, className: '' }
}

export default function LinearClock({ periods, now, getStatus }) {
  const segments = getSegments(periods)

  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const nowX = minutesToX(nowMinutes)

  const h = now.getHours()
  const m = now.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const nowLabel = `${pad(h12)}:${pad(m)} ${ampm}`

  return (
    <div className="linear-clock-wrap">
      <svg
        viewBox={`0 0 ${W} 80`}
        aria-label="Linear circadian timeline"
        role="img"
      >
        {/* Background bar */}
        <rect x={0} y={BAR_Y} width={W} height={BAR_H} rx="4" fill="#1e1f27" />

        {/* Colored segments */}
        {segments.map((seg) => {
          const startMin = ((seg.startDeg + 90) / 360) * 1440
          const spanMin = (seg.endDeg - seg.startDeg) / 360 * 1440
          const x = minutesToX(startMin % 1440)
          const w = (spanMin / (24 * 60)) * W
          const overflows = x + w > W
          const status = getStatus ? getStatus(seg.id) : 'pending'
          const v = segVisual(status)

          const rectProps = v.stroke
            ? { fill: 'none', stroke: seg.color, strokeOpacity: 0.35, strokeWidth: 1, strokeDasharray: '3 4' }
            : { fill: seg.color, fillOpacity: v.fill, style: v.glow ? { filter: `drop-shadow(0 0 ${v.glow}px ${seg.color})` } : undefined }

          return (
            <g key={seg.id}>
              <rect
                className={v.className || undefined}
                x={x} y={BAR_Y}
                width={overflows ? W - x : w}
                height={BAR_H}
                {...rectProps}
              />
              {overflows && (
                <rect
                  className={v.className || undefined}
                  x={0} y={BAR_Y}
                  width={w - (W - x)}
                  height={BAR_H}
                  {...rectProps}
                />
              )}
            </g>
          )
        })}

        {/* Period marker lines + labels */}
        {periods.map((p, i) => {
          const min = timeToMinutes(p.time)
          const x = minutesToX(min)
          const above = i % 2 === 0
          const labelY = above ? LABEL_Y_ABOVE : LABEL_Y_BELOW
          return (
            <g key={p.id}>
              <line
                x1={x} y1={BAR_Y}
                x2={x} y2={BAR_Y + BAR_H}
                stroke={p.color}
                strokeWidth="1.5"
                opacity="0.9"
              />
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                fontSize="8"
                fill={p.color}
                fontWeight="500"
              >
                {p.label.replace('Peak ', 'Peak\n')}
              </text>
            </g>
          )
        })}

        {/* Tick marks */}
        <HourTicks />

        {/* "Now" indicator */}
        <line
          x1={nowX} y1={BAR_Y - 4}
          x2={nowX} y2={BAR_Y + BAR_H + 4}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2"
        />
        <text
          x={Math.min(Math.max(nowX, 30), W - 30)}
          y={BAR_Y - 14}
          textAnchor="middle"
          fontSize="10"
          fill="rgba(255,255,255,0.85)"
          fontFamily="var(--mono)"
          fontWeight="600"
        >
          {nowLabel}
        </text>

        {/* Cap the bar edges */}
        <rect x={0} y={BAR_Y} width={W} height={BAR_H} rx="4" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>
    </div>
  )
}

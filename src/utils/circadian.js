export function sortPeriodsByTime(periods) {
  return [...periods].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
}

export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function minutesToAngleDeg(minutes) {
  return (minutes / (24 * 60)) * 360 - 90
}

export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

export function arcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  // Normalize span to determine largeArc flag
  let span = endDeg - startDeg
  if (span < 0) span += 360
  const largeArc = span > 180 ? 1 : 0

  const s1 = polarToCartesian(cx, cy, rOuter, startDeg)
  const e1 = polarToCartesian(cx, cy, rOuter, endDeg)
  const s2 = polarToCartesian(cx, cy, rInner, endDeg)
  const e2 = polarToCartesian(cx, cy, rInner, startDeg)

  return [
    `M ${s1.x} ${s1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ')
}

export function getCurrentPeriod(sortedPeriods, now) {
  if (!sortedPeriods.length) return null
  const nowMin = now.getHours() * 60 + now.getMinutes()
  // Walk sorted periods and return the last one whose time <= nowMin.
  // If nowMin is before the first period (e.g. 3am, first period is 6am),
  // fall through to the last period from the previous day.
  let current = sortedPeriods[sortedPeriods.length - 1]
  for (const p of sortedPeriods) {
    if (timeToMinutes(p.time) <= nowMin) current = p
  }
  return current
}

export function getSegments(sortedPeriods) {
  return sortedPeriods.map((period, i) => {
    const next = sortedPeriods[(i + 1) % sortedPeriods.length]
    const startMin = timeToMinutes(period.time)
    let endMin = timeToMinutes(next.time)
    // Wrap overnight: if end <= start, it means the segment crosses midnight
    if (endMin <= startMin) endMin += 24 * 60

    const startDeg = minutesToAngleDeg(startMin)
    // Compute endDeg by adding the span to startDeg (preserves crossing midnight correctly)
    const spanDeg = (endMin - startMin) / (24 * 60) * 360
    const endDeg = startDeg + spanDeg

    return { startDeg, endDeg, color: period.color, label: period.label, id: period.id }
  })
}

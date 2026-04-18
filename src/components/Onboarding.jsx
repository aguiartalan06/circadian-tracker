import { useState } from 'react'
import LogPrompt from './LogPrompt'

const TOTAL_STEPS = 8
const CONFIRM_STEP = 7
const SKIPPABLE_STEPS = [4, 5, 6]

function fmt12(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Mini static clock preview for the tutorial step
function MiniClock() {
  const CX = 100, CY = 100, R_OUT = 88, R_IN = 68
  const segs = [
    { a: -90,  b: -30,  color: '#fbbf24' },
    { a: -30,  b: 30,   color: '#facc15', active: true },
    { a: 30,   b: 90,   color: '#a3e635' },
    { a: 90,   b: 150,  color: '#34d399' },
    { a: 150,  b: 210,  color: '#f97316' },
    { a: 210,  b: 270,  color: '#818cf8' },
  ]
  function arc(a, b, rOut, rIn) {
    const rad = (d) => (d * Math.PI) / 180
    const p = (r, d) => ({ x: CX + r * Math.cos(rad(d)), y: CY + r * Math.sin(rad(d)) })
    const s1 = p(rOut, a), e1 = p(rOut, b)
    const s2 = p(rIn, b),  e2 = p(rIn, a)
    const large = b - a > 180 ? 1 : 0
    return `M ${s1.x} ${s1.y} A ${rOut} ${rOut} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${rIn} ${rIn} 0 ${large} 0 ${e2.x} ${e2.y} Z`
  }
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx={CX} cy={CY} r={R_OUT + 2} fill="#13141a" />
      {segs.map((s, i) => (
        <path
          key={i}
          d={arc(s.a, s.b, R_OUT, R_IN)}
          fill={s.color}
          fillOpacity={s.active ? 0.92 : 0.55}
          style={{ filter: `drop-shadow(0 0 ${s.active ? 6 : 2}px ${s.color})` }}
        />
      ))}
      <circle cx={CX} cy={CY} r={R_IN - 1} fill="#13141a" />
      {/* Hands */}
      <line x1={CX} y1={CY} x2={CX + 38} y2={CY - 8} stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
      <line x1={CX} y1={CY} x2={CX + 50} y2={CY + 18} stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="3.5" fill="#e2e8f0" />
    </svg>
  )
}

const TUTORIAL_MOCK_PERIOD = {
  id: 'breakfast',
  label: 'Breakfast',
  color: '#fb923c',
  description: 'Break your fast after first light for optimal metabolic signaling.',
  time: '07:30',
}
const TUTORIAL_MOCK_SORTED = [
  TUTORIAL_MOCK_PERIOD,
  { id: 'peak-cognitive', label: 'Peak Cognitive', color: '#facc15', time: '10:00' },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [wakeTime, setWakeTime] = useState('06:00')
  const [bedtime, setBedtime] = useState('22:30')

  function advance() {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    } else {
      onComplete({ name: name.trim() || 'Friend', wakeTime, bedtime })
    }
  }

  function skipTour() {
    setStep(CONFIRM_STEP)
  }

  const firstName = name.trim().split(' ')[0]

  return (
    <div className="onboarding">
      <div className="ob-card">
        <div className="ob-content">
          {step === 0 && (
            <div className="ob-step" key="welcome">
              <div className="ob-sun" aria-hidden="true">
                <span className="ob-sun-ring" />
                <span className="ob-sun-core" />
              </div>
              <h1 className="ob-title">Circadian</h1>
              <p className="ob-subtitle">Align your day with your natural rhythm</p>
              <p className="ob-body">
                Your body runs on sunlight — not clocks. Every biological process
                follows a 24‑hour cycle anchored to light and darkness. This app
                helps you stay in sync with it.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="ob-step" key="name">
              <p className="ob-question">What should we call you?</p>
              <input
                className="ob-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && advance()}
                autoFocus
                maxLength={40}
              />
              <p className="ob-hint">We'll use this to personalize your experience.</p>
            </div>
          )}

          {step === 2 && (
            <div className="ob-step" key="wake">
              <p className="ob-question">When do you wake up?</p>
              <input
                className="ob-input ob-input--time"
                type="time"
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
              />
              <p className="ob-hint">
                Your wake time anchors your entire circadian schedule — meal
                timing, peak focus, and wind-down all flow from here.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="ob-step" key="bed">
              <p className="ob-question">When do you go to sleep?</p>
              <input
                className="ob-input ob-input--time"
                type="time"
                value={bedtime}
                onChange={e => setBedtime(e.target.value)}
              />
              <p className="ob-hint">
                Consistent sleep timing is the single biggest driver of sleep
                quality — even more than duration.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="ob-step ob-why" key="why">
              <div className="ob-sun" aria-hidden="true">
                <span className="ob-sun-ring" />
                <span className="ob-sun-core" />
              </div>
              <h2 className="ob-why-headline">Your body is a 24-hour system.</h2>
              <p className="ob-why-body">
                Every cell, hormone, and organ runs on a roughly 24-hour cycle
                anchored to light and darkness. This is your <strong>circadian rhythm</strong>.
              </p>
              <p className="ob-why-body">
                When it's in sync — consistent wake time, morning light, meals during
                daylight, darkness at night — you sleep better, think more clearly,
                recover faster, and lower long-term disease risk.
              </p>
              <p className="ob-why-body">
                When it's out of sync, even by a few hours, performance drops and
                chronic risk rises. The biggest lever isn't duration or intensity —
                it's <strong>consistency</strong>.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="ob-step ob-tutorial" key="tutorial-clock">
              <h2 className="ob-tutorial-headline">Meet your clock</h2>
              <div className="ob-tutorial-preview">
                <MiniClock />
              </div>
              <ul className="ob-callouts">
                <li className="ob-callout">
                  <span className="ob-callout-dot" style={{ background: '#facc15' }} />
                  <span>
                    <strong>Colored ring</strong>
                    Each segment is a period of your day — wake, breakfast, peak focus, and so on.
                  </span>
                </li>
                <li className="ob-callout">
                  <span className="ob-callout-dot" style={{ background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
                  <span>
                    <strong>Highlighted segment</strong>
                    The brighter, glowing segment is the period you're in right now.
                  </span>
                </li>
                <li className="ob-callout">
                  <span className="ob-callout-dot" style={{ background: '#e2e8f0' }} />
                  <span>
                    <strong>Hands</strong>
                    Current time, same as any clock — but on a 24-hour face.
                  </span>
                </li>
              </ul>
            </div>
          )}

          {step === 6 && (
            <div className="ob-step ob-tutorial" key="tutorial-logging">
              <h2 className="ob-tutorial-headline">Log as you go</h2>
              <div className="ob-tutorial-preview">
                <LogPrompt
                  period={TUTORIAL_MOCK_PERIOD}
                  sortedPeriods={TUTORIAL_MOCK_SORTED}
                  windowPhase="past"
                  isMock
                />
              </div>
              <ul className="ob-callouts">
                <li className="ob-callout">
                  <span className="ob-callout-dot" style={{ background: '#4ade80' }} />
                  <span>
                    <strong>Tap any period to log it</strong>
                    During or after the window, tell us whether you did the activity on time, early, late, or skipped it.
                  </span>
                </li>
                <li className="ob-callout">
                  <span className="ob-callout-dot" style={{ background: '#fb923c' }} />
                  <span>
                    <strong>Build streaks</strong>
                    Consecutive days logged earn a streak per period. Consistency is what moves the needle.
                  </span>
                </li>
              </ul>
            </div>
          )}

          {step === CONFIRM_STEP && (
            <div className="ob-step" key="done">
              <div className="ob-check" aria-hidden="true">✓</div>
              <p className="ob-question">
                {firstName ? `You're all set, ${firstName}!` : "You're all set!"}
              </p>
              <div className="ob-summary">
                <div className="ob-summary-row">
                  <span>Wake up</span>
                  <span className="ob-summary-val">{fmt12(wakeTime)}</span>
                </div>
                <div className="ob-summary-row">
                  <span>Bedtime</span>
                  <span className="ob-summary-val">{fmt12(bedtime)}</span>
                </div>
              </div>
              <p className="ob-hint">Your schedule is ready. Fine-tune any time in settings.</p>
            </div>
          )}
        </div>

        <button className="ob-btn" onClick={advance}>
          {step === 0 ? 'Get started'
            : step === CONFIRM_STEP ? 'Begin your day →'
            : 'Continue'}
        </button>

        {SKIPPABLE_STEPS.includes(step) && (
          <button className="ob-skip" onClick={skipTour}>
            Skip tour
          </button>
        )}

        <div className="ob-dots" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={`ob-dot${i === step ? ' ob-dot--active' : i < step ? ' ob-dot--done' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

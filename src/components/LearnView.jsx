const TOPICS = [
  {
    id: 'body-clock',
    color: '#c084fc',
    title: 'How Your Body Clock Works',
    summary:
      'The suprachiasmatic nucleus (SCN) in your hypothalamus acts as a master pacemaker, firing in near-perfect 24-hour cycles independent of external input. It syncs to the outside world through zeitgebers — time cues like light, food, and exercise that "set" the clock each day. When these cues align, your biology runs on time; when they conflict, your rhythms drift.',
    source: 'https://www.frontiersin.org/journals/sleep/articles/10.3389/frsle.2025.1544945/full',
    sourceLabel: 'Frontiers in Sleep',
  },
  {
    id: 'light',
    color: '#fbbf24',
    title: 'Light & Your Circadian Rhythm',
    summary:
      'Morning sunlight is the strongest zeitgeber available — even 5–10 minutes outside anchors your sleep timing for the night ahead. Blue-light wavelengths suppress BMAL1 expression and delay melatonin onset, pushing your internal clock later. Evening light exposure is one of the most consistent causes of chronobiological drift in modern life.',
    source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12502225/',
    sourceLabel: 'PMC · NIH',
  },
  {
    id: 'hormones',
    color: '#818cf8',
    title: 'Cortisol & Melatonin',
    summary:
      'Cortisol surges at the sleep-wake transition — the cortisol awakening response — then declines in ultradian pulses roughly every 90 minutes through the day. Melatonin rises as cortisol reaches its nadir at night, forming a reciprocal rhythm that governs alertness and sleep pressure. Disrupting either hormone through irregular schedules or artificial light throws both off together.',
    source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8813037/',
    sourceLabel: 'PMC · NIH',
  },
  {
    id: 'chrononutrition',
    color: '#fb923c',
    title: 'Chrononutrition',
    summary:
      'When you eat is a powerful circadian signal — meal timing acts as a peripheral clock synchronizer, especially for the liver and gut. Time-restricted eating aligned with daylight hours improves metabolic outcomes independent of caloric intake. Omega-3 fatty acids have been linked to more robust circadian gene expression, while late-night eating consistently shifts peripheral clocks later.',
    source: 'https://iadns.onlinelibrary.wiley.com/doi/full/10.1002/efd2.70092',
    sourceLabel: 'IADNS · Wiley',
  },
  {
    id: 'exercise',
    color: '#34d399',
    title: 'Exercise Timing',
    summary:
      'Exercise is a non-photic zeitgeber — it can shift your circadian phase much like light does, without relying on the visual system. Morning exercise tends to advance the clock (earlier sleep and wake), while late-evening workouts can delay it, particularly in night-owl chronotypes. Timing your training to your chronotype may improve both performance and metabolic outcomes beyond the workout itself.',
    source: 'https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2025.1633835/full',
    sourceLabel: 'Frontiers in Neuroscience',
  },
  {
    id: 'cardiometabolic',
    color: '#f87171',
    title: 'Cardiometabolic Health',
    summary:
      'Chronic circadian disruption — from shift work, irregular sleep, or social jetlag — is independently associated with elevated cardiovascular and metabolic disease risk. The American Heart Association links circadian misalignment to hypertension, dyslipidemia, insulin resistance, and adverse cardiac remodeling. Even modest day-to-day variability in sleep timing compounds these risks over time.',
    source: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001388',
    sourceLabel: 'AHA Journals',
  },
]

export default function LearnView() {
  return (
    <div className="learn-view">
      <div className="learn-header">
        <h2 className="learn-title">The Science</h2>
        <p className="learn-subtitle">Research behind your circadian rhythm</p>
      </div>
      <div className="learn-grid">
        {TOPICS.map(topic => (
          <article
            key={topic.id}
            className="learn-card"
            style={{ '--topic-color': topic.color }}
          >
            <div className="learn-card-accent" />
            <div className="learn-card-body">
              <div className="learn-card-dot" />
              <h3 className="learn-card-title">{topic.title}</h3>
              <p className="learn-card-summary">{topic.summary}</p>
              <a
                className="learn-card-link"
                href={topic.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read more — {topic.sourceLabel}
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

import FeatureBadge from './FeatureBadge.jsx'
import './FeatureCallout.css'

function compactTooltipText(feature) {
  const parts = [feature.summary, ...(feature.highlights ?? [])].filter(Boolean)
  return parts.join(' · ')
}

export default function FeatureCallout({ feature, children, variant = 'default' }) {
  if (!feature) return null

  if (variant === 'compact') {
    return (
      <span
        className="feature-callout feature-callout--compact"
        role="note"
        aria-label={feature.title}
        title={compactTooltipText(feature)}
      >
        <span className="feature-callout-title">{feature.title}</span>
        <FeatureBadge status={feature.status} />
      </span>
    )
  }

  return (
    <aside className="feature-callout" aria-label={feature.title}>
      <div className="feature-callout-head">
        <h3 className="feature-callout-title">{feature.title}</h3>
        <FeatureBadge status={feature.status} />
      </div>
      <p className="feature-callout-summary">{feature.summary}</p>
      {feature.highlights?.length > 0 && (
        <ul className="feature-callout-list">
          {feature.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {children}
    </aside>
  )
}

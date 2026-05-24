import FeatureBadge from './FeatureBadge.jsx'
import './FeatureCallout.css'

export default function FeatureCallout({ feature, children }) {
  if (!feature) return null
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

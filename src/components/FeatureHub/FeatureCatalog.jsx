import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { FEATURE_CATEGORIES, FEATURES } from '../../constants/features/index.js'
import { buildFeaturePath } from '../../utils/featureNavigate.js'
import FeatureBadge from './FeatureBadge.jsx'
import './FeatureCatalog.css'

export default function FeatureCatalog() {
  const navigate = useNavigate()
  const sorted = [...FEATURE_CATEGORIES].sort((a, b) => a.order - b.order)

  return (
    <div className="feature-catalog">
      {sorted.map((cat) => {
        const items = FEATURES.filter((f) => f.categoryId === cat.id)
        if (!items.length) return null
        return (
          <section key={cat.id} className="feature-catalog-section">
            <h3 className="feature-catalog-cat">{cat.title}</h3>
            <div className="feature-catalog-grid">
              {items.map((f) => (
                <article
                  key={f.id}
                  className="feature-catalog-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(buildFeaturePath(f))}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(buildFeaturePath(f))}
                >
                  <div className="feature-catalog-card-head">
                    <strong>{f.title}</strong>
                    <FeatureBadge status={f.status} />
                  </div>
                  <p>{f.summary}</p>
                  <span className="feature-catalog-link">
                    进入工具 <ChevronRight className="inline size-3.5" />
                  </span>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

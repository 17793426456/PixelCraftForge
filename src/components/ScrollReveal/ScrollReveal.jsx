import { useScrollReveal } from '../../hooks/useScrollReveal'
import './ScrollReveal.css'

/**
 * 滚动进入视口时的入场动画容器
 * @param {'up'|'down'|'left'|'right'|'scale'|'fade'} variant
 */
export default function ScrollReveal({
  children,
  className = '',
  variant = 'up',
  delay = 0,
  as: Tag = 'div',
  ...rest
}) {
  const { ref, visible } = useScrollReveal()

  return (
    <Tag
      ref={ref}
      className={[
        'scroll-reveal',
        `scroll-reveal--${variant}`,
        visible && 'scroll-reveal--visible',
        className,
      ].filter(Boolean).join(' ')}
      style={{ '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

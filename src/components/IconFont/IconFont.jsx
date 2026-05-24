import './IconFont.css'

/**
 * IconFont 通用组件 - 阿里巴巴 IconFont SVG Symbol 模式
 *
 * 使用方式：
 *   <IconFont type="icon-game" />
 *   <IconFont type="icon-magic" style={{ fontSize: 24, color: '#722ed1' }} />
 *
 * 内置 symbol id 见 public/iconfont.js 注释。
 */
export default function IconFont({ type, className = '', style = {}, ...rest }) {
  return (
    <svg
      className={`iconfont-svg ${className}`}
      aria-hidden="true"
      style={style}
      {...rest}
    >
      <use href={`#${type}`} xlinkHref={`#${type}`} />
    </svg>
  )
}

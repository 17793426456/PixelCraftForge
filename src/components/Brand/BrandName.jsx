import { BRAND_NAME_EN, BRAND_NAME_ZH } from '../../constants/brand'
import './Brand.css'

/** 中英文品牌名：像素造物 + PixelCraft Forge */
export default function BrandName({ className = '', layout = 'stack' }) {
  return (
    <span className={`brand-name brand-name--${layout} ${className}`.trim()}>
      <span className="brand-name-zh">{BRAND_NAME_ZH}</span>
      <span className="brand-name-en">{BRAND_NAME_EN}</span>
    </span>
  )
}

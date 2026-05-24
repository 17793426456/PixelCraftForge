import planetMars from '../../assets/t01cbd552d7384e1cb3.png'
import planetGas from '../../assets/t0141db0679fb1bf286.png'
import satellite from '../../assets/t01c656ec605cf238d0.png'
import './PlanetAnimation.css'

/** 宇宙背景：星空 + 两侧星球 + 卫星 */
export default function PlanetAnimation() {
  return (
    <div className="cosmos-bg" aria-hidden="true">
      <div className="cosmos-stars" />
      <div className="cosmos-stars cosmos-stars--far" />

      <img src={planetGas} alt="" className="cosmos-planet cosmos-planet--left" draggable={false} />
      <img src={planetMars} alt="" className="cosmos-planet cosmos-planet--right" draggable={false} />
      <img src={satellite} alt="" className="cosmos-satellite" draggable={false} />
    </div>
  )
}

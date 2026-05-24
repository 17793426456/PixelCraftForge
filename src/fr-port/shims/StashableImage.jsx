import { forwardRef } from 'react'

const StashableImage = forwardRef(function StashableImage({ src, stashName: _stashName, ...props }, ref) {
  return <img ref={ref} src={src} alt="" {...props} />
})

export default StashableImage

'use client'
import { useEffect, useRef } from 'react'

export default function BlobBackground() {
  const refs = [
    useRef<SVGCircleElement>(null),
    useRef<SVGCircleElement>(null),
    useRef<SVGCircleElement>(null),
    useRef<SVGCircleElement>(null),
    useRef<SVGCircleElement>(null),
  ]

  useEffect(() => {
    let t = 0
    let id: number
    const bases = [
      { x: 150, y: 200, ax: 60, ay: 40, sx: 1.0, sy: 0.7 },
      { x: 250, y: 180, ax: 55, ay: 35, sx: 0.8, sy: 1.1 },
      { x: 200, y: 250, ax: 50, ay: 45, sx: 1.3, sy: 0.9 },
      { x: 100, y: 230, ax: 45, ay: 30, sx: 0.6, sy: 1.0 },
      { x: 310, y: 200, ax: 50, ay: 40, sx: 1.2, sy: 0.8 },
    ]
    function animate() {
      t += 0.012
      refs.forEach((r, i) => {
        if (r.current) {
          const b = bases[i]
          r.current.setAttribute('cx', String(b.x + Math.sin(t * b.sx) * b.ax))
          r.current.setAttribute('cy', String(b.y + Math.cos(t * b.sy) * b.ay))
        }
      })
      id = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, background: '#FAF8F5' }}>
      <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur stdDeviation="15" result="blur"/>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -12" result="goo"/>
          </filter>
        </defs>
        <g filter="url(#goo)">
          <circle ref={refs[0]} cx="150" cy="200" r="130" fill="#6B3A4B" opacity="0.7"/>
          <circle ref={refs[1]} cx="250" cy="180" r="110" fill="#9A5468" opacity="0.65"/>
          <circle ref={refs[2]} cx="200" cy="250" r="95"  fill="#C9A84C" opacity="0.5"/>
          <circle ref={refs[3]} cx="100" cy="230" r="80"  fill="#6B3A4B" opacity="0.6"/>
          <circle ref={refs[4]} cx="310" cy="200" r="85"  fill="#7D4558" opacity="0.6"/>
        </g>
      </svg>
    </div>
  )
}

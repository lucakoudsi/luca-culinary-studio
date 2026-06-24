'use client'
import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; z: number; c: string }

export default function DepthHeader({ initial, name, role, stats, avatarUrl, onAvatarClick }: {
  initial: string
  name: string
  role: string
  stats: { rezepte: number; projekte: number; fermente: number }
  avatarUrl?: string | null
  onAvatarClick?: () => void
}) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return
    const cv   = canvasRef.current as HTMLCanvasElement
    const hero = containerRef.current as HTMLDivElement
    const ctx  = cv.getContext('2d') as CanvasRenderingContext2D

    function rs() { cv.width = hero!.offsetWidth; cv.height = hero!.offsetHeight }
    rs()
    window.addEventListener('resize', rs)

    const N    = 180
    const pts: Particle[] = []
    const cols = ['#6B3A4B', '#9A5468', '#C9A84C', '#7D4558']
    for (let i = 0; i < N; i++) {
      pts.push({
        x: (Math.random() - 0.5) * cv.width * 1.5,
        y: (Math.random() - 0.5) * cv.height * 1.5,
        z: Math.random() * 1000,
        c: cols[Math.floor(Math.random() * cols.length)],
      })
    }

    let mx = 0, my = 0
    function onMove(e: MouseEvent) {
      const r = hero!.getBoundingClientRect()
      mx = ((e.clientX - r.left) / cv.width  - 0.5) * 60
      my = ((e.clientY - r.top)  / cv.height - 0.5) * 60
    }
    function onLeave() { mx = 0; my = 0 }
    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseleave', onLeave)

    let animId: number
    function draw() {
      ctx.fillStyle = '#15100F'
      ctx.fillRect(0, 0, cv.width, cv.height)
      const cx = cv.width / 2
      const cy = cv.height / 2
      pts.forEach(p => {
        p.z -= 2
        if (p.z < 1) {
          p.z = 1000
          p.x = (Math.random() - 0.5) * cv.width  * 1.5
          p.y = (Math.random() - 0.5) * cv.height * 1.5
        }
        const k  = 200 / p.z
        const sx = cx + (p.x + mx * (1 - p.z / 1000) * 8) * k
        const sy = cy + (p.y + my * (1 - p.z / 1000) * 8) * k
        const r  = Math.max(0.3, (1 - p.z / 1000) * 3)
        const op = (1 - p.z / 1000) * 0.8
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = p.c
        ctx.globalAlpha = op
        ctx.fill()
        ctx.globalAlpha = 1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', rs)
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={containerRef} style={{
      position: 'relative', height: '200px', borderRadius: '18px',
      overflow: 'hidden', background: '#15100F', marginBottom: '1.25rem',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Avatar + Name */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        gap: '18px', padding: '0 30px', zIndex: 3, pointerEvents: 'none',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{
              width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover',
              border: '3px solid rgba(255,255,255,0.2)',
            }} />
          ) : (
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#6B3A4B,#C9A84C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', color: 'white', fontWeight: 500,
              border: '3px solid rgba(255,255,255,0.2)',
            }}>{initial}</div>
          )}
          <div onClick={onAvatarClick} style={{
            position: 'absolute', bottom: '2px', right: '2px',
            width: '26px', height: '26px', borderRadius: '50%',
            background: '#6B3A4B', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '2px solid #15100F',
            pointerEvents: 'all', cursor: 'pointer',
          }}>
            <span style={{ fontSize: '13px' }}>📷</span>
          </div>
        </div>

        <div>
          <h2 style={{
            fontFamily: 'var(--font-playfair, serif)', fontSize: '22px',
            color: '#FAF8F5', fontWeight: 500, margin: 0,
          }}>{name}</h2>
          <div style={{
            fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase',
            color: '#C9A84C', marginTop: '3px',
          }}>{role}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        position: 'absolute', bottom: '16px', right: '30px',
        display: 'flex', gap: '24px', zIndex: 3,
      }}>
        {([['Rezepte', stats.rezepte], ['Projekte', stats.projekte], ['Fermente', stats.fermente]] as [string, number][]).map(([l, n]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px', fontWeight: 500, color: '#C9A84C',
              fontFamily: 'var(--font-playfair, serif)',
            }}>{n}</div>
            <div style={{
              fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase',
              color: 'rgba(250,248,245,0.5)',
            }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

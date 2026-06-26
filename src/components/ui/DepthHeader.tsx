'use client'
import { useEffect, useRef } from 'react'
import { Camera, Music2, PlayCircle, Globe, Briefcase } from 'lucide-react'

type Particle = { x: number; y: number; z: number; c: string }

type SocialLinks = {
  instagram?: string | null
  tiktok?: string | null
  youtube?: string | null
  website?: string | null
  linkedin?: string | null
}

function buildUrl(platform: string, value: string): string {
  const v = value.trim()
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  const clean = v.replace(/^@/, '')
  switch (platform) {
    case 'instagram': return `https://instagram.com/${clean}`
    case 'tiktok':    return `https://tiktok.com/@${clean}`
    case 'youtube':   return `https://youtube.com/${clean}`
    case 'linkedin':  return `https://linkedin.com/in/${clean}`
    case 'website':   return `https://${v}`
    default:          return v
  }
}

const SOCIAL_ICONS: { key: keyof SocialLinks; Icon: React.ElementType }[] = [
  { key: 'instagram', Icon: Camera      },
  { key: 'tiktok',    Icon: Music2      },
  { key: 'youtube',   Icon: PlayCircle  },
  { key: 'website',   Icon: Globe       },
  { key: 'linkedin',  Icon: Briefcase   },
]

export default function DepthHeader({ initial, name, role, stats, avatarUrl, onAvatarClick, socialLinks }: {
  initial: string
  name: string
  role: string
  stats: { rezepte: number; projekte: number; fermente: number }
  avatarUrl?: string | null
  onAvatarClick?: () => void
  socialLinks?: SocialLinks
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeSocial = SOCIAL_ICONS.map(s => ({
    ...s,
    url: socialLinks?.[s.key] ? buildUrl(s.key, socialLinks[s.key]!) : '',
  })).filter(s => s.url)

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
    const cols = ['#6B3A4B', '#9A5468', '#C9A84C', '#B07D8C']
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
      const g = ctx.createLinearGradient(0, 0, cv.width, cv.height)
      const style = getComputedStyle(document.documentElement)
      const s2 = style.getPropertyValue('--surface-2').trim() || '#F4EFE9'
      g.addColorStop(0, s2)
      g.addColorStop(0.5, s2)
      g.addColorStop(1, s2)
      ctx.fillStyle = g
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
        const op = (1 - p.z / 1000) * 0.55
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
    <div ref={containerRef}
      className="h-[130px] sm:h-[180px] md:h-[220px]"
      style={{
        position: 'relative', borderRadius: '18px',
        overflow: 'hidden', background: 'var(--surface-2)', marginBottom: '1.25rem',
        border: '0.5px solid var(--border)',
      }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Avatar + Name */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        gap: '14px', padding: '0 16px', zIndex: 3, pointerEvents: 'none',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-14 h-14 sm:w-20 sm:h-20" style={{
              borderRadius: '50%', objectFit: 'cover',
              border: '3px solid white',
              boxShadow: '0 4px 20px rgba(107,58,75,0.25)',
            }} />
          ) : (
            <div className="w-14 h-14 sm:w-20 sm:h-20" style={{
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#6B3A4B,#C9A84C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', color: 'white', fontWeight: 500,
              border: '3px solid white',
              boxShadow: '0 4px 20px rgba(107,58,75,0.25)',
            }}>{initial}</div>
          )}
          <div onClick={onAvatarClick} style={{
            position: 'absolute', bottom: '2px', right: '2px',
            width: '26px', height: '26px', borderRadius: '50%',
            background: '#6B3A4B', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '2px solid white',
            pointerEvents: 'all', cursor: 'pointer',
          }}>
            <span style={{ fontSize: '13px' }}>📷</span>
          </div>
        </div>

        {/* Name + Role + Social */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-playfair, serif)', fontSize: '22px',
            color: 'var(--text)', fontWeight: 500, margin: 0,
          }}>{name}</h2>
          <div style={{
            fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase',
            color: '#6B3A4B', marginTop: '4px',
          }}>{role}</div>

          {/* Social icons — only when at least one link is filled */}
          {activeSocial.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', pointerEvents: 'all' }}>
              {activeSocial.map(({ key, Icon, url }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(107,58,75,0.08)', border: '1px solid var(--border)',
                    color: '#6B3A4B', transition: 'all 0.15s', flexShrink: 0,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = '#6B3A4B'
                    el.style.color = 'white'
                    el.style.transform = 'translateY(-2px)'
                    el.style.borderColor = '#6B3A4B'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'rgba(107,58,75,0.08)'
                    el.style.color = '#6B3A4B'
                    el.style.transform = 'none'
                    el.style.borderColor = 'var(--border, #E8E0D8)'
                  }}
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        position: 'absolute', bottom: '10px', right: '16px',
        display: 'flex', gap: '16px', zIndex: 3,
      }}>
        {([['Rezepte', stats.rezepte], ['Projekte', stats.projekte], ['Fermente', stats.fermente]] as [string, number][]).map(([l, n]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px', fontWeight: 500, color: '#6B3A4B',
              fontFamily: 'var(--font-playfair, serif)',
            }}>{n}</div>
            <div style={{
              fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

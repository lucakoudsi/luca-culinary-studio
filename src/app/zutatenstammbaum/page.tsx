'use client';

import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { TREE_REGISTRY, TREE_ORDER, TREE_EMOJI } from '@/lib/stammbaum';
import type { TreeNodeData } from '@/lib/stammbaum/types';

/* ─── types ──────────────────────────────────────────────────────────── */
interface PathData {
  d: string;
  key: string;
  delay: number;
}

/* ─── static CSS ─────────────────────────────────────────────────────── */
const STYLES = `
  @keyframes rootDrop {
    from { transform: translateY(-32px) scale(0.97); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes nodeIn {
    from { transform: scale(0.88); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  @keyframes lineDraw {
    from { stroke-dashoffset: 2000; }
    to   { stroke-dashoffset: 0; }
  }
  .sbaum-grid {
    display: grid;
    grid-template-columns: minmax(180px, 260px) 360px minmax(180px, 260px);
    grid-template-areas: "left center right";
    gap: 36px;
    align-items: center;
    justify-content: center;
    padding: 0 32px 80px;
  }
  .sbaum-left  { grid-area: left;   display: flex; flex-direction: column; gap: 10px; }
  .sbaum-center{ grid-area: center; }
  .sbaum-right { grid-area: right;  display: flex; flex-direction: column; gap: 10px; }
  .sbaum-svg   { position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                  overflow: visible; pointer-events: none; z-index: 0; }
  .method-card {
    background: #FFFFFF;
    border: 1.5px solid #E8DDD4;
    border-radius: 14px;
    padding: 14px 16px;
    cursor: pointer;
    transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
    position: relative;
    z-index: 1;
  }
  .method-card:hover {
    box-shadow: 0 4px 20px rgba(107,58,75,0.14);
    border-color: #C9A84C;
  }
  .method-card.expanded {
    border-color: #6B3A4B;
    box-shadow: 0 0 0 2px rgba(107,58,75,0.12), 0 4px 20px rgba(107,58,75,0.14);
  }
  .sbaum-left .method-card:hover  { transform: translateX(3px); }
  .sbaum-right .method-card:hover { transform: translateX(-3px); }
  .method-icon-wrap {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
    transition: background 0.2s;
  }
  .chevron {
    font-size: 9px; color: #B09880; flex-shrink: 0;
    transition: transform 0.25s;
  }
  .chevron.open { transform: rotate(180deg); }
  .selector-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 18px; border-radius: 50px; border: 1.5px solid #DDD5CC;
    background: #FFFFFF; color: #6B3A4B; font-size: 12px; font-weight: 500;
    letter-spacing: 0.3px; cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s, box-shadow 0.18s;
  }
  .selector-chip:hover { border-color: #C9A84C; box-shadow: 0 2px 8px rgba(201,168,76,0.18); }
  .selector-chip.active {
    background: #6B3A4B; border-color: #6B3A4B; color: #FFFFFF;
    box-shadow: 0 4px 14px rgba(107,58,75,0.28);
  }
  @media (max-width: 880px) {
    .sbaum-grid {
      grid-template-columns: 1fr;
      grid-template-areas: "center" "left" "right";
      padding: 0 16px 60px;
      max-width: 480px;
      margin: 0 auto;
    }
    .sbaum-left, .sbaum-right {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .sbaum-svg  { display: none; }
    .sbaum-left  .method-card:hover { transform: none; }
    .sbaum-right .method-card:hover { transform: none; }
  }
  @media (max-width: 480px) {
    .sbaum-left, .sbaum-right { grid-template-columns: 1fr; }
  }
`;

/* ─── SVG botanical decoration ───────────────────────────────────────── */
function BotanicalSvg() {
  return (
    <svg viewBox="0 0 180 88" width="180" height="88" aria-hidden="true"
      style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <path d="M 90 86 C 90 74, 90 64, 90 48" stroke="#6B3A4B" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 90 56 C 78 48, 60 44, 42 40" stroke="#6B3A4B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 90 56 C 102 48, 120 44, 138 40" stroke="#6B3A4B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 90 48 C 74 36, 54 28, 34 22" stroke="#6B3A4B" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 90 48 C 106 36, 126 28, 146 22" stroke="#6B3A4B" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 90 48 C 82 34, 70 20, 56 12" stroke="#6B3A4B" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 90 48 C 98 34, 110 20, 124 12" stroke="#6B3A4B" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <ellipse cx="42"  cy="38" rx="5"   ry="2.8" fill="#6B3A4B" opacity="0.35" transform="rotate(-25 42 38)"/>
      <ellipse cx="138" cy="38" rx="5"   ry="2.8" fill="#6B3A4B" opacity="0.35" transform="rotate(25 138 38)"/>
      <ellipse cx="34"  cy="20" rx="4.5" ry="2.5" fill="#6B3A4B" opacity="0.3"  transform="rotate(-15 34 20)"/>
      <ellipse cx="146" cy="20" rx="4.5" ry="2.5" fill="#6B3A4B" opacity="0.3"  transform="rotate(15 146 20)"/>
      <ellipse cx="56"  cy="10" rx="4"   ry="2.2" fill="#C9A84C" opacity="0.55" transform="rotate(-10 56 10)"/>
      <ellipse cx="124" cy="10" rx="4"   ry="2.2" fill="#C9A84C" opacity="0.55" transform="rotate(10 124 10)"/>
      <circle cx="90" cy="48" r="4" fill="#C9A84C" opacity="0.65"/>
      <circle cx="90" cy="48" r="2" fill="#6B3A4B" opacity="0.9"/>
      <path d="M 90 86 C 77 82, 62 84, 50 88" stroke="#6B3A4B" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.35"/>
      <path d="M 90 86 C 103 82, 118 84, 130 88" stroke="#6B3A4B" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.35"/>
      <path d="M 90 86 C 84 80, 76 78, 68 80" stroke="#6B3A4B" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.25"/>
      <path d="M 90 86 C 96 80, 104 78, 112 80" stroke="#6B3A4B" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.25"/>
    </svg>
  );
}

/* ─── method card component ──────────────────────────────────────────── */
function MethodCard({
  method,
  isExpanded,
  onToggle,
  regRef,
  animDelay,
}: {
  method: TreeNodeData;
  isExpanded: boolean;
  onToggle: () => void;
  regRef: (el: HTMLElement | null) => void;
  animDelay: number;
}) {
  return (
    <div
      ref={regRef}
      className={`method-card${isExpanded ? ' expanded' : ''}`}
      onClick={onToggle}
      style={{ animation: `nodeIn 0.35s ease-out ${animDelay}s both` }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          className="method-icon-wrap"
          style={{ background: isExpanded ? '#6B3A4B' : 'rgba(107,58,75,0.07)' }}
        >
          <span style={{ lineHeight: 1 }}>{method.icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '1.2px',
            color: '#6B3A4B', textTransform: 'uppercase', lineHeight: 1.3,
          }}>
            {method.label}
          </div>
          <div style={{ fontSize: 10, color: '#C9A84C', marginTop: 3 }}>
            {method.children?.length}&nbsp;Arten
          </div>
        </div>
        <span className={`chevron${isExpanded ? ' open' : ''}`}>▼</span>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div style={{ marginTop: 14 }}>
          {method.description && (
            <p style={{
              fontSize: 11, color: '#7A5A40', lineHeight: 1.65,
              margin: '0 0 6px', fontStyle: 'italic',
            }}>
              {method.description}
            </p>
          )}
          {method.inspiration && (
            <div style={{
              fontSize: 10, color: '#C9A84C', marginBottom: 12,
              display: 'flex', alignItems: 'flex-start', gap: 5,
            }}>
              <span style={{ flexShrink: 0 }}>✦</span>
              <span>{method.inspiration}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid rgba(107,58,75,0.1)', paddingTop: 12 }}>
            {method.children?.map(proc => (
              <div key={proc.id} style={{ marginBottom: 10 }}>
                <div style={{
                  fontSize: 9.5, fontWeight: 700, color: '#6B3A4B',
                  textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4,
                }}>
                  {proc.label}
                </div>
                {proc.dishes?.map(dish => (
                  <div key={dish} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6, padding: '2px 0',
                  }}>
                    <span style={{ color: '#C9A84C', fontSize: 7, flexShrink: 0, marginTop: 3 }}>◆</span>
                    <span style={{ fontSize: 10.5, color: '#5A3040', fontStyle: 'italic', lineHeight: 1.45 }}>
                      {dish}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────────────── */
export default function ZutatenStammbaumPage() {
  const [activeKey, setActiveKey] = useState('kartoffel');
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());
  const [paths, setPaths]         = useState<PathData[]>([]);

  const activeTree   = TREE_REGISTRY[activeKey];
  const methods      = activeTree.children ?? [];
  const half         = Math.ceil(methods.length / 2);
  const leftMethods  = methods.slice(0, half);
  const rightMethods = methods.slice(half);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs     = useRef<Map<string, HTMLElement>>(new Map());

  const reg = useCallback((id: string, el: HTMLElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else    nodeRefs.current.delete(id);
  }, []);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  };

  const switchTree = (key: string) => {
    if (key === activeKey) return;
    setActiveKey(key);
    setExpanded(new Set());
    setPaths([]);
  };

  /* ── SVG path calculation ─────────────────────────────────────────── */
  const calcPaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();

    const getPos = (id: string) => {
      const el = nodeRefs.current.get(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        cx:    r.left - cr.left + r.width  / 2,
        cy:    r.top  - cr.top  + r.height / 2,
        left:  r.left  - cr.left,
        right: r.right - cr.left,
      };
    };

    const center = getPos('root');
    if (!center) return;

    const result: PathData[] = [];
    let delay = 0.35;

    nodeRefs.current.forEach((_, id) => {
      if (id === 'root') return;
      const m = getPos(id);
      if (!m) return;

      if (m.cx < center.cx) {
        // Left method: right edge → center left edge
        const mx = (m.right + center.left) / 2;
        result.push({
          d: `M ${m.right} ${m.cy} C ${mx} ${m.cy}, ${mx} ${center.cy}, ${center.left} ${center.cy}`,
          key: `${id}→root`,
          delay,
        });
      } else {
        // Right method: center right edge → method left edge
        const mx = (center.right + m.left) / 2;
        result.push({
          d: `M ${center.right} ${center.cy} C ${mx} ${center.cy}, ${mx} ${m.cy}, ${m.left} ${m.cy}`,
          key: `root→${id}`,
          delay,
        });
      }
      delay += 0.05;
    });

    setPaths(result);
  }, []);

  useLayoutEffect(() => {
    const t = setTimeout(calcPaths, 30);
    return () => clearTimeout(t);
  }, [expanded, activeKey, calcPaths]);

  useEffect(() => {
    const obs = new ResizeObserver(calcPaths);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [calcPaths]);

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <style>{STYLES}</style>

      {/* ── page header ─────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '44px 24px 28px' }}>
        <div style={{
          fontSize: 10, letterSpacing: '5px', color: '#C9A84C',
          marginBottom: 14, textTransform: 'uppercase',
        }}>
          ✦ &nbsp;Zutaten · Stammbaum&nbsp; ✦
        </div>
        <h1 style={{
          fontFamily: 'var(--font-playfair, "Playfair Display", Georgia, serif)',
          fontSize: 'clamp(24px, 3.5vw, 34px)',
          color: '#6B3A4B', margin: 0, fontWeight: 700, letterSpacing: 1,
        }}>
          Zubereitungsarten entdecken
        </h1>
        <p style={{ color: '#B09880', fontSize: 12, marginTop: 8, letterSpacing: '0.5px' }}>
          Wähle eine Zutat und klicke auf eine Methode zum Aufklappen
        </p>
      </div>

      {/* ── ingredient selector ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8,
        flexWrap: 'wrap', padding: '0 16px 40px',
      }}>
        {TREE_ORDER.map(key => (
          <button
            key={key}
            className={`selector-chip${activeKey === key ? ' active' : ''}`}
            onClick={() => switchTree(key)}
          >
            <span>{TREE_EMOJI[key]}</span>
            <span>
              {TREE_REGISTRY[key].label.charAt(0) +
               TREE_REGISTRY[key].label.slice(1).toLowerCase()}
            </span>
          </button>
        ))}
      </div>

      {/* ── tree area ───────────────────────────────────────────────── */}
      <div ref={containerRef} style={{ position: 'relative' }}>

        {/* SVG connecting lines */}
        <svg className="sbaum-svg">
          {paths.map(({ d, key, delay }) => (
            <path
              key={key}
              d={d}
              fill="none"
              stroke="#C9A84C"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray={2000}
              opacity={0.55}
              style={{ animation: `lineDraw 0.7s ease-out ${delay}s both` }}
            />
          ))}
        </svg>

        <div className="sbaum-grid">

          {/* Left column */}
          <div className="sbaum-left">
            {leftMethods.map((method, i) => (
              <MethodCard
                key={method.id}
                method={method}
                isExpanded={expanded.has(method.id)}
                onToggle={() => toggle(method.id)}
                regRef={el => reg(method.id, el)}
                animDelay={0.25 + i * 0.08}
              />
            ))}
          </div>

          {/* Center ingredient card */}
          <div className="sbaum-center">
            <div
              ref={el => reg('root', el)}
              style={{
                background: '#FFFFFF',
                border: '2px solid #6B3A4B',
                borderRadius: 20,
                padding: '32px 24px 28px',
                textAlign: 'center',
                boxShadow: '0 8px 48px rgba(107,58,75,0.13)',
                animation: 'rootDrop 0.55s cubic-bezier(0.34,1.4,0.64,1) both',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{ color: '#C9A84C', fontSize: 12, letterSpacing: 12, marginBottom: 18 }}>
                ✦ ✦ ✦
              </div>

              <BotanicalSvg />

              <h2 style={{
                fontFamily: 'var(--font-playfair, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(30px, 4vw, 44px)',
                fontWeight: 700,
                color: '#6B3A4B',
                letterSpacing: 3,
                margin: '18px 0 0',
                lineHeight: 1.1,
              }}>
                {activeTree.label}
              </h2>

              <div style={{
                fontStyle: 'italic', color: '#B09880', fontSize: 11.5,
                marginTop: 8, lineHeight: 1.55,
              }}>
                {activeTree.subtitle}
              </div>

              <div style={{
                width: 36, height: 1, background: '#C9A84C',
                margin: '16px auto', opacity: 0.6,
              }} />

              <p style={{
                fontSize: 12, color: '#5A3040', lineHeight: 1.75,
                margin: 0, maxWidth: 270,
                marginLeft: 'auto', marginRight: 'auto',
              }}>
                {activeTree.description}
              </p>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                marginTop: 20,
                background: 'rgba(107,58,75,0.05)',
                borderRadius: 20, padding: '5px 14px',
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#C9A84C', display: 'inline-block',
                }} />
                <span style={{
                  fontSize: 10, color: '#6B3A4B',
                  letterSpacing: '1.5px', fontWeight: 600, textTransform: 'uppercase',
                }}>
                  {methods.length}&nbsp;Zubereitungsarten
                </span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="sbaum-right">
            {rightMethods.map((method, i) => (
              <MethodCard
                key={method.id}
                method={method}
                isExpanded={expanded.has(method.id)}
                onToggle={() => toggle(method.id)}
                regRef={el => reg(method.id, el)}
                animDelay={0.3 + i * 0.08}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ── legend ──────────────────────────────────────────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '20px 24px 64px',
        borderTop: '1px solid rgba(107,58,75,0.07)',
        marginTop: 8,
      }}>
        <div style={{
          display: 'inline-flex', gap: 24, flexWrap: 'wrap',
          justifyContent: 'center', alignItems: 'center',
        }}>
          {(
            [
              {
                node: <div style={{ width: 12, height: 12, borderRadius: 3, background: '#6B3A4B' }} />,
                label: 'Methoden-Chip',
              },
              {
                node: <div style={{ width: 12, height: 12, borderRadius: 3, background: '#FFFEF9', border: '1.5px solid #6B3A4B' }} />,
                label: 'Technik / Verfahren',
              },
              {
                node: <span style={{ color: '#C9A84C', fontSize: 9 }}>◆</span>,
                label: 'Gericht',
              },
              {
                node: <div style={{ width: 22, height: 1.5, background: '#C9A84C', opacity: 0.7 }} />,
                label: 'Verbindung',
              },
            ] as { node: React.ReactNode; label: string }[]
          ).map(({ node, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {node}
              <span style={{ fontSize: 11, color: '#8B7355' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

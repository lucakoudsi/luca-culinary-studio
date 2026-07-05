'use client';

import React, { useState } from 'react';
import { TREE_REGISTRY, TREE_ORDER, TREE_EMOJI } from '@/lib/stammbaum';
import type { TreeNodeData } from '@/lib/stammbaum/types';
import {
  STAGE_W, STAGE_H, COL_W, LEFT_TOPS, RIGHT_TOPS,
  TRUNK_PATH, TRUNK_BASE_PT, BARK_LINES, CROWN_TWIGS, ROOT_PATHS,
  LEFT_BRANCHES, RIGHT_BRANCHES, ALL_BRANCHES, type Branch,
} from '@/lib/stammbaum/tree-geometry';

/* ─── static CSS ─────────────────────────────────────────────────────── */
const STYLES = `
  @keyframes nodeIn {
    from { transform: scale(0.88); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  @keyframes growFromBase {
    from { transform: scale(0.05); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  @keyframes twigFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .tree-part {
    transform-box: view-box;
    animation-name: growFromBase;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
    animation-fill-mode: both;
  }
  .branch-overlay {
    transition: opacity 0.35s ease, filter 0.35s ease;
  }
  .method-card {
    background: #FFFFFF;
    border: 1.5px solid #E8DDD4;
    border-radius: 14px;
    padding: 14px 16px;
    cursor: pointer;
    transition: box-shadow 0.2s, border-color 0.2s;
    position: absolute;
    left: 0;
    width: 100%;
  }
  .method-card:hover {
    box-shadow: 0 4px 20px rgba(107,58,75,0.14);
    border-color: #C9A84C;
  }
  .method-card.expanded {
    border-color: #6B3A4B;
    box-shadow: 0 0 0 2px rgba(107,58,75,0.12), 0 8px 32px rgba(107,58,75,0.18);
    z-index: 5;
  }
  .method-icon-wrap {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
    transition: background 0.2s;
  }
  .chevron {
    font-size: 9px; color: #B09880; flex-shrink: 0;
    transition: transform 0.25s;
  }
  .chevron.open { transform: rotate(180deg); }
  .rail-item {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 12px 6px; border-radius: 14px; cursor: pointer;
    background: transparent; border: 1.5px solid transparent;
    transition: background 0.18s, border-color 0.18s, transform 0.15s;
  }
  .rail-item:hover { background: rgba(107,58,75,0.06); transform: translateX(2px); }
  .rail-item.active {
    background: #6B3A4B; border-color: #6B3A4B;
    box-shadow: 0 4px 14px rgba(107,58,75,0.28);
  }
  .rail-item.active .rail-label { color: #FFFFFF; }
  .rail-emoji { font-size: 22px; line-height: 1; }
  .rail-label {
    font-size: 8.5px; font-weight: 600; letter-spacing: 0.4px;
    color: #6B3A4B; text-transform: uppercase; text-align: center;
  }
`;

/* ─── method card ─────────────────────────────────────────────────────── */
function MethodCard({
  method,
  isExpanded,
  isActive,
  onToggle,
  onHoverStart,
  onHoverEnd,
  top,
  animDelay,
}: {
  method: TreeNodeData;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  top: number;
  animDelay: number;
}) {
  return (
    <div
      className={`method-card${isExpanded ? ' expanded' : ''}`}
      onClick={onToggle}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      style={{
        top: `${top}%`,
        animation: `nodeIn 0.4s ease-out ${animDelay}s both`,
        borderColor: isActive && !isExpanded ? '#C9A84C' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          className="method-icon-wrap"
          style={{ background: isExpanded || isActive ? '#6B3A4B' : 'rgba(107,58,75,0.07)' }}
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

/* ─── vertical ingredient rail ───────────────────────────────────────── */
function IngredientRail({
  activeKey,
  onSelect,
}: {
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 92 }}>
      {TREE_ORDER.map(key => (
        <div
          key={key}
          className={`rail-item${activeKey === key ? ' active' : ''}`}
          onClick={() => onSelect(key)}
        >
          <span className="rail-emoji">{TREE_EMOJI[key]}</span>
          <span className="rail-label">
            {TREE_REGISTRY[key].label.charAt(0) + TREE_REGISTRY[key].label.slice(1).toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── SVG tree ───────────────────────────────────────────────────────── */
function BranchGroup({ branch, active, delay }: { branch: Branch; active: boolean; delay: number }) {
  return (
    <g
      className="tree-part"
      style={{ transformOrigin: `${branch.base.x}px ${branch.base.y}px`, animationDuration: '0.6s', animationDelay: `${delay}s` }}
    >
      {branch.twigs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#8B6444" strokeWidth={1.8} strokeLinecap="round" opacity={0.5} />
      ))}
      <path d={branch.path} fill="url(#branchGrad)" />
      <path
        className="branch-overlay"
        d={branch.pathHover}
        fill="#C9A84C"
        opacity={active ? 0.85 : 0}
        filter={active ? 'url(#branchGlow)' : undefined}
      />
    </g>
  );
}

function TreeSvg({ activeBranchIds }: { activeBranchIds: Set<string> }) {
  return (
    <svg
      width={STAGE_W}
      height={STAGE_H}
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient id="trunkGrad" gradientUnits="userSpaceOnUse" x1={STAGE_W / 2} y1={STAGE_H} x2={STAGE_W / 2} y2={0}>
          <stop offset="0%" stopColor="#4E3020" />
          <stop offset="55%" stopColor="#7A5537" />
          <stop offset="100%" stopColor="#9C7A54" />
        </linearGradient>
        <linearGradient id="branchGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#6B4A30" />
          <stop offset="100%" stopColor="#8F6B47" />
        </linearGradient>
        <filter id="branchGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* roots */}
      {ROOT_PATHS.map((d, i) => (
        <path
          key={i}
          className="tree-part"
          d={d}
          fill="url(#trunkGrad)"
          opacity={0.82}
          style={{ transformOrigin: `${TRUNK_BASE_PT.x}px ${TRUNK_BASE_PT.y}px`, animationDuration: '0.55s', animationDelay: `${0.05 + i * 0.03}s` }}
        />
      ))}

      {/* trunk + bark texture */}
      <g
        className="tree-part"
        style={{ transformOrigin: `${TRUNK_BASE_PT.x}px ${TRUNK_BASE_PT.y}px`, animationDuration: '0.6s', animationDelay: '0s' }}
      >
        <path d={TRUNK_PATH} fill="url(#trunkGrad)" />
        {BARK_LINES.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#3E2A1C" strokeWidth={1.2} opacity={0.16} />
        ))}
      </g>

      {/* crown tuft */}
      <g style={{ animation: 'twigFade 0.5s ease-out 0.55s both' }}>
        {CROWN_TWIGS.map((t, i) => (
          <g key={i}>
            <path d={t.path} fill="none" stroke="#8B6444" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
            <circle cx={t.bud.x} cy={t.bud.y} r={3.2} fill="#C9A84C" opacity={0.8} />
          </g>
        ))}
      </g>

      {/* 8 main branches */}
      {LEFT_BRANCHES.map((b, i) => (
        <BranchGroup key={b.id} branch={b} active={activeBranchIds.has(b.id)} delay={0.38 + i * 0.07} />
      ))}
      {RIGHT_BRANCHES.map((b, i) => (
        <BranchGroup key={b.id} branch={b} active={activeBranchIds.has(b.id)} delay={0.42 + i * 0.07} />
      ))}
    </svg>
  );
}

/* ─── page ───────────────────────────────────────────────────────────── */
export default function ZutatenStammbaumPage() {
  const [activeKey, setActiveKey] = useState('kartoffel');
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeTree   = TREE_REGISTRY[activeKey];
  const methods      = activeTree.children ?? [];
  const leftMethods  = methods.slice(0, 4);
  const rightMethods = methods.slice(4, 8);

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
    setHoveredId(null);
  };

  // which branch ids should glow: the hovered card and any expanded cards
  const activeBranchIds = new Set<string>();
  ALL_BRANCHES.forEach(b => {
    const method = b.side === 'left' ? leftMethods[b.index] : rightMethods[b.index];
    if (method && (method.id === hoveredId || expanded.has(method.id))) {
      activeBranchIds.add(b.id);
    }
  });

  return (
    <div style={{ background: '#FAF3E7', minHeight: '100vh' }}>
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
          Wähle links eine Zutat und klicke auf eine Methode zum Aufklappen
        </p>
      </div>

      {/* ── main area: rail + stage ────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        gap: 40, padding: '0 32px 40px',
      }}>
        <div style={{ paddingTop: 12 }}>
          <IngredientRail activeKey={activeKey} onSelect={switchTree} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ── tree stage ──────────────────────────────────────────── */}
          <div
            key={activeKey}
            style={{ position: 'relative', width: STAGE_W, height: STAGE_H }}
          >
            <TreeSvg activeBranchIds={activeBranchIds} />

            {/* left column */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: COL_W, height: '100%' }}>
              {leftMethods.map((method, i) => (
                <MethodCard
                  key={method.id}
                  method={method}
                  isExpanded={expanded.has(method.id)}
                  isActive={hoveredId === method.id}
                  onToggle={() => toggle(method.id)}
                  onHoverStart={() => setHoveredId(method.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  top={LEFT_TOPS[i]}
                  animDelay={0.75 + i * 0.07}
                />
              ))}
            </div>

            {/* right column */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: COL_W, height: '100%' }}>
              {rightMethods.map((method, i) => (
                <MethodCard
                  key={method.id}
                  method={method}
                  isExpanded={expanded.has(method.id)}
                  isActive={hoveredId === method.id}
                  onToggle={() => toggle(method.id)}
                  onHoverStart={() => setHoveredId(method.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  top={RIGHT_TOPS[i]}
                  animDelay={0.8 + i * 0.07}
                />
              ))}
            </div>
          </div>

          {/* ── ingredient caption ──────────────────────────────────── */}
          <div style={{ textAlign: 'center', maxWidth: 420, marginTop: 4 }}>
            <div style={{ color: '#C9A84C', fontSize: 12, letterSpacing: 12, marginBottom: 12 }}>
              ✦ ✦ ✦
            </div>
            <h2 style={{
              fontFamily: 'var(--font-playfair, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(26px, 3vw, 36px)',
              fontWeight: 700, color: '#6B3A4B', letterSpacing: 3, margin: 0,
            }}>
              {activeTree.label}
            </h2>
            <div style={{ fontStyle: 'italic', color: '#B09880', fontSize: 11.5, marginTop: 8, lineHeight: 1.55 }}>
              {activeTree.subtitle}
            </div>
            <div style={{ width: 36, height: 1, background: '#C9A84C', margin: '16px auto', opacity: 0.6 }} />
            <p style={{ fontSize: 12, color: '#5A3040', lineHeight: 1.75, margin: 0 }}>
              {activeTree.description}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 20,
              background: 'rgba(107,58,75,0.05)', borderRadius: 20, padding: '5px 14px',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C', display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: '#6B3A4B', letterSpacing: '1.5px', fontWeight: 600, textTransform: 'uppercase' }}>
                {methods.length}&nbsp;Zubereitungsarten
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── legend ──────────────────────────────────────────────────── */}
      <div style={{
        textAlign: 'center', padding: '20px 24px 64px',
        borderTop: '1px solid rgba(107,58,75,0.07)', marginTop: 8,
      }}>
        <div style={{ display: 'inline-flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {(
            [
              { node: <div style={{ width: 12, height: 12, borderRadius: 3, background: '#6B3A4B' }} />, label: 'Methoden-Chip' },
              { node: <div style={{ width: 12, height: 12, borderRadius: 3, background: '#FFFEF9', border: '1.5px solid #6B3A4B' }} />, label: 'Technik / Verfahren' },
              { node: <span style={{ color: '#C9A84C', fontSize: 9 }}>◆</span>, label: 'Gericht' },
              { node: <div style={{ width: 22, height: 1.5, background: '#C9A84C', opacity: 0.7 }} />, label: 'Ast' },
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

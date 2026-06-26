'use client';

import { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';

/* ─── types ──────────────────────────────────────────────────────────── */
interface TreeNodeData {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  description?: string;
  children?: TreeNodeData[];
  dishes?: string[];
  inspiration?: string;
  level: number;
}

interface PathData {
  d: string;
  key: string;
  delay: number;
}

/* ─── tree data ──────────────────────────────────────────────────────── */
const TREE: TreeNodeData = {
  id: 'root',
  label: 'KARTOFFEL',
  subtitle: 'Solanum tuberosum · Vielseitige Knolle',
  level: 0,
  description:
    'Seit dem 16. Jahrhundert aus den Anden – die Kartoffel revolutionierte die europäische Ernährung und ernährt heute Milliarden Menschen in allen Kulturen.',
  children: [
    {
      id: 'kochen', label: 'KOCHEN', icon: '🫧', level: 1,
      description: 'Feuchte Hitze bei 100 °C in kochendem Wasser oder aromatischer Brühe.',
      inspiration: 'Kräuter, Brühe statt Wasser, Aufläufe',
      children: [
        { id: 'k-ganz',  label: 'Ganz lassen', level: 2, dishes: ['Salzkartoffel', 'Pellkartoffel'] },
        { id: 'k-stueck', label: 'In Stücke',  level: 2, dishes: ['Kartoffelsuppe', 'Eintopf'] },
        { id: 'k-stamp', label: 'Stampfen',    level: 2, dishes: ['Kartoffelpüree', 'Himmel & Erde'] },
      ],
    },
    {
      id: 'backen', label: 'BACKEN', icon: '🔥', level: 1,
      description: 'Trockene Ofenhitze entwickelt Röstaroma und eine knusprige Außenhülle.',
      inspiration: 'Gewürze, Käse überbacken, Füllungen',
      children: [
        { id: 'b-ganz',    label: 'Ganz',    level: 2, dishes: ['Ofenkartoffel', 'Folienkartoffel'] },
        { id: 'b-spal',    label: 'Spalten', level: 2, dishes: ['Wedges', 'Hasselback'] },
        { id: 'b-gefuellt',label: 'Gefüllt', level: 2, dishes: ['Twice-Baked Potato'] },
      ],
    },
    {
      id: 'braten', label: 'BRATEN', icon: '🥘', level: 1,
      description: 'Fett bei hoher Hitze – goldene Kruste durch die Maillard-Reaktion.',
      inspiration: 'Zwiebeln & Speck, Kräuter & Knoblauch',
      children: [
        { id: 'br-scheib', label: 'Scheiben', level: 2, dishes: ['Bratkartoffeln', 'Lyoner Art'] },
        { id: 'br-wuef',   label: 'Würfeln',  level: 2, dishes: ['Kartoffelpfanne', 'Bauernfrühstück'] },
        { id: 'br-rasp',   label: 'Raspeln',  level: 2, dishes: ['Rösti', 'Kartoffelpuffer', 'Latkes', 'Boxty'] },
      ],
    },
    {
      id: 'frittieren', label: 'FRITTIEREN', icon: '✨', level: 1,
      description: 'Heißes Fett bei 160–190 °C – maximale Knusprigkeit durch schnellen Wasserentzug.',
      inspiration: 'Verschiedene Öle, Würzen aus dem Fett',
      children: [
        { id: 'fr-jul',    label: 'Julienne',  level: 2, dishes: ['Pommes frites', 'Curly Fries'] },
        { id: 'fr-scheib', label: 'Scheiben',  level: 2, dishes: ['Chips', 'Crisps'] },
        { id: 'fr-wuef',   label: 'Würfel',    level: 2, dishes: ['Kroketten'] },
        { id: 'fr-gauf',   label: 'Gaufrette', level: 2, dishes: ['Pommes gaufrettes (Fine Dining)'] },
      ],
    },
    {
      id: 'daempfen', label: 'DÄMPFEN', icon: '💨', level: 1,
      description: 'Wasserdampf bei 100 °C – schonendste Methode, erhält alle Nährstoffe.',
      inspiration: 'Kräuter, Butter, als Hauptgericht',
      children: [
        { id: 'd-stueck', label: 'Stücke',  level: 2, dishes: ['Gedämpfte Kartoffeln', 'Dampfkartoffelsalat'] },
        { id: 'd-scheib', label: 'Scheiben', level: 2, dishes: ['Kartoffelgemüse'] },
      ],
    },
    {
      id: 'puerieren', label: 'PÜRIEREN', icon: '🥣', level: 1,
      description: 'Von samtig-fein bis rustikal-grob – die Textur entscheidet über das Gericht.',
      inspiration: 'Sahne & Butter, Trüffel, Fine-Dining Basis',
      children: [
        {
          id: 'p-fein', label: 'Fein passiert', level: 2,
          dishes: ['Kartoffelpüree', 'Pommes Duchesse', 'Kartoffelschaum (Fine Dining)', 'Kartoffelvelouté'],
        },
        {
          id: 'p-grob', label: 'Grob gestampft', level: 2,
          dishes: ['Stampfkartoffeln', 'Rough Mash', 'Smashed Potatoes'],
        },
      ],
    },
    {
      id: 'roh', label: 'ROH', icon: '🌿', level: 1,
      description: 'Roh enthält die Kartoffel resistente Stärke – besondere Textur und Enzymatik.',
      inspiration: 'Dressing, andere Gemüse kombinieren',
      children: [
        { id: 'r-reib', label: 'Reiben',   level: 2, dishes: ['Rohkostsalat', 'Gratin roh'] },
        { id: 'r-jul',  label: 'Julienne', level: 2, dishes: ['Kartoffelnudeln roh'] },
        { id: 'r-rasp', label: 'Raspeln',  level: 2, dishes: ['Rösti (Vorbereitung)'] },
      ],
    },
    {
      id: 'fermentieren', label: 'FERMENTIEREN', icon: '🧪', level: 1,
      description: 'Mikroorganismen verwandeln die Kartoffel in neue Produkte mit komplexem Charakter.',
      inspiration: 'Probiotika, traditionelle Verfahren der Welt',
      children: [
        { id: 'fe-milch', label: 'Milchsauer',   level: 2, dishes: ['Kartoffel-Kimchi'] },
        { id: 'fe-dest',  label: 'Destillieren', level: 2, dishes: ['Wodka', 'Kartoffelschnaps', 'Poitin (irisch)'] },
        { id: 'fe-teig',  label: 'Teig-Basis',   level: 2, dishes: ['Kartoffelsauerteig'] },
      ],
    },
    {
      id: 'trocknen', label: 'TROCKNEN', icon: '🌬️', level: 1,
      description: 'Feuchtigkeitsentzug konzentriert Aromen und verlängert die Haltbarkeit erheblich.',
      inspiration: 'Haltbarmachen, Geschmack konzentrieren',
      children: [
        { id: 't-trock',    label: 'Trocknen',        level: 2, dishes: ['Kartoffelflocken', 'Kartoffelmehl'] },
        { id: 't-einm',     label: 'Einmachen',       level: 2, dishes: ['Kartoffelkonserven'] },
        { id: 't-gefriert', label: 'Gefriertrocknen', level: 2, dishes: ['Chuño (peruanisch)'] },
      ],
    },
  ],
};

/* ─── helpers ────────────────────────────────────────────────────────── */
function findNode(root: TreeNodeData, id: string): TreeNodeData | null {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}

function descendantIds(node: TreeNodeData): string[] {
  return [node.id, ...(node.children ?? []).flatMap(descendantIds)];
}

/* ─── tooltip ────────────────────────────────────────────────────────── */
function Tooltip({ text, sub, small }: { text: string; sub?: string; small?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#2C1A20',
        color: '#FAF8F5',
        padding: small ? '8px 12px' : '12px 16px',
        borderRadius: 10,
        fontSize: small ? 10 : 11,
        width: 200,
        textAlign: 'left',
        zIndex: 200,
        pointerEvents: 'none',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        lineHeight: 1.55,
        whiteSpace: 'normal',
      }}
    >
      <div style={{ marginBottom: sub ? 6 : 0 }}>{text}</div>
      {sub && (
        <div style={{ color: '#C9A84C', fontStyle: 'italic', fontSize: 10 }}>✦ {sub}</div>
      )}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #2C1A20',
        }}
      />
    </div>
  );
}

/* ─── CSS ────────────────────────────────────────────────────────────── */
const ANIM_CSS = `
  @keyframes rootDrop {
    from { transform: translateY(-50px); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }
  @keyframes nodeIn {
    from { transform: scale(0.82); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  @keyframes lineDraw {
    from { stroke-dashoffset: 3000; }
    to   { stroke-dashoffset: 0;    }
  }
`;

const COL_W = 155; // px per Level-1 column
const COL_GAP = 10;

/* ─── page ───────────────────────────────────────────────────────────── */
export default function ZutatenStammbaumPage() {
  const [expanded, setExpanded]     = useState<Set<string>>(new Set(['root']));
  const [hovered, setHovered]       = useState<string | null>(null);
  const [paths, setPaths]           = useState<PathData[]>([]);

  const containerRef  = useRef<HTMLDivElement>(null);
  const nodeRefs      = useRef<Map<string, HTMLElement>>(new Map());
  const expandedRef   = useRef(expanded);

  /* keep ref in sync */
  useEffect(() => { expandedRef.current = expanded; }, [expanded]);

  /* register/unregister node DOM refs */
  const reg = useCallback((id: string, el: HTMLElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else    nodeRefs.current.delete(id);
  }, []);

  /* expand / collapse subtree */
  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        const node = findNode(TREE, id);
        if (node) descendantIds(node).forEach(d => next.delete(d));
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /* ── SVG path calculation ─────────────────────────────────────── */
  const calcPaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr  = container.getBoundingClientRect();
    const exp = expandedRef.current;

    const pos = (id: string) => {
      const el = nodeRefs.current.get(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        cx:     r.left - cr.left + r.width  / 2,
        top:    r.top  - cr.top,
        bottom: r.bottom - cr.top,
      };
    };

    const result: PathData[] = [];
    let delay = 0.4;

    const walk = (node: TreeNodeData) => {
      if (!exp.has(node.id)) return;
      for (const child of node.children ?? []) {
        const p = pos(node.id);
        const c = pos(child.id);
        if (p && c) {
          const my = (p.bottom + c.top) / 2;
          result.push({
            d:     `M ${p.cx} ${p.bottom} C ${p.cx} ${my}, ${c.cx} ${my}, ${c.cx} ${c.top}`,
            key:   `${node.id}→${child.id}`,
            delay,
          });
          delay += 0.04;
        }
        walk(child);
      }
    };

    walk(TREE);
    setPaths(result);
  }, []);

  /* recalculate after state change */
  useLayoutEffect(() => {
    const t = setTimeout(calcPaths, 25);
    return () => clearTimeout(t);
  }, [expanded, calcPaths]);

  /* recalculate on container resize */
  useEffect(() => {
    const obs = new ResizeObserver(calcPaths);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [calcPaths]);

  /* ── render ───────────────────────────────────────────────────── */
  const totalW = (TREE.children?.length ?? 0) * (COL_W + COL_GAP) + 80;

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <style>{ANIM_CSS}</style>

      {/* ── page header ─────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '44px 24px 36px' }}>
        <div style={{ fontSize: 10, letterSpacing: '5px', color: '#C9A84C', marginBottom: 14, textTransform: 'uppercase' }}>
          ✦ &nbsp;Zutaten · Stammbaum&nbsp; ✦
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-playfair, "Playfair Display", Georgia, serif)',
            fontSize: 'clamp(26px, 4vw, 38px)',
            color: '#6B3A4B',
            margin: 0,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          Von der Knolle zum Gericht
        </h1>
        <p style={{ color: '#B09880', fontSize: 12, marginTop: 10, letterSpacing: '0.5px' }}>
          Entdecke alle Zubereitungsarten — klicke auf eine Methode zum Aufklappen
        </p>
      </div>

      {/* ── scrollable tree ─────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', paddingBottom: 80 }}>
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            minWidth: Math.max(totalW, 1440),
            padding: '0 40px 140px',
          }}
        >
          {/* SVG overlay (position: absolute covers the container) */}
          <svg
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            {paths.map(({ d, key, delay }) => (
              <path
                key={key}
                d={d}
                fill="none"
                stroke="#C9A84C"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray={3000}
                style={{ animation: `lineDraw 0.75s ease-out ${delay}s both` }}
              />
            ))}
          </svg>

          {/* ── tree content ──────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* Root node */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 68 }}>
              <div
                ref={el => reg('root', el)}
                style={{
                  position: 'relative',
                  border: '2px solid #6B3A4B',
                  borderRadius: 18,
                  padding: '26px 48px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                  minWidth: 300,
                  animation: 'rootDrop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
                  boxShadow: hovered === 'root'
                    ? '0 0 24px rgba(107,58,75,0.35), 0 8px 32px rgba(107,58,75,0.18)'
                    : '0 4px 24px rgba(107,58,75,0.13)',
                  transition: 'box-shadow 0.25s',
                  cursor: 'default',
                }}
                onMouseEnter={() => setHovered('root')}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Gold ornament */}
                <div style={{ color: '#C9A84C', fontSize: 15, letterSpacing: 10, marginBottom: 12 }}>✦ ✦ ✦</div>
                <div
                  style={{
                    fontFamily: 'var(--font-playfair, "Playfair Display", Georgia, serif)',
                    fontSize: 34,
                    fontWeight: 700,
                    color: '#6B3A4B',
                    letterSpacing: 3,
                    lineHeight: 1.1,
                  }}
                >
                  KARTOFFEL
                </div>
                <div style={{ fontStyle: 'italic', color: '#B09880', fontSize: 13, marginTop: 7 }}>
                  Solanum tuberosum · Vielseitige Knolle
                </div>
                <div style={{ color: '#C9A84C', fontSize: 10, marginTop: 12, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                  9 Zubereitungsarten
                </div>

                {/* Gold decorative line */}
                <div style={{ width: 60, height: 1, background: '#C9A84C', margin: '12px auto 0', opacity: 0.5 }} />

                {hovered === 'root' && TREE.description && (
                  <Tooltip text={TREE.description} />
                )}
              </div>
            </div>

            {/* Level 1 — method nodes */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: COL_GAP,
              }}
            >
              {TREE.children?.map((method, mi) => (
                <div
                  key={method.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: COL_W,
                    flexShrink: 0,
                  }}
                >
                  {/* ── Method node (Level 1) ── */}
                  <div
                    ref={el => reg(method.id, el)}
                    onClick={() => toggle(method.id)}
                    onMouseEnter={() => setHovered(method.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'relative',
                      background: '#6B3A4B',
                      color: '#FFFFFF',
                      borderRadius: 12,
                      padding: '14px 10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      width: '100%',
                      boxSizing: 'border-box',
                      animation: `nodeIn 0.4s ease-out ${0.28 + mi * 0.07}s both`,
                      boxShadow: expanded.has(method.id)
                        ? '0 0 20px rgba(107,58,75,0.55), 0 4px 16px rgba(107,58,75,0.3)'
                        : hovered === method.id
                        ? '0 0 16px rgba(107,58,75,0.35)'
                        : '0 2px 8px rgba(107,58,75,0.2)',
                      transition: 'box-shadow 0.2s, transform 0.15s',
                      transform: hovered === method.id && !expanded.has(method.id) ? 'scale(1.04)' : 'scale(1)',
                      outline: expanded.has(method.id) ? '2px solid #C9A84C' : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 7, lineHeight: 1 }}>{method.icon}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '1.5px' }}>{method.label}</div>
                    <div style={{ fontSize: 9, opacity: 0.65, marginTop: 4 }}>
                      {method.children?.length}&nbsp;Arten
                    </div>
                    <div style={{ fontSize: 11, marginTop: 7, color: '#C9A84C' }}>
                      {expanded.has(method.id) ? '▲' : '▼'}
                    </div>

                    {hovered === method.id && method.description && (
                      <Tooltip text={method.description} sub={method.inspiration} />
                    )}
                  </div>

                  {/* ── Level 2 — process nodes (when method is expanded) ── */}
                  {expanded.has(method.id) && method.children && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginTop: 44,
                        width: '100%',
                      }}
                    >
                      {method.children.map((proc, pi) => (
                        <div key={proc.id}>
                          {/* Process node */}
                          <div
                            ref={el => reg(proc.id, el)}
                            onClick={() => toggle(proc.id)}
                            onMouseEnter={() => setHovered(proc.id)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                              position: 'relative',
                              border: '1.5px solid #6B3A4B',
                              borderRadius: 10,
                              padding: '9px 10px',
                              textAlign: 'center',
                              background: '#FFFEF9',
                              cursor: 'pointer',
                              animation: `nodeIn 0.3s ease-out ${pi * 0.07}s both`,
                              boxShadow: hovered === proc.id
                                ? '0 0 16px rgba(107,58,75,0.3)'
                                : '0 1px 4px rgba(107,58,75,0.08)',
                              transition: 'box-shadow 0.2s',
                            }}
                          >
                            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#6B3A4B' }}>
                              {proc.label}
                            </div>
                            <div style={{ fontSize: 9, color: '#C9A84C', marginTop: 3 }}>
                              {expanded.has(proc.id) ? '▲' : '▼'}&nbsp;
                              {proc.dishes?.length}&nbsp;
                              {proc.dishes?.length === 1 ? 'Gericht' : 'Gerichte'}
                            </div>

                            {hovered === proc.id && proc.dishes && (
                              <Tooltip text={proc.dishes.join(' · ')} small />
                            )}
                          </div>

                          {/* ── Level 3 — dish nodes (when process is expanded) ── */}
                          {expanded.has(proc.id) && proc.dishes && (
                            <div style={{ paddingLeft: 4, marginTop: 6 }}>
                              {proc.dishes.map((dish, di) => (
                                <div
                                  key={dish}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 6,
                                    padding: '3px 2px',
                                    animation: `nodeIn 0.2s ease-out ${di * 0.04}s both`,
                                  }}
                                >
                                  <span style={{ color: '#C9A84C', fontSize: 7, flexShrink: 0, marginTop: 3 }}>◆</span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: '#5A3040',
                                      fontStyle: 'italic',
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {dish}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── legend ──────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px 24px 60px',
          borderTop: '1px solid rgba(107,58,75,0.08)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            gap: 28,
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {[
            { shape: 'rect', bg: '#6B3A4B', border: 'none',               label: 'Zubereitungsmethode' },
            { shape: 'rect', bg: '#FFFEF9', border: '1.5px solid #6B3A4B', label: 'Schnitttechnik / Verfahren' },
            { shape: 'dot',  bg: '#C9A84C', border: 'none',               label: 'Spezifisches Gericht' },
          ].map(({ shape, bg, border, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {shape === 'dot' ? (
                <span style={{ color: '#C9A84C', fontSize: 10 }}>◆</span>
              ) : (
                <div
                  style={{
                    width: 14, height: 14, borderRadius: 4,
                    background: bg, border: border || 'none',
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ fontSize: 11, color: '#8B7355' }}>{label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 1.5, background: '#C9A84C', opacity: 0.8 }} />
            <span style={{ fontSize: 11, color: '#8B7355' }}>Verbindungslinie</span>
          </div>
        </div>
      </div>
    </div>
  );
}

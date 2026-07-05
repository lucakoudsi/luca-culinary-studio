/* ─── Hand-tuned procedural tree geometry for the Zutatenstammbaum page ──
   Pure math, no React. Produces static SVG path strings for a trunk,
   8 tapering main branches (ending exactly at the 8 method-card slots),
   decorative twigs, a root system and a small crown tuft. Everything is
   generated once at module load since the skeleton is identical for
   every ingredient — only the card content changes. */

export const STAGE_W = 1196;
export const STAGE_H = 740;
export const COL_W = 230;
export const ANCHOR_Y = 30;

export const LEFT_TOPS = [8, 30, 52, 76];
export const RIGHT_TOPS = [14, 36, 60, 80];

interface Pt { x: number; y: number; }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const f = (n: number) => n.toFixed(1);

function topToY(topPercent: number): number {
  return (topPercent / 100) * STAGE_H + ANCHOR_Y;
}

export const LEFT_TIPS: Pt[]  = LEFT_TOPS.map(t => ({ x: COL_W, y: topToY(t) }));
export const RIGHT_TIPS: Pt[] = RIGHT_TOPS.map(t => ({ x: STAGE_W - COL_W, y: topToY(t) }));

/* ─── trunk ────────────────────────────────────────────────────────────── */
const TRUNK_TOP_Y  = 55;
const TRUNK_BASE_Y = STAGE_H - 55;
const TRUNK_CX     = STAGE_W / 2;
const TRUNK_TOP_HW  = 9;
const TRUNK_BASE_HW = 54;

function trunkT(y: number): number {
  return clamp((y - TRUNK_TOP_Y) / (TRUNK_BASE_Y - TRUNK_TOP_Y), 0, 1);
}

export function trunkCenterX(y: number): number {
  const t = trunkT(y);
  return TRUNK_CX + 26 * Math.sin(t * 2.1 + 0.3) + 11 * Math.sin(t * 4.6 + 1.6) - 8 * t;
}

export function trunkHalfWidth(y: number): number {
  const t = trunkT(y);
  return TRUNK_TOP_HW + (TRUNK_BASE_HW - TRUNK_TOP_HW) * Math.pow(t, 0.6);
}

function buildTrunkPath(): string {
  const N = 30;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const y = TRUNK_BASE_Y - (TRUNK_BASE_Y - TRUNK_TOP_Y) * (i / N);
    const cx = trunkCenterX(y);
    const hw = trunkHalfWidth(y);
    left.push({ x: cx - hw, y });
    right.push({ x: cx + hw, y });
  }
  let d = `M ${f(left[0].x)} ${f(left[0].y)} `;
  for (let i = 1; i <= N; i++) d += `L ${f(left[i].x)} ${f(left[i].y)} `;
  const topCx = trunkCenterX(TRUNK_TOP_Y);
  d += `Q ${f(topCx)} ${f(TRUNK_TOP_Y - 9)}, ${f(right[N].x)} ${f(right[N].y)} `;
  for (let i = N - 1; i >= 0; i--) d += `L ${f(right[i].x)} ${f(right[i].y)} `;
  const botCx = trunkCenterX(TRUNK_BASE_Y);
  d += `Q ${f(botCx)} ${f(TRUNK_BASE_Y + 16)}, ${f(left[0].x)} ${f(left[0].y)} Z`;
  return d;
}

export const TRUNK_PATH = buildTrunkPath();
export const TRUNK_BASE_PT: Pt = { x: trunkCenterX(TRUNK_BASE_Y), y: TRUNK_BASE_Y };
export const TRUNK_TOP_PT: Pt  = { x: trunkCenterX(TRUNK_TOP_Y), y: TRUNK_TOP_Y };

function buildBarkLine(frac: number, jitter: number): string {
  const N = 12;
  const yTop = TRUNK_TOP_Y + 24;
  const yBase = TRUNK_BASE_Y - 18;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = yBase - (yBase - yTop) * t;
    const cx = trunkCenterX(y);
    const hw = trunkHalfWidth(y);
    const x = cx + hw * frac + Math.sin(t * 6 + jitter) * 2.2;
    d += (i === 0 ? 'M' : 'L') + ` ${f(x)} ${f(y)} `;
  }
  return d;
}

export const BARK_LINES = [-0.55, -0.18, 0.22, 0.58].map((frac, i) => buildBarkLine(frac, i * 1.3));

/* ─── bezier + tapered ribbon helpers ────────────────────────────────────── */
function bezierPoint(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function bezierTangent(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt {
  const mt = 1 - t;
  return {
    x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

function ribbonPath(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w0: number, w1: number, samples = 20): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt  = bezierPoint(t, p0, p1, p2, p3);
    const tan = bezierTangent(t, p0, p1, p2, p3);
    const len = Math.hypot(tan.x, tan.y) || 1;
    const nx = -tan.y / len;
    const ny = tan.x / len;
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push({ x: pt.x + nx * w, y: pt.y + ny * w });
    right.push({ x: pt.x - nx * w, y: pt.y - ny * w });
  }
  let d = `M ${f(left[0].x)} ${f(left[0].y)} `;
  for (let i = 1; i < left.length; i++) d += `L ${f(left[i].x)} ${f(left[i].y)} `;
  for (let i = right.length - 1; i >= 0; i--) d += `L ${f(right[i].x)} ${f(right[i].y)} `;
  d += 'Z';
  return d;
}

/* ─── the 8 main branches ─────────────────────────────────────────────────
   Hand-tuned per branch: attach height on the trunk, "bulge" of the two
   control points (how steeply it shoots up before arcing to its tip),
   and a small x-jitter so left/right don't read as mirror copies. */
interface BranchConfig {
  tip: Pt;
  baseYOffset: number;   // attach this far *below* the tip, along the trunk
  bulge1: number;        // how far P1 pulls upward from the attach point
  bulge2: number;        // how far P2 sits below/above the tip height
  jitter: number;        // small horizontal control-point variation
}

const LEFT_CONFIG: BranchConfig[] = [
  { tip: LEFT_TIPS[0], baseYOffset: 46, bulge1: 72, bulge2: 12, jitter: -6 },
  { tip: LEFT_TIPS[1], baseYOffset: 66, bulge1: 96, bulge2: 20, jitter: 9 },
  { tip: LEFT_TIPS[2], baseYOffset: 72, bulge1: 82, bulge2: 15, jitter: -11 },
  { tip: LEFT_TIPS[3], baseYOffset: 96, bulge1: 62, bulge2: 24, jitter: 7 },
];

const RIGHT_CONFIG: BranchConfig[] = [
  { tip: RIGHT_TIPS[0], baseYOffset: 52, bulge1: 88, bulge2: 16, jitter: 8 },
  { tip: RIGHT_TIPS[1], baseYOffset: 64, bulge1: 70, bulge2: 22, jitter: -9 },
  { tip: RIGHT_TIPS[2], baseYOffset: 78, bulge1: 100, bulge2: 12, jitter: 6 },
  { tip: RIGHT_TIPS[3], baseYOffset: 90, bulge1: 64, bulge2: 26, jitter: -8 },
];

export interface Branch {
  id: string;
  side: 'left' | 'right';
  index: number;
  path: string;
  base: Pt;
  tip: Pt;
  twigs: string[];
}

function buildBranch(side: 'left' | 'right', index: number, cfg: BranchConfig): Branch {
  const sign = side === 'left' ? -1 : 1;
  const baseY = clamp(cfg.tip.y + cfg.baseYOffset, TRUNK_TOP_Y + 20, TRUNK_BASE_Y - 10);
  const cx = trunkCenterX(baseY);
  const hw = trunkHalfWidth(baseY);
  const base: Pt = { x: cx + sign * hw * 0.82, y: baseY };
  const tip = cfg.tip;

  const dx = tip.x - base.x;

  const p1: Pt = { x: base.x + dx * 0.16 + cfg.jitter, y: base.y - cfg.bulge1 };
  const p2: Pt = { x: base.x + dx * 0.74 - cfg.jitter, y: tip.y + cfg.bulge2 };

  const baseWidth = clamp(hw * 2 * 0.5, 11, 28);
  const tipWidth = 3.5;

  const path = ribbonPath(base, p1, p2, tip, baseWidth, tipWidth);

  // one or two small decorative twigs peeling off the branch
  const twigs: string[] = [];
  const twigSpots = index >= 2 ? [0.34, 0.6] : [0.52];
  twigSpots.forEach((t, ti) => {
    const pt = bezierPoint(t, base, p1, p2, tip);
    const tan = bezierTangent(t, base, p1, p2, tip);
    const ang = Math.atan2(tan.y, tan.x);
    const twigAng = ang + (ti % 2 === 0 ? 1 : -1) * (0.75 + t * 0.3);
    const len = 32 + (index % 2) * 10 + ti * 6;
    const end: Pt = { x: pt.x + Math.cos(twigAng) * len, y: pt.y + Math.sin(twigAng) * len };
    const ctrl: Pt = {
      x: pt.x + Math.cos(twigAng - 0.3) * len * 0.55,
      y: pt.y + Math.sin(twigAng - 0.3) * len * 0.55,
    };
    twigs.push(`M ${f(pt.x)} ${f(pt.y)} Q ${f(ctrl.x)} ${f(ctrl.y)}, ${f(end.x)} ${f(end.y)}`);
  });

  return { id: `${side}-${index}`, side, index, path, base, tip, twigs };
}

export const LEFT_BRANCHES: Branch[]  = LEFT_CONFIG.map((cfg, i) => buildBranch('left', i, cfg));
export const RIGHT_BRANCHES: Branch[] = RIGHT_CONFIG.map((cfg, i) => buildBranch('right', i, cfg));
export const ALL_BRANCHES: Branch[] = [...LEFT_BRANCHES, ...RIGHT_BRANCHES];

/* ─── crown tuft ───────────────────────────────────────────────────────── */
export interface CrownTwig { path: string; bud: Pt; }

function buildCrownTwigs(): CrownTwig[] {
  const origin = TRUNK_TOP_PT;
  const angles = [-72, -46, -20, 4, 26, 50, 74];
  return angles.map((deg, i) => {
    const rad = (deg - 90) * (Math.PI / 180);
    const len = 46 + (i % 3) * 14;
    const end: Pt = { x: origin.x + Math.cos(rad) * len, y: origin.y + Math.sin(rad) * len };
    const ctrl: Pt = {
      x: origin.x + Math.cos(rad - 0.2) * len * 0.55,
      y: origin.y + Math.sin(rad - 0.2) * len * 0.55,
    };
    return {
      path: `M ${f(origin.x)} ${f(origin.y)} Q ${f(ctrl.x)} ${f(ctrl.y)}, ${f(end.x)} ${f(end.y)}`,
      bud: end,
    };
  });
}

export const CROWN_TWIGS = buildCrownTwigs();

/* ─── root system ──────────────────────────────────────────────────────── */
function buildRoots(): string[] {
  const base = TRUNK_BASE_PT;
  const hw = trunkHalfWidth(TRUNK_BASE_Y);
  const spread = [
    { dx: -255, depth: 42, w0factor: 0.62 },
    { dx: -172, depth: 58, w0factor: 0.78 },
    { dx: -92,  depth: 50, w0factor: 0.7 },
    { dx: -18,  depth: 62, w0factor: 0.55 },
    { dx: 55,   depth: 52, w0factor: 0.68 },
    { dx: 138,  depth: 60, w0factor: 0.74 },
    { dx: 222,  depth: 44, w0factor: 0.6 },
  ];
  return spread.map(({ dx, depth, w0factor }) => {
    const startX = base.x + dx * 0.18;
    const p0: Pt = { x: startX, y: base.y - 6 };
    const tipY = Math.min(STAGE_H - 10, base.y + depth);
    const tip: Pt = { x: base.x + dx, y: tipY };
    const p1: Pt = { x: base.x + dx * 0.35, y: base.y + depth * 0.25 };
    const p2: Pt = { x: base.x + dx * 0.75, y: tipY - depth * 0.1 };
    const w0 = clamp(hw * w0factor, 8, 20);
    return ribbonPath(p0, p1, p2, tip, w0, 2, 14);
  });
}

export const ROOT_PATHS = buildRoots();

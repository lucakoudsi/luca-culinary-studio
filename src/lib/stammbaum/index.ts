export type { TreeNodeData } from './types';

export { KARTOFFEL } from './kartoffel';
export { EI } from './ei';
export { TOMATE } from './tomate';
export { ZWIEBEL } from './zwiebel';
export { PILZ } from './pilz';
export { KAROTTE } from './karotte';

import { KARTOFFEL } from './kartoffel';
import { EI } from './ei';
import { TOMATE } from './tomate';
import { ZWIEBEL } from './zwiebel';
import { PILZ } from './pilz';
import { KAROTTE } from './karotte';
import type { TreeNodeData } from './types';

export const TREE_REGISTRY: Record<string, TreeNodeData> = {
  kartoffel: KARTOFFEL,
  ei: EI,
  tomate: TOMATE,
  zwiebel: ZWIEBEL,
  pilz: PILZ,
  karotte: KAROTTE,
};

export const TREE_ORDER = ['kartoffel', 'ei', 'tomate', 'zwiebel', 'pilz', 'karotte'];

export const TREE_EMOJI: Record<string, string> = {
  kartoffel: '🥔',
  ei: '🥚',
  tomate: '🍅',
  zwiebel: '🧅',
  pilz: '🍄',
  karotte: '🥕',
};

// Curated Unsplash food photography — deterministic per recipe (id % set.length)
const images: Record<string, string[]> = {
  Vorspeise: [
    'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80&auto=format&fit=crop',
  ],
  Suppe: [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80&auto=format&fit=crop',
  ],
  Hauptgang: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  ],
  Dessert: [
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80&auto=format&fit=crop',
  ],
  Beilage: [
    'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80&auto=format&fit=crop',
  ],
  Snack: [
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80&auto=format&fit=crop',
  ],
};

const fallback = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop';

export function getFoodImage(category: string, id: number): string {
  const set = images[category];
  if (!set || set.length === 0) return fallback;
  return set[id % set.length];
}

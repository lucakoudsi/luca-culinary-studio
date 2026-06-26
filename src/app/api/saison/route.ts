import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1; // 1–12
  if (month >= 3 && month <= 5) return 'Frühling';
  if (month >= 6 && month <= 8) return 'Sommer';
  if (month >= 9 && month <= 11) return 'Herbst';
  return 'Winter';
}

const COLS = 'id, name, kategorie, saison, image_url, beschreibung';

export async function GET(req: NextRequest) {
  try {
    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const season = searchParams.get('season') || getCurrentSeason();

    console.log('[saison] season:', season);

    // Two separate contains() calls — more reliable than .or() with cs operator
    const [r1, r2] = await Promise.all([
      db.from('zutaten').select(COLS).contains('saison', [season]).order('name'),
      db.from('zutaten').select(COLS).contains('saison', ['Ganzjährig']).order('name'),
    ]);

    console.log('[saison] season count:', r1.data?.length, 'error:', r1.error?.message);
    console.log('[saison] ganzjaehrig count:', r2.data?.length, 'error:', r2.error?.message);

    const seasonItems    = r1.data ?? [];
    const ganzjaehrig    = (r2.data ?? []).filter(z => !seasonItems.some(s => s.id === z.id));
    const merged         = [...seasonItems, ...ganzjaehrig];

    return NextResponse.json(merged);
  } catch (e) {
    console.error('[saison API catch]', e);
    return NextResponse.json([]);
  }
}

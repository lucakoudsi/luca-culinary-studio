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

export async function GET(req: NextRequest) {
  try {
    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const season = searchParams.get('season') || getCurrentSeason();

    // PostgreSQL array contains: saison @> '{Sommer}' OR saison @> '{Ganzjährig}'
    const { data, error } = await db
      .from('zutaten')
      .select('id, name, kategorie, saison, image_url, beschreibung')
      .or(`saison.cs.{${season}},saison.cs.{Ganzjährig}`)
      .order('name');

    if (error) {
      console.error('[saison API]', error);
      return NextResponse.json([], { status: 200 });
    }

    // Sort: season-specific first, Ganzjährig last
    const sorted = (data ?? []).sort((a, b) => {
      const aMain = Array.isArray(a.saison) && a.saison.includes(season);
      const bMain = Array.isArray(b.saison) && b.saison.includes(season);
      if (aMain && !bMain) return -1;
      if (!aMain && bMain) return 1;
      return (a.name ?? '').localeCompare(b.name ?? '', 'de');
    });

    return NextResponse.json(sorted);
  } catch (e) {
    console.error('[saison API]', e);
    return NextResponse.json([]);
  }
}

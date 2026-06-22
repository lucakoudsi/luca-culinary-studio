import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const CATEGORY_ALIASES: Record<string, string> = {
  'Gewürze & Kräuter': 'Kräuter & Gewürze',
  'Milchprodukte':     'Milchprodukte & Käse',
};

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('zutaten')
    .select('*')
    .order('name');
  console.log('[zutaten] count:', data?.length, 'error:', error?.message ?? null);
  if (error) return NextResponse.json([]);
  return NextResponse.json((data ?? []).map(toIngredient));
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { data, error } = await supabase
    .from('zutaten')
    .insert({
      name:         body.name,
      kategorie:    body.category ?? '',
      saison:       body.seasons  ?? [],
      herkunft:     body.origin   ?? '',
      aromaprofil:  body.aromas   ?? [],
      geschmack:    body.flavor   ?? {},
      pairings:     body.pairings ?? [],
      beschreibung: body.description ?? '',
      lagertemp:    body.storageTemp ?? '',
      einheit:      body.unit ?? 'Gramm',
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toIngredient(data), { status: 201 });
}

function toIngredient(row: Record<string, unknown>) {
  const kategorie = (row.kategorie as string) ?? '';
  return {
    id:          row.id,
    name:        row.name,
    category:    CATEGORY_ALIASES[kategorie] ?? kategorie,
    seasons:     (row.saison      as string[]) ?? [],
    origin:      row.herkunft     ?? '',
    aromas:      (row.aromaprofil as string[]) ?? [],
    flavor:      (row.geschmack   as Record<string, number>) ?? {},
    pairings:    (row.pairings    as string[]) ?? [],
    description: row.beschreibung ?? '',
    storageTemp: row.lagertemp    ?? '',
    unit:        row.einheit      ?? 'Gramm',
  };
}

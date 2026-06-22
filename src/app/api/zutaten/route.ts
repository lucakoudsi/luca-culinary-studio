import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
const supabase = createAdminClient();

export async function GET() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');
  if (error) return NextResponse.json([]);
  return NextResponse.json((data ?? []).map(toIngredient));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      name:         body.name,
      category:     body.category ?? '',
      seasons:      body.seasons  ?? [],
      origin:       body.origin   ?? '',
      aromas:       body.aromas   ?? [],
      flavor:       body.flavor   ?? {},
      pairings:     body.pairings ?? [],
      description:  body.description ?? '',
      storage_temp: body.storageTemp ?? '',
      unit:         body.unit ?? 'Gramm',
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toIngredient(data), { status: 201 });
}

function toIngredient(row: Record<string, unknown>) {
  return {
    id:          row.id,
    name:        row.name,
    category:    row.category   ?? '',
    seasons:     (row.seasons   as string[]) ?? [],
    origin:      row.origin     ?? '',
    aromas:      (row.aromas    as string[]) ?? [],
    flavor:      row.flavor     ?? {},
    pairings:    (row.pairings  as string[]) ?? [],
    description: row.description ?? '',
    storageTemp: row.storage_temp ?? '',
    unit:        row.unit ?? 'Gramm',
  };
}

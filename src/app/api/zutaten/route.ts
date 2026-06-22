import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const CATEGORY_ALIASES: Record<string, string> = {
  'Gewürze & Kräuter': 'Kräuter & Gewürze',
  'Milchprodukte':     'Milchprodukte & Käse',
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('zutaten')
      .select('*')
      .order('name')

    console.log('[zutaten API] count:', data?.length, 'error:', error)

    if (error) {
      console.error('[zutaten API] error:', error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(Array.isArray(data) ? data.map(toIngredient) : [])
  } catch (e) {
    console.error('[zutaten API] catch:', e)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabaseAdmin
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
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(toIngredient(data), { status: 201 })
  } catch (e) {
    console.error('[zutaten API] POST catch:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function toIngredient(row: Record<string, unknown>) {
  const kategorie = (row.kategorie as string) ?? ''
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
  }
}

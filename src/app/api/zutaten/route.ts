import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Debug mode: return 3 raw rows to verify DB connection
  if (searchParams.get('debug') === 'true') {
    const { data, error } = await supabaseAdmin
      .from('zutaten')
      .select('*')
      .limit(3)
    return NextResponse.json({ raw: data, error, count: data?.length })
  }

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

    return NextResponse.json(Array.isArray(data) ? data : [])
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
        kategorie:    body.kategorie ?? body.category ?? '',
        saison:       body.saison    ?? body.seasons  ?? [],
        herkunft:     body.herkunft  ?? body.origin   ?? '',
        aromaprofil:  body.aromaprofil ?? body.aromas ?? [],
        geschmack:    body.geschmack ?? body.flavor   ?? {},
        pairings:     body.pairings  ?? [],
        beschreibung: body.beschreibung ?? body.description ?? '',
        lagertemp:    body.lagertemp ?? body.storageTemp ?? '',
        einheit:      body.einheit   ?? body.unit ?? 'Gramm',
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('[zutaten API] POST catch:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

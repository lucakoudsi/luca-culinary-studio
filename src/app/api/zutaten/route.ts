import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// Force dynamic so Next.js never caches this route between users
export const dynamic = 'force-dynamic';

const db = createAdminClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('debug') === 'true') {
    const { data, error } = await db.from('zutaten').select('*').limit(3);
    return NextResponse.json({ raw: data, error, count: data?.length });
  }

  try {
    const { data, error } = await db
      .from('zutaten')
      .select('id,name,kategorie,saison,herkunft,aromaprofil,geschmack,pairings,beschreibung,lagertemp,einheit,image_url')
      .order('name');

    if (error) {
      console.error('[zutaten API] error:', error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('[zutaten API] catch:', e);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await db
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
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('[zutaten API] POST catch:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';

export const dynamic = 'force-dynamic';

const db = createAdminClient();

export async function GET() {
  const { data, error } = await db
    .from('weine')
    .select('*')
    .order('typ')
    .order('name');
  if (error) {
    console.error('[weine GET]', error.message);
    return NextResponse.json([]);
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { data, error } = await db
      .from('weine')
      .insert({
        name:         body.name,
        typ:          body.typ,
        rebsorte:     body.rebsorte,
        region:       body.region,
        land:         body.land,
        beschreibung: body.beschreibung ?? null,
        profil:       body.profil ?? {},
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('[weine POST]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

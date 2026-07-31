import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';
import { CHANGELOG_KATEGORIEN } from '@/config/changelog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('changelog_entries')
    .select('id, titel, text, kategorie, sichtbar, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { titel, text, kategorie, sichtbar } = await req.json();

    if (typeof titel !== 'string' || !titel.trim()) {
      return NextResponse.json({ error: 'Titel fehlt.' }, { status: 400 });
    }
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text fehlt.' }, { status: 400 });
    }
    if (!CHANGELOG_KATEGORIEN.includes(kategorie)) {
      return NextResponse.json({ error: 'Ungültige Kategorie.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('changelog_entries')
      .insert({ titel: titel.trim(), text: text.trim(), kategorie, sichtbar: !!sichtbar })
      .select('id, titel, text, kategorie, sichtbar, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entry: data });
  } catch (e) {
    console.error('[admin/changelog POST]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';
import { CHANGELOG_KATEGORIEN } from '@/config/changelog';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { titel, text, kategorie, sichtbar } = await req.json();

    const update: Record<string, unknown> = {};
    if (titel !== undefined) {
      if (typeof titel !== 'string' || !titel.trim()) {
        return NextResponse.json({ error: 'Ungültiger Titel.' }, { status: 400 });
      }
      update.titel = titel.trim();
    }
    if (text !== undefined) {
      if (typeof text !== 'string' || !text.trim()) {
        return NextResponse.json({ error: 'Ungültiger Text.' }, { status: 400 });
      }
      update.text = text.trim();
    }
    if (kategorie !== undefined) {
      if (!CHANGELOG_KATEGORIEN.includes(kategorie)) {
        return NextResponse.json({ error: 'Ungültige Kategorie.' }, { status: 400 });
      }
      update.kategorie = kategorie;
    }
    if (sichtbar !== undefined) update.sichtbar = !!sichtbar;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('changelog_entries')
      .update(update)
      .eq('id', params.id)
      .select('id, titel, text, kategorie, sichtbar, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entry: data });
  } catch (e) {
    console.error('[admin/changelog PATCH]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('changelog_entries').delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

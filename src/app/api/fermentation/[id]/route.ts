import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { requireTier } from '@/lib/apiAuth';

const db = createAdminClient();

function toProject(row: Record<string, unknown>) {
  return {
    id:          row.id as number,
    name:        (row.name as string) ?? '',
    typ:         (row.typ as string) ?? '',
    startdatum:  (row.startdatum as string) ?? '',
    dauer_tage:  (row.dauer_tage as number) ?? 0,
    status:      (row.status as string) ?? 'Aktiv',
    fortschritt: (row.fortschritt as number) ?? 0,
    temperatur:  (row.temperatur as string) ?? '',
    gefaess:     (row.gefaess as string) ?? '',
    beschreibung:(row.beschreibung as string) ?? '',
    notizen:     (row.notizen as unknown[]) ?? [],
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const check = await requireTier(req, 1);
    if (!check.ok) return check.response;
    const user = check.user;

    const { id } = await params;
    const body = await req.json();

    const { data, error } = await db
      .from('fermentation')
      .update({
        name:         body.name,
        typ:          body.typ,
        startdatum:   body.startdatum,
        dauer_tage:   body.dauer_tage,
        status:       body.status,
        fortschritt:  body.fortschritt,
        temperatur:   body.temperatur,
        gefaess:      body.gefaess,
        beschreibung: body.beschreibung,
        notizen:      body.notizen,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(toProject(data as Record<string, unknown>));
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const check = await requireTier(req, 1);
    if (!check.ok) return check.response;
    const user = check.user;

    const { id } = await params;

    const { error } = await db
      .from('fermentation')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

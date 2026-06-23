import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';

const db = createAdminClient();

function toProject(row: Record<string, unknown>) {
  return {
    id:          row.id as number,
    name:        (row.name as string) ?? '',
    typ:         (row.typ as string) ?? '',
    startdatum:  (row.startdatum as string) ?? '',
    status:      (row.status as string) ?? 'Aktiv',
    fortschritt: (row.fortschritt as number) ?? 0,
    temperatur:  (row.temperatur as string) ?? '',
    gefaess:     (row.gefaess as string) ?? '',
    notizen:     (row.notizen as unknown[]) ?? [],
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const { data, error } = await db
      .from('fermentation')
      .update({
        name:        body.name,
        typ:         body.typ,
        startdatum:  body.startdatum,
        status:      body.status,
        fortschritt: body.fortschritt,
        temperatur:  body.temperatur,
        gefaess:     body.gefaess,
        notizen:     body.notizen,
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
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

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

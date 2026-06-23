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

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json([]);

    const { data, error } = await db
      .from('fermentation')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json([]);
    return NextResponse.json((data ?? []).map(toProject));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

    const body = await req.json();
    const { data, error } = await db
      .from('fermentation')
      .insert({
        user_id:    user.id,
        name:       body.name ?? '',
        typ:        body.typ ?? '',
        startdatum: body.startdatum ?? new Date().toISOString().slice(0, 10),
        status:     body.status ?? 'Aktiv',
        fortschritt: body.fortschritt ?? 0,
        temperatur: body.temperatur ?? '',
        gefaess:    body.gefaess ?? '',
        notizen:    body.notizen ?? [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(toProject(data as Record<string, unknown>), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

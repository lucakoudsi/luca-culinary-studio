import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';

const db = createAdminClient();

function toProject(row: Record<string, unknown>) {
  return {
    id:          row.id,
    name:        row.name,
    description: row.beschreibung ?? '',
    color:       row.farbe ?? '#C9A84C',
    status:      row.status ?? 'Aktiv',
    recipeIds:   (row.recipe_ids as number[]) ?? [],
    menuIds:     (row.menu_ids  as number[]) ?? [],
    notes:       (row.notizen   as object[]) ?? [],
    createdAt:   row.created_at ?? row.createdAt ?? '',
  };
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json([]);

  const { data, error } = await db
    .from('projekte')
    .select('*')
    .eq('user_id', user.id)
    .order('id');
  if (error) return NextResponse.json([]);
  return NextResponse.json((data ?? []).map(toProject));
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await db
    .from('projekte')
    .insert({
      user_id:      user.id,
      name:         body.name,
      beschreibung: body.description ?? null,
      farbe:        body.color ?? '#C9A84C',
      status:       body.status ?? 'Aktiv',
      recipe_ids:   body.recipeIds ?? [],
      menu_ids:     body.menuIds   ?? [],
      notizen:      body.notes     ?? [],
      created_at:   new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toProject(data), { status: 201 });
}

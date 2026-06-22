import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';

const db = createAdminClient();

function toProject(row: Record<string, unknown>) {
  return {
    id:          row.id,
    name:        row.name,
    description: row.description ?? '',
    color:       row.color ?? '#C9A84C',
    status:      row.status ?? 'Aktiv',
    recipeIds:   (row.recipe_ids as number[]) ?? [],
    menuIds:     (row.menu_ids  as number[]) ?? [],
    notes:       (row.notes     as object[]) ?? [],
    createdAt:   row.created_at ?? row.createdAt ?? '',
  };
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.name        !== undefined) update.name        = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.color       !== undefined) update.color       = body.color;
  if (body.status      !== undefined) update.status      = body.status;
  if (body.recipeIds   !== undefined) update.recipe_ids  = body.recipeIds;
  if (body.menuIds     !== undefined) update.menu_ids    = body.menuIds;
  if (body.notes       !== undefined) update.notes       = body.notes;

  const { data, error } = await db
    .from('projects')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toProject(data));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

  const { error } = await db
    .from('projects')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

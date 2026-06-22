import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.name        !== undefined) update.name        = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.color       !== undefined) update.color       = body.color;
  if (body.status      !== undefined) update.status      = body.status;
  if (body.recipeIds   !== undefined) update.recipe_ids  = body.recipeIds;
  if (body.menuIds     !== undefined) update.menu_ids    = body.menuIds;
  if (body.notes       !== undefined) update.notes       = body.notes;

  const { data, error } = await supabase
    .from('projects')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toProject(data));
}

export async function DELETE(_r: Request, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('projects').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

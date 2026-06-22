import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
const supabase = createAdminClient();

export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name:        body.name,
      description: body.description ?? null,
      color:       body.color ?? '#C9A84C',
      status:      body.status ?? 'Aktiv',
      recipe_ids:  body.recipeIds ?? [],
      menu_ids:    body.menuIds   ?? [],
      notes:       body.notes     ?? [],
      created_at:  new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toProject(data), { status: 201 });
}

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

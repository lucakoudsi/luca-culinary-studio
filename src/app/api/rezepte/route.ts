import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { requireTier } from '@/lib/apiAuth';
import { toRecipe } from '@/lib/recipeMapping';

const db = createAdminClient();

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json([]);

  const { data, error } = await db
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .order('id');

  if (error) return NextResponse.json([]);
  return NextResponse.json((data ?? []).map(toRecipe));
}

export async function POST(req: NextRequest) {
  const check = await requireTier(req, 1);
  if (!check.ok) return check.response;
  const user = check.user;

  const body = await req.json();
  const now = new Date().toISOString().slice(0, 10);

  const { data, error } = await db
    .from('recipes')
    .insert({
      user_id:            user.id,
      name:               body.title,
      kategorie:          body.category,
      beschreibung:       body.description ?? null,
      tags:               body.tags ?? [],
      schwierigkeit:      body.difficulty,
      zubereitungszeit:   body.time ?? 0,
      saison:             body.season ?? null,
      status:             body.status ?? 'Entwurf',
      bewertung:          body.rating ?? 0,
      aufrufe:            0,
      portionen:          body.portionen ?? 4,
      bild:               body.image ?? null,
      zuletzt_bearbeitet: now,
      zutaten:            body.zutaten ?? [],
      komponenten:        body.komponenten ?? [],
      schritte:           body.schritte ?? [],
      getraenke:          body.getraenke ?? null,
      chef_tipps:         body.chefTipps ?? null,
      geschmack:          body.geschmack ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toRecipe(data), { status: 201 });
}

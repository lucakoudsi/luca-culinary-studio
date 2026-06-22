import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import type { Recipe } from '@/types';

const db = createAdminClient();

function toRecipe(row: Record<string, unknown>): Recipe {
  return {
    id:          row.id as number,
    title:       row.name as string,
    category:    row.kategorie as Recipe['category'],
    tags:        (row.tags as string[]) ?? [],
    difficulty:  row.schwierigkeit as Recipe['difficulty'],
    time:        row.zubereitungszeit as number,
    season:      (row.saison as Recipe['season']) ?? 'Ganzjährig',
    status:      row.status as Recipe['status'],
    rating:      row.bewertung as number,
    image:       (row.bild as string) ?? null,
    description: (row.beschreibung as string) ?? '',
    lastEdited:  (row.zuletzt_bearbeitet as string) ?? '',
    views:       row.aufrufe as number,
    zutaten:     (row.zutaten as Recipe['zutaten']) ?? [],
    komponenten: (row.komponenten as Recipe['komponenten']) ?? [],
    schritte:    (row.schritte as string[]) ?? [],
    getraenke:   (row.getraenke as string) ?? '',
    chefTipps:   (row.chef_tipps as string) ?? '',
  };
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

  const { data, error } = await db
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .order('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(toRecipe));
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

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
      bild:               body.image ?? null,
      zuletzt_bearbeitet: now,
      zutaten:            body.zutaten ?? [],
      komponenten:        body.komponenten ?? [],
      schritte:           body.schritte ?? [],
      getraenke:          body.getraenke ?? null,
      chef_tipps:         body.chefTipps ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toRecipe(data), { status: 201 });
}

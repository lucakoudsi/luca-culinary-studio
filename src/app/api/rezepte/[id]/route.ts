import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { requireTier } from '@/lib/apiAuth';
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
    portionen:   (row.portionen as number) ?? 4,
    zutaten:     (row.zutaten as Recipe['zutaten']) ?? [],
    komponenten: (row.komponenten as Recipe['komponenten']) ?? [],
    schritte:    (row.schritte as string[]) ?? [],
    getraenke:   (row.getraenke as string) ?? '',
    chefTipps:   (row.chef_tipps as string) ?? '',
    geschmack:   (row.geschmack as Recipe['geschmack']) ?? null,
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

  const { data, error } = await db
    .from('recipes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(toRecipe(data));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireTier(req, 1);
  if (!check.ok) return check.response;
  const user = check.user;

  const body = await req.json();
  const update: Record<string, unknown> = {
    zuletzt_bearbeitet: new Date().toISOString().slice(0, 10),
  };

  if (body.title       !== undefined) update.name             = body.title;
  if (body.category    !== undefined) update.kategorie        = body.category;
  if (body.description !== undefined) update.beschreibung     = body.description;
  if (body.tags        !== undefined) update.tags             = body.tags;
  if (body.difficulty  !== undefined) update.schwierigkeit    = body.difficulty;
  if (body.time        !== undefined) update.zubereitungszeit = body.time;
  if (body.season      !== undefined) update.saison           = body.season;
  if (body.status      !== undefined) update.status           = body.status;
  if (body.rating      !== undefined) update.bewertung        = body.rating;
  if (body.image       !== undefined) update.bild             = body.image;
  if (body.views       !== undefined) update.aufrufe          = body.views;
  if (body.portionen   !== undefined) update.portionen        = body.portionen;
  if (body.zutaten     !== undefined) update.zutaten          = body.zutaten;
  if (body.komponenten !== undefined) update.komponenten      = body.komponenten;
  if (body.schritte    !== undefined) update.schritte         = body.schritte;
  if (body.getraenke   !== undefined) update.getraenke        = body.getraenke;
  if (body.chefTipps   !== undefined) update.chef_tipps       = body.chefTipps;
  if (body.geschmack   !== undefined) update.geschmack        = body.geschmack;

  const { data, error } = await db
    .from('recipes')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toRecipe(data));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireTier(req, 1);
  if (!check.ok) return check.response;
  const user = check.user;

  const { error } = await db
    .from('recipes')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

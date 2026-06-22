import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
const supabase = createAdminClient();
import type { Recipe } from '@/types';

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

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(toRecipe(data));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
  if (body.zutaten     !== undefined) update.zutaten          = body.zutaten;
  if (body.komponenten !== undefined) update.komponenten      = body.komponenten;
  if (body.schritte    !== undefined) update.schritte         = body.schritte;
  if (body.getraenke   !== undefined) update.getraenke        = body.getraenke;
  if (body.chefTipps   !== undefined) update.chef_tipps       = body.chefTipps;

  const { data, error } = await supabase
    .from('recipes')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toRecipe(data));
}

export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

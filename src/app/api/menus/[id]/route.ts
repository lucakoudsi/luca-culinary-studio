import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { createAdminClient } from '@/lib/supabase-admin';
import type { SavedMenuRow, GeneratedMenuResult } from '@/types';

export const dynamic = 'force-dynamic';

const MIN_TIER = 2; // Basic -- gleiche Sperre wie der Menuegenerator selbst
const MAX_NAME_LENGTH = 200;

function toSavedMenuRow(row: Record<string, unknown>): SavedMenuRow {
  return {
    id: row.id as string,
    name: row.name as string,
    menu: row.menu as GeneratedMenuResult,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Einzelnes gespeichertes Menü laden -- fuer den Deep-Link aus der Galerie
// (/menuegenerator?laden=<id>).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  const db = createAdminClient();
  const { data, error } = await db
    .from('menus')
    .select('id, name, menu, created_at, updated_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: 'Menü nicht gefunden.' }, { status: 404 });
  return NextResponse.json(toSavedMenuRow(data));
}

// Umbenennen UND/ODER den Menü-Inhalt aktualisieren (z.B. nach "Gang
// gezielt anpassen", siehe /api/menus/[id]/gang-anpassen) -- feldweise, wie
// bei allen anderen PUT-Routen im Projekt: nur was im Body mitgeschickt
// wird, landet im Update. { menu }-only darf "name" nicht anfassen und
// umgekehrt, ein reines Umbenennen darf den Menü-Inhalt nicht anruehren.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  let body: { name?: string; menu?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim().slice(0, MAX_NAME_LENGTH);
    if (!name) {
      return NextResponse.json({ error: 'Kein Name angegeben.' }, { status: 400 });
    }
    update.name = name;
  }

  if (body.menu !== undefined) {
    // Minimale Form-Validierung -- kein beliebiges jsonb blind schlucken.
    const menu = body.menu as { gaenge?: unknown } | null;
    if (!menu || typeof menu !== 'object' || !Array.isArray(menu.gaenge)) {
      return NextResponse.json({ error: 'Ungültiges Menü.' }, { status: 400 });
    }
    update.menu = body.menu;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nichts zu aktualisieren.' }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const db = createAdminClient();
  const { data, error } = await db
    .from('menus')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id, name, menu, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: 'Menü konnte nicht aktualisiert werden.' }, { status: 500 });
  return NextResponse.json(toSavedMenuRow(data));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  const db = createAdminClient();
  const { error } = await db
    .from('menus')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Menü konnte nicht gelöscht werden.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

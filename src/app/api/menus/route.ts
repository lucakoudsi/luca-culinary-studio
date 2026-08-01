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

// Reine Verwaltung (Speichern/Laden/Umbenennen/Loeschen) -- kein OpenAI-Call,
// kein Kontingent-Verbrauch. Nur das Generieren selbst (POST /api/menuegenerator)
// kostet Kontingent.
export async function GET(req: NextRequest) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  const db = createAdminClient();
  const { data, error } = await db
    .from('menus')
    .select('id, name, menu, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[menus] Laden fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Menüs konnten nicht geladen werden.' }, { status: 500 });
  }

  return NextResponse.json({ menus: (data ?? []).map(toSavedMenuRow) });
}

export async function POST(req: NextRequest) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  let body: { name?: string; menu?: GeneratedMenuResult };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const name = (body.name ?? '').trim().slice(0, MAX_NAME_LENGTH);
  if (!name) {
    return NextResponse.json({ error: 'Kein Name angegeben.' }, { status: 400 });
  }
  if (!body.menu || typeof body.menu !== 'object' || !Array.isArray(body.menu.gaenge)) {
    return NextResponse.json({ error: 'Ungültiges Menü.' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from('menus')
    .insert({ user_id: user.id, name, menu: body.menu })
    .select('id, name, menu, created_at, updated_at')
    .single();

  if (error) {
    console.error('[menus] Speichern fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Menü konnte nicht gespeichert werden.' }, { status: 500 });
  }

  return NextResponse.json(toSavedMenuRow(data), { status: 201 });
}

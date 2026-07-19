import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { createAdminClient } from '@/lib/supabase-admin';
import { STILRICHTUNG_LABEL, type Stilrichtung } from '@/config/tellerStilrichtung';
import { ANRICHTE_FOKUS_LABEL, type AnrichteFokus } from '@/config/tellerAnrichteFokus';
import type { Aufwandsstufe } from '@/config/techniken';
import type { TellerDesignRow, TellerTechnik } from '@/types';

export const dynamic = 'force-dynamic';

const MIN_TIER = 3; // Pro -- gleiche Sperre wie der Rest des Tellerdesigners

const AUFWAND_LABEL: Record<Aufwandsstufe, string> = {
  bistro: 'Einfach', gehoben: 'Mittel', fine_dining: 'Profi',
};

type Row = {
  id: string;
  created_at: string;
  bild_url: string;
  titel: string;
  rezept_id: number | null;
  modus: 'rezept' | 'frei';
  stilrichtung: Stilrichtung;
  aufwand: Aufwandsstufe;
  anrichte_fokus: AnrichteFokus;
  zubereitungszeit: number | null;
  saison: string | null;
  techniken: TellerTechnik[] | null;
};

// Nur reine Leseabfrage fuer die "Meine Designs"-Galerie -- INSERT passiert
// in POST /api/tellerdesigner/save, unmittelbar nach dem Storage-Upload.
export async function GET(req: NextRequest) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  const db = createAdminClient();
  const { data, error } = await db
    .from('tellerdesigns')
    .select('id, created_at, bild_url, titel, rezept_id, modus, stilrichtung, aufwand, anrichte_fokus, zubereitungszeit, saison, techniken')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[tellerdesigner/designs] Laden fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Designs konnten nicht geladen werden.' }, { status: 500 });
  }

  // Rohwerte (stilrichtung/aufwand/anrichte_fokus) werden hier auf die
  // Anzeige-Labels gemappt -- die Galerie soll direkt konsumierbare,
  // fertige Snapshot-Zeilen bekommen, keine Enum-Codes, die jede
  // Konsumentin selbst nachschlagen muesste (siehe TellerDesignRow-Kommentar
  // in src/types/index.ts).
  const designs: TellerDesignRow[] = (data as Row[] ?? []).map(row => ({
    id: row.id,
    createdAt: row.created_at,
    bildUrl: row.bild_url,
    rezeptId: row.rezept_id,
    titel: row.titel,
    stil: STILRICHTUNG_LABEL[row.stilrichtung] ?? row.stilrichtung,
    schwierigkeit: AUFWAND_LABEL[row.aufwand] ?? row.aufwand,
    zubereitungszeit: row.zubereitungszeit,
    saison: row.saison,
    anrichteFokus: ANRICHTE_FOKUS_LABEL[row.anrichte_fokus] ?? row.anrichte_fokus,
    techniken: Array.isArray(row.techniken) ? row.techniken : [],
    modus: row.modus,
  }));

  return NextResponse.json({ designs });
}

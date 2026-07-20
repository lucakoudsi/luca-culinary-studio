import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { getMonthlyTextLimit, getTextQuotaStatus } from '@/lib/text-quota';
import { getMonthlyImageLimit, getImageQuotaStatus } from '@/lib/image-quota';

export const dynamic = 'force-dynamic';

// Reiner Lese-Status fuer den "Mein Plan"-Tab auf /profil -- kein
// Mindest-Tier ausser "eingeloggt": Free bekommt einfach limit=0 zurueck
// (getMonthlyTextLimit/getMonthlyImageLimit liefern 0 fuer Stufen ohne
// Zugriff), das reicht der Anzeige "keine KI-Funktionen in deiner Stufe".
export async function GET(req: NextRequest) {
  const check = await requireTier(req, 1);
  if (!check.ok) return check.response;
  const { user, tier } = check;

  const textLimit = getMonthlyTextLimit(tier);
  const imageLimit = getMonthlyImageLimit(tier);
  const [text, image] = await Promise.all([
    getTextQuotaStatus(user.id, textLimit),
    getImageQuotaStatus(user.id, imageLimit),
  ]);

  return NextResponse.json({ tier, text, image });
}

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { requireTier } from '@/lib/apiAuth';
import { createAdminClient } from '@/lib/supabase-admin';
import { safeFetch, SafeFetchError } from '@/lib/safeFetch';
import { extractRecipeJsonLd, mapSchemaOrgRecipe } from '@/lib/schemaOrgRecipe';

const NOT_FOUND_MSG = 'Konnte kein Rezept auf dieser Seite finden — versuch das Einfügen der Zutaten als Text.';

export async function POST(req: NextRequest) {
  const check = await requireTier(req, 1);
  if (!check.ok) return check.response;

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Keine URL angegeben.' }, { status: 400 });
  }

  let html: string;
  try {
    const { buffer } = await safeFetch(url, { maxBytes: 3 * 1024 * 1024, timeoutMs: 10_000 });
    html = buffer.toString('utf-8');
  } catch (e) {
    const message = e instanceof SafeFetchError ? e.message : 'Seite konnte nicht geladen werden.';
    console.error('[import-url] HTML fetch failed:', e);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const raw = extractRecipeJsonLd(html);
  if (!raw) {
    return NextResponse.json({ found: false, error: NOT_FOUND_MSG });
  }

  const mapped = mapSchemaOrgRecipe(raw);

  let image: string | null = null;
  if (mapped.imageUrl) {
    try {
      const { buffer, contentType } = await safeFetch(mapped.imageUrl, { maxBytes: 8 * 1024 * 1024, timeoutMs: 15_000 });
      if (contentType.startsWith('image/')) {
        const resized = await sharp(buffer)
          .resize({ width: 1600, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        const db = createAdminClient();
        const path = `${randomUUID()}.jpg`;
        const { error: uploadError } = await db.storage.from('rezept-bilder').upload(path, resized, {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
          upsert: false,
        });
        if (uploadError) {
          console.error('[import-url] image upload failed (non-fatal):', uploadError.message);
        } else {
          const { data } = db.storage.from('rezept-bilder').getPublicUrl(path);
          image = data.publicUrl;
        }
      }
    } catch (e) {
      console.error('[import-url] image fetch/processing failed (non-fatal):', e);
    }
  }

  return NextResponse.json({
    found: true,
    recipe: {
      title: mapped.title,
      description: mapped.description,
      zutaten: mapped.zutaten,
      schritte: mapped.schritte,
      time: mapped.time,
      portionen: mapped.portionen,
      category: mapped.category,
      image,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { encryptKey } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

const db = createAdminClient();

type Provider = 'openai' | 'anthropic';

function maskKey(key: string): string {
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
}

// Echter Test-Call gegen den Anbieter -- nie den Key selbst loggen, nur ok/nicht-ok.
async function testProviderKey(provider: Provider, apiKey: string): Promise<boolean> {
  try {
    const res = provider === 'anthropic'
      ? await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        })
      : await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
    return res.ok;
  } catch (e) {
    console.error('[ki/key] Test-Call an Anbieter fehlgeschlagen:', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });

  let body: { provider?: unknown; apiKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  if (body.provider !== 'openai' && body.provider !== 'anthropic') {
    return NextResponse.json({ error: 'Ungültiger Provider (erwartet: openai oder anthropic).' }, { status: 400 });
  }
  const provider: Provider = body.provider;

  if (typeof body.apiKey !== 'string' || !body.apiKey) {
    return NextResponse.json({ error: 'Kein Key angegeben.' }, { status: 400 });
  }
  const apiKey = body.apiKey;

  const validFormat = provider === 'anthropic' ? apiKey.startsWith('sk-ant-') : apiKey.startsWith('sk-');
  if (!validFormat) {
    return NextResponse.json({ error: 'Ungültiges Key-Format.' }, { status: 400 });
  }

  const valid = await testProviderKey(provider, apiKey);
  if (!valid) {
    return NextResponse.json({ error: 'Key wurde vom Anbieter abgelehnt.' }, { status: 400 });
  }

  const key_hint = maskKey(apiKey);
  const { error } = await db.from('user_api_keys').upsert({
    user_id: user.id,
    provider,
    key_cipher: encryptKey(apiKey),
    key_hint,
    is_valid: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('[ki/key POST] Upsert fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 });
  }

  return NextResponse.json({ key_hint, is_valid: true });
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });

  const { data, error } = await db
    .from('user_api_keys')
    .select('provider, key_hint, is_valid')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[ki/key GET] Abfrage fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Abfrage fehlgeschlagen.' }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });

  const { error } = await db.from('user_api_keys').delete().eq('user_id', user.id);
  if (error) {
    console.error('[ki/key DELETE] Löschen fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

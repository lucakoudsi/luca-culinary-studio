import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createAdminClient();

    // Get or create profile
    let { data: profile } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const { data: created } = await db
        .from('profiles')
        .insert({ id: user.id, full_name: user.user_metadata?.full_name ?? null })
        .select()
        .single();
      profile = created;
    }

    // Stats — resilient: 0 if table doesn't exist or query fails
    const [r, p, f] = await Promise.allSettled([
      db.from('rezepte').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      db.from('projekte').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      db.from('fermentation').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    return NextResponse.json({
      profile,
      stats: {
        rezepte:  r.status === 'fulfilled' ? (r.value.count ?? 0) : 0,
        projekte: p.status === 'fulfilled' ? (p.value.count ?? 0) : 0,
        fermente: f.status === 'fulfilled' ? (f.value.count ?? 0) : 0,
      },
      userCreatedAt: user.created_at,
    });
  } catch (e) {
    console.error('[profil GET]', e);
    return NextResponse.json({ profile: null, stats: { rezepte: 0, projekte: 0, fermente: 0 }, userCreatedAt: null });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = createAdminClient();

    const allowed = ['full_name', 'kuechenstil', 'spezialitaeten', 'bio', 'lieblingszutaten', 'inspirationen'];
    const update: Record<string, unknown> = { id: user.id, updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const { data, error } = await db
      .from('profiles')
      .upsert(update)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch (e) {
    console.error('[profil PATCH]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

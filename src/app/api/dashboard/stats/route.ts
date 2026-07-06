import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [rezepteRes, projekteRes, fermenteRes, wocheRes, projekteDisplay, ideenRes, profilRes] =
      await Promise.allSettled([
        db.from('recipes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        db.from('projekte').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        db.from('fermentation').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        db.from('recipes').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('created_at', sevenDaysAgo),
        // Last 3 projects for dashboard display
        db.from('projekte').select('id, name, description:beschreibung, color:farbe, status, recipe_ids, menus, created_at')
          .eq('user_id', user.id).order('id', { ascending: false }).limit(3),
        // Last 3 ideas
        db.from('ideen').select('id, text, tag, date').order('id', { ascending: false }).limit(3),
        // Profile for Mein Stil
        db.from('profiles').select('kuechenstil, spezialitaeten, lieblingszutaten').eq('id', user.id).maybeSingle(),
      ]);

    const rezepte    = rezepteRes.status === 'fulfilled' ? (rezepteRes.value.count ?? 0) : 0;
    const projekte   = projekteRes.status === 'fulfilled' ? (projekteRes.value.count ?? 0) : 0;
    const fermente   = fermenteRes.status === 'fulfilled' ? (fermenteRes.value.count ?? 0) : 0;
    const dieseWoche = wocheRes.status === 'fulfilled' ? (wocheRes.value.count ?? 0) : 0;
    const projects   = projekteDisplay.status === 'fulfilled' ? (projekteDisplay.value.data ?? []) : [];
    const ideas      = ideenRes.status === 'fulfilled' ? (ideenRes.value.data ?? []) : [];
    const profile    = profilRes.status === 'fulfilled' ? profilRes.value.data : null;

    return NextResponse.json({
      stats: { rezepte, projekte, fermente, dieseWoche },
      projects,
      ideas,
      meinStil: {
        kuechenstil:     profile?.kuechenstil ?? '',
        spezialitaeten:  profile?.spezialitaeten ?? '',
        lieblingszutaten: profile?.lieblingszutaten ?? '',
      },
    });
  } catch (e) {
    console.error('[dashboard/stats]', e);
    return NextResponse.json({
      stats: { rezepte: 0, projekte: 0, fermente: 0, dieseWoche: 0 },
      projects: [],
      ideas: [],
      meinStil: { kuechenstil: '', spezialitaeten: '', lieblingszutaten: '' },
    });
  }
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle, XCircle, Clock, Loader2, ShieldOff, Wine } from 'lucide-react';
import { ADMIN_EMAIL } from '@/config/roles';

type Request = {
  id: string;
  name: string;
  email: string;
  grund: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests]   = useState<Request[]>([]);
  const [loading, setLoading]     = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [acting, setActing]       = useState<string | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.email !== ADMIN_EMAIL) {
        setAuthorized(false);
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      setAuthorized(true);
      const { data } = await supabase
        .from('access_requests')
        .select('id, name, email, grund, status, created_at')
        .order('created_at', { ascending: false });
      setRequests(data ?? []);
      setLoading(false);
    })();
  }, [router]);

  if (authorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--bg)' }}>
        <ShieldOff size={40} color="#f87171" />
        <p className="text-[#f87171] font-semibold text-[15px]">Kein Zugriff</p>
        <p style={{ color: 'rgba(var(--text-muted-rgb), 0.5)', fontSize: 13 }}>Weiterleitung zum Dashboard…</p>
      </div>
    );
  }

  const reloadRequests = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('access_requests')
      .select('id, name, email, grund, status, created_at')
      .order('created_at', { ascending: false });
    setRequests(data ?? []);
  };

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActing(id + action);
    setError('');
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      // Liste immer vom Server neu laden, damit sie garantiert dem echten DB-Stand entspricht
      await reloadRequests();
    } else {
      const { error: e } = await res.json();
      setError(e || 'Fehler');
      if (res.status === 409) await reloadRequests();
    }
    setActing(null);
  };

  const statusBadge = (s: Request['status']) => {
    const map = {
      pending:  { label: 'Ausstehend', icon: <Clock size={12}/>,       color: '#C9A84C',  bg: 'rgba(201,168,76,0.12)'  },
      approved: { label: 'Genehmigt',  icon: <CheckCircle size={12}/>, color: '#4ade80',  bg: 'rgba(74,222,128,0.12)'  },
      rejected: { label: 'Abgelehnt',  icon: <XCircle size={12}/>,     color: '#f87171',  bg: 'rgba(248,113,113,0.12)' },
    };
    const m = map[s];
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium"
        style={{ color: m.color, background: m.bg, border: `1px solid ${m.color}33` }}>
        {m.icon} {m.label}
      </span>
    );
  };

  const pending  = requests.filter(r => r.status === 'pending');
  const others   = requests.filter(r => r.status !== 'pending');

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <Loader2 className="animate-spin text-[#C9A84C]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">

        <div className="mb-8">
          <h1 className="font-heading text-[28px] font-bold text-text-primary">Admin</h1>
          <p style={{ color: 'rgba(var(--text-muted-rgb), 0.7)', fontSize: 13, marginTop: 4 }}>
            Registrierungsanfragen verwalten
          </p>
        </div>

        {/* Admin-Schnelllinks */}
        <div className="flex gap-3 mb-8">
          <Link href="/admin/weine"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}>
            <Wine size={14} /> Wein-Datenbank
          </Link>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-[13px]"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[13px] font-semibold mb-3" style={{ color: '#C9A84C', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Ausstehend ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map(r => (
                <div key={r.id} className="rounded-2xl p-5 bg-card border border-border">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary text-[15px]">{r.name}</span>
                        {statusBadge(r.status)}
                      </div>
                      <p style={{ color: 'rgba(var(--text-muted-rgb), 0.8)', fontSize: 13 }}>{r.email}</p>
                      <p className="mt-2 text-[13px]" style={{ color: 'rgba(var(--text-rgb), 0.6)', lineHeight: 1.6 }}>
                        <span style={{ color: 'rgba(var(--text-muted-rgb), 0.6)', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase' }}>Grund: </span>
                        {r.grund}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: 'rgba(var(--text-muted-rgb), 0.4)' }}>
                        {new Date(r.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => act(r.id, 'approve')}
                        disabled={!!acting}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50"
                        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                        {acting === r.id + 'approve' ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle size={13}/>}
                        Genehmigen
                      </button>
                      <button
                        onClick={() => act(r.id, 'reject')}
                        disabled={!!acting}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50"
                        style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                        {acting === r.id + 'reject' ? <Loader2 size={13} className="animate-spin"/> : <XCircle size={13}/>}
                        Ablehnen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pending.length === 0 && (
          <div className="text-center py-16" style={{ color: 'rgba(var(--text-muted-rgb), 0.4)', fontSize: 14 }}>
            Keine ausstehenden Anfragen.
          </div>
        )}

        {/* History */}
        {others.length > 0 && (
          <section>
            <h2 className="text-[13px] font-semibold mb-3" style={{ color: 'rgba(var(--text-muted-rgb), 0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Verlauf
            </h2>
            <div className="space-y-2">
              {others.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-card-hover border border-border">
                  <div>
                    <span className="text-[13px] font-medium text-text-primary">{r.name}</span>
                    <span className="text-[12px] ml-2" style={{ color: 'rgba(var(--text-muted-rgb), 0.5)' }}>{r.email}</span>
                  </div>
                  {statusBadge(r.status)}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

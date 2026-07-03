'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ADMIN_EMAIL } from '@/config/roles';
import { Plus, Pencil, Trash2, X, Save, Loader2, ShieldOff, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Wein, WeinProfil } from '@/lib/weinPairing';

// ─── Statics ─────────────────────────────────────────────────────────────────

const TYPEN: Wein['typ'][] = ['weiss', 'rot', 'rose', 'schaumwein', 'suesswein'];

const TYP_LABELS: Record<Wein['typ'], string> = {
  weiss:      'Weißwein',
  rot:        'Rotwein',
  rose:       'Rosé',
  schaumwein: 'Schaumwein',
  suesswein:  'Süßwein',
};

const TYP_COLOR: Record<Wein['typ'], string> = {
  weiss:      '#9B6E1A',
  rot:        '#C04040',
  rose:       '#C06080',
  schaumwein: '#3A80A8',
  suesswein:  '#8B4A9B',
};

interface Achse { key: keyof WeinProfil; label: string }
const ACHSEN: Achse[] = [
  { key: 'acidity',    label: 'Säure'        },
  { key: 'sweetness',  label: 'Süße'         },
  { key: 'tannin',     label: 'Tannin'       },
  { key: 'body',       label: 'Körper'       },
  { key: 'fruitiness', label: 'Fruchtigkeit' },
];

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  name: string; typ: Wein['typ']; rebsorte: string;
  region: string; land: string; beschreibung: string;
  profil: WeinProfil;
};

const EMPTY: FormState = {
  name: '', typ: 'weiss', rebsorte: '', region: '', land: '', beschreibung: '',
  profil: { acidity: 3, sweetness: 0, tannin: 2, body: 3, fruitiness: 3 },
};

function formFromWein(w: Wein): FormState {
  return {
    name: w.name, typ: w.typ, rebsorte: w.rebsorte,
    region: w.region, land: w.land, beschreibung: w.beschreibung ?? '',
    profil: { ...w.profil },
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AchsenEditor({
  profil,
  onChange,
}: {
  profil: WeinProfil;
  onChange: (p: WeinProfil) => void;
}) {
  return (
    <div className="space-y-3">
      {ACHSEN.map(({ key, label }) => (
        <div key={key}>
          <div className="flex justify-between mb-1">
            <span className="text-[12px]" style={{ color: 'rgba(168,152,128,0.8)' }}>{label}</span>
            <span className="text-[12px] font-semibold" style={{ color: '#C9A84C' }}>{profil[key]}</span>
          </div>
          <input
            type="range" min={0} max={5} step={1}
            value={profil[key]}
            onChange={e => onChange({ ...profil, [key]: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#C9A84C', background: `linear-gradient(to right, #C9A84C ${profil[key] / 5 * 100}%, rgba(255,255,255,0.1) 0)` }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px]" style={{ color: 'rgba(168,152,128,0.3)' }}>0</span>
            <span className="text-[10px]" style={{ color: 'rgba(168,152,128,0.3)' }}>5</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileBar({ profil }: { profil: WeinProfil }) {
  return (
    <div className="flex gap-0.5 items-end h-4">
      {ACHSEN.map(({ key }) => (
        <div
          key={key}
          title={`${key}: ${profil[key]}`}
          style={{
            width: 6, height: `${Math.max(2, profil[key] / 5 * 16)}px`,
            background: 'rgba(201,168,76,0.5)', borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminWeinePage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [weine,      setWeine]      = useState<Wein[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<Wein['typ'] | 'alle'>('alle');

  // Form / modal state
  const [formOpen,   setFormOpen]   = useState(false);
  const [editId,     setEditId]     = useState<number | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  // Delete confirmation
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  // ── Auth check ────────────────────────────────────────────────────────────
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
    })();
  }, [router]);

  // ── Fetch wines ────────────────────────────────────────────────────────────
  const loadWeine = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/weine');
    if (res.ok) setWeine(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authorized) loadWeine();
  }, [authorized, loadWeine]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const openNew = () => {
    setEditId(null);
    setForm(EMPTY);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (w: Wein) => {
    setEditId(w.id);
    setForm(formFromWein(w));
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.rebsorte.trim() || !form.region.trim() || !form.land.trim()) {
      setFormError('Name, Rebsorte, Region und Land sind Pflichtfelder.');
      return;
    }
    setSaving(true);
    setFormError('');
    const body = { ...form, beschreibung: form.beschreibung || null };

    try {
      const res = editId
        ? await fetch(`/api/weine/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/weine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

      if (!res.ok) {
        const j = await res.json();
        setFormError(j.error ?? 'Fehler beim Speichern.');
        return;
      }
      await loadWeine();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    const res = await fetch(`/api/weine/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setWeine(prev => prev.filter(w => w.id !== id));
      setDeleteId(null);
    }
    setDeleting(false);
  };

  // ── Guard states ───────────────────────────────────────────────────────────
  if (authorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: '#0A0A0A' }}>
        <ShieldOff size={40} color="#f87171" />
        <p className="text-[#f87171] font-semibold text-[15px]">Kein Zugriff</p>
        <p style={{ color: 'rgba(168,152,128,0.5)', fontSize: 13 }}>Weiterleitung zum Dashboard…</p>
      </div>
    );
  }

  if (authorized === null || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0A0A0A' }}>
        <Loader2 className="animate-spin text-[#C9A84C]" size={32} />
      </div>
    );
  }

  const displayed = filter === 'alle' ? weine : weine.filter(w => w.typ === filter);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 mb-4 text-[12px] transition-opacity opacity-60 hover:opacity-100"
              style={{ color: '#C9A84C' }}>
              <ChevronLeft size={14} /> Admin
            </Link>
            <h1 className="font-heading text-[28px] font-bold text-[#F5F0E8]">Wein-Datenbank</h1>
            <p style={{ color: 'rgba(168,152,128,0.7)', fontSize: 13, marginTop: 4 }}>
              {weine.length} Weine · CRUD-Verwaltung
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            <Plus size={15} /> Neuer Wein
          </button>
        </div>

        {/* Typ-Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['alle', ...TYPEN] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={filter === t
                ? { background: t === 'alle' ? 'rgba(201,168,76,0.2)' : `${TYP_COLOR[t as Wein['typ']]}22`, color: t === 'alle' ? '#C9A84C' : TYP_COLOR[t as Wein['typ']], border: `1px solid ${t === 'alle' ? 'rgba(201,168,76,0.4)' : TYP_COLOR[t as Wein['typ']] + '44'}` }
                : { background: 'transparent', color: 'rgba(168,152,128,0.5)', border: '1px solid rgba(255,255,255,0.07)' }
              }>
              {t === 'alle' ? `Alle (${weine.length})` : `${TYP_LABELS[t]} (${weine.filter(w => w.typ === t).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Name & Rebsorte', 'Typ', 'Region', 'Profil', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(168,152,128,0.5)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((w, i) => (
                <tr key={w.id}
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {/* Name */}
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-[#F5F0E8]">{w.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(168,152,128,0.6)' }}>{w.rebsorte}</p>
                  </td>
                  {/* Typ */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: `${TYP_COLOR[w.typ]}18`, color: TYP_COLOR[w.typ], border: `1px solid ${TYP_COLOR[w.typ]}33` }}>
                      {TYP_LABELS[w.typ]}
                    </span>
                  </td>
                  {/* Region */}
                  <td className="px-4 py-3">
                    <p className="text-[12px] text-[#F5F0E8]">{w.region}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(168,152,128,0.5)' }}>{w.land}</p>
                  </td>
                  {/* Profil */}
                  <td className="px-4 py-3">
                    <ProfileBar profil={w.profil} />
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(168,152,128,0.35)' }}>
                      S{w.profil.acidity} Sw{w.profil.sweetness} T{w.profil.tannin} B{w.profil.body} F{w.profil.fruitiness}
                    </p>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(w)}
                        className="p-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(w.id)}
                        className="p-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayed.length === 0 && (
            <div className="text-center py-16 text-[13px]" style={{ color: 'rgba(168,152,128,0.4)' }}>
              {weine.length === 0
                ? 'Noch keine Weine — erst Seed ausführen.'
                : 'Keine Weine für diesen Filter.'}
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Modal ───────────────────────────────────────────────────── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-[18px] font-bold text-[#F5F0E8]">
                {editId ? 'Wein bearbeiten' : 'Neuer Wein'}
              </h2>
              <button onClick={closeForm} style={{ color: 'rgba(168,152,128,0.5)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Basis-Felder */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest"
                  style={{ color: 'rgba(168,152,128,0.6)' }}>Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Riesling trocken Mosel"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] text-[#F5F0E8] outline-none focus:ring-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', ringColor: '#C9A84C' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest"
                  style={{ color: 'rgba(168,152,128,0.6)' }}>Typ *</label>
                <select
                  value={form.typ}
                  onChange={e => setForm(f => ({ ...f, typ: e.target.value as Wein['typ'] }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] text-[#F5F0E8] outline-none"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {TYPEN.map(t => (
                    <option key={t} value={t}>{TYP_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest"
                  style={{ color: 'rgba(168,152,128,0.6)' }}>Rebsorte *</label>
                <input
                  value={form.rebsorte}
                  onChange={e => setForm(f => ({ ...f, rebsorte: e.target.value }))}
                  placeholder="z.B. Riesling"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] text-[#F5F0E8] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest"
                  style={{ color: 'rgba(168,152,128,0.6)' }}>Region *</label>
                <input
                  value={form.region}
                  onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  placeholder="z.B. Mosel"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] text-[#F5F0E8] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest"
                  style={{ color: 'rgba(168,152,128,0.6)' }}>Land *</label>
                <input
                  value={form.land}
                  onChange={e => setForm(f => ({ ...f, land: e.target.value }))}
                  placeholder="z.B. Deutschland"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] text-[#F5F0E8] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-widest"
                  style={{ color: 'rgba(168,152,128,0.6)' }}>Beschreibung</label>
                <textarea
                  value={form.beschreibung}
                  onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                  placeholder="Optionale Beschreibung…"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] text-[#F5F0E8] outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            {/* Profil-Achsen */}
            <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(168,152,128,0.6)' }}>
                Weinprofil (Achsen 0 – 5)
              </p>
              <AchsenEditor profil={form.profil} onChange={p => setForm(f => ({ ...f, profil: p }))} />
            </div>

            {formError && (
              <p className="mb-4 text-[12px] px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {formError}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={closeForm}
                className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:opacity-80"
                style={{ color: 'rgba(168,152,128,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}>
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.35)' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {editId ? 'Speichern' : 'Anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#111', border: '1px solid rgba(248,113,113,0.2)' }}>
            <h3 className="font-heading text-[16px] font-bold text-[#F5F0E8] mb-2">Wein löschen?</h3>
            <p className="text-[13px] mb-6" style={{ color: 'rgba(168,152,128,0.7)' }}>
              {weine.find(w => w.id === deleteId)?.name} — diese Aktion ist nicht rückgängig zu machen.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium"
                style={{ color: 'rgba(168,152,128,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}>
                Abbrechen
              </button>
              <button onClick={() => handleDelete(deleteId!)} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold disabled:opacity-50"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

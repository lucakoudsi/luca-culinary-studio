'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle, MessageSquare } from 'lucide-react';

const FOOD_IMG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200';

function OrnamentLine({ flip }: { flip?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px bg-[#C9A84C]/25" style={{ width: 32 }} />
      <span style={{ color: 'rgba(201,168,76,0.45)', fontSize: 10 }}>✦</span>
      <div className="h-px bg-[#C9A84C]/35" style={{ width: 14 }} />
      <span style={{ color: '#C9A84C', fontSize: 13 }}>{flip ? '❧' : '❦'}</span>
      <div className="h-px bg-[#C9A84C]/35" style={{ width: 14 }} />
      <span style={{ color: 'rgba(201,168,76,0.45)', fontSize: 10 }}>✦</span>
      <div className="h-px bg-[#C9A84C]/25" style={{ width: 32 }} />
    </div>
  );
}

function LogoBlock() {
  return (
    <div className="flex flex-col items-center select-none">
      <OrnamentLine />

      <img
        src="/chef-logo-gold.png"
        alt="Culinary Studio"
        width={70}
        height={70}
        style={{
          width: 70,
          height: 70,
          objectFit: 'contain',
          marginTop: 10,
          marginBottom: 10,
          filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.3))',
        }}
      />

      <OrnamentLine flip />

      <p style={{ fontSize: 13, color: '#C9A84C', letterSpacing: '5px', textTransform: 'uppercase', marginTop: 12, fontWeight: 500 }}>
        CULINARY STUDIO
      </p>
      <div style={{ width: 130, height: 0.5, background: 'rgba(201,168,76,0.3)', marginTop: 10 }} />
    </div>
  );
}

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [grund, setGrund]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return; }
    if (password.length < 6)  { setError('Passwort muss mindestens 6 Zeichen lang sein.'); return; }
    if (grund.trim().length < 10) { setError('Bitte erkläre kurz warum du Zugang möchtest.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/register-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, grund }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Fehler beim Senden.'); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  const fieldStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };
  const fieldCls   = "w-full pl-10 pr-4 py-3 rounded-xl text-[14px] text-[#F5F0E8] outline-none transition-all placeholder:text-[#3A3530]";

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(201,168,76,0.07), inset 0 0 0 1px rgba(201,168,76,0.1)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>

      {/* ── Left: Food Image ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        <img src={FOOD_IMG} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.55) saturate(0.75)' }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)',
        }} />
        <div className="absolute inset-y-0 right-0 w-32" style={{
          background: 'linear-gradient(90deg, transparent, #0A0A0A)',
        }} />

        <div className="relative z-10 p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <span style={{ color: '#C9A84C', fontSize: 10 }}>✦</span>
            <span style={{ color: 'rgba(201,168,76,0.8)', fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase' }}>
              Fine Dining Studio
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-auto p-10 pb-12">
          <div className="w-10 h-px mb-4" style={{ background: '#C9A84C' }} />
          <h2 className="font-heading text-[28px] font-bold text-white leading-tight mb-2">
            Dein digitaler<br />Michelin-Sous-Chef
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: '2px' }}>
            Rezepte · Menüs · Kreationen
          </p>
        </div>
      </div>

      {/* ── Right: Form ────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-10 relative overflow-y-auto"
        style={{ background: '#0A0A0A' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(201,168,76,0.04) 0%, transparent 70%)',
        }} />

        <div className="relative w-full max-w-[380px]">

          {/* Logo */}
          <div className="mb-8">
            <LogoBlock />
          </div>

          {success ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                  <CheckCircle size={32} color="#C9A84C" />
                </div>
              </div>
              <h2 className="font-heading text-[22px] font-bold text-[#F5F0E8] mb-3">Anfrage eingereicht!</h2>
              <p style={{ color: 'rgba(168,152,128,0.7)', fontSize: 13, lineHeight: 1.8 }}>
                Deine Anfrage wurde eingereicht.<br />
                Du erhältst eine Email sobald<br />
                dein Zugang genehmigt wurde.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="font-heading text-[22px] font-bold text-[#F5F0E8]">Zugang anfragen</h2>
                <p style={{ color: 'rgba(168,152,128,0.7)', fontSize: 13, marginTop: 4 }}>
                  Deine Anfrage wird manuell geprüft
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#A89880', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>Name *</label>
                  <div className="relative">
                    <User size={14} color="#3A3530" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Dein Name" autoComplete="name" required
                      className={fieldCls} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#A89880', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>E-Mail *</label>
                  <div className="relative">
                    <Mail size={14} color="#3A3530" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="deine@email.de" autoComplete="email" required
                      className={fieldCls} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* Passwort */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#A89880', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>Passwort *</label>
                  <div className="relative">
                    <Lock size={14} color="#3A3530" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 Zeichen" autoComplete="new-password" required
                      className={fieldCls + ' pr-11'} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#3A3530' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#A89880')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#3A3530')}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Bestätigen */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#A89880', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>Passwort bestätigen *</label>
                  <div className="relative">
                    <Lock size={14} color="#3A3530" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="Passwort wiederholen" autoComplete="new-password" required
                      className={fieldCls + ' pr-11'} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                    {confirm.length > 0 && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {confirm === password
                          ? <CheckCircle size={14} color="#7CB87A" />
                          : <span style={{ color: '#E06B6B', fontSize: 14, fontWeight: 700 }}>✗</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Grund */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#A89880', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>Warum möchtest du Zugang? *</label>
                  <div className="relative">
                    <MessageSquare size={14} color="#3A3530" className="absolute left-3.5 top-3.5 pointer-events-none" />
                    <textarea
                      value={grund} onChange={e => setGrund(e.target.value)}
                      placeholder="Kurze Erklärung…" required rows={3}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] text-[#F5F0E8] outline-none transition-all placeholder:text-[#3A3530] resize-none"
                      style={{ ...fieldStyle, lineHeight: 1.6 }}
                      onFocus={onFocus as any} onBlur={onBlur as any}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-[12px]"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#FCA5A5' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || !name || !email || !password || !confirm || !grund}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-40 mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #B8942A 0%, #C9A84C 40%, #E2C06A 70%, #C9A84C 100%)',
                    color: '#0A0A0A',
                    boxShadow: '0 4px 24px rgba(201,168,76,0.25), 0 1px 0 rgba(255,255,255,0.1) inset',
                    letterSpacing: '0.5px',
                  }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Sende Anfrage…</> : 'Zugang anfragen'}
                </button>
              </form>
            </>
          )}

          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: '2px' }}>ODER</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {!success && (
            <p className="text-center" style={{ fontSize: 13, color: 'rgba(168,152,128,0.6)' }}>
              Bereits registriert?{' '}
              <Link href="/login" className="font-semibold transition-colors"
                style={{ color: '#C9A84C' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E2C06A')}
                onMouseLeave={e => (e.currentTarget.style.color = '#C9A84C')}>
                Anmelden
              </Link>
            </p>
          )}

          <p className="text-center mt-8" style={{ fontSize: 10, color: 'rgba(255,255,255,0.08)', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Luca Culinary Studio
          </p>
        </div>
      </div>
    </div>
  );
}

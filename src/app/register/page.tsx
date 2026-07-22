'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const BlobBackground = dynamic(() => import('@/components/ui/BlobBackground'), { ssr: false });

function OrnamentLine({ flip }: { flip?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px bg-[#6B3A4B]/25" style={{ width: 32 }} />
      <span style={{ color: 'rgba(107,58,75,0.45)', fontSize: 10 }}>✦</span>
      <div className="h-px bg-[#6B3A4B]/35" style={{ width: 14 }} />
      <span style={{ color: '#6B3A4B', fontSize: 13 }}>{flip ? '❧' : '❦'}</span>
      <div className="h-px bg-[#6B3A4B]/35" style={{ width: 14 }} />
      <span style={{ color: 'rgba(107,58,75,0.45)', fontSize: 10 }}>✦</span>
      <div className="h-px bg-[#6B3A4B]/25" style={{ width: 32 }} />
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
          filter: 'drop-shadow(0 0 8px rgba(107,58,75,0.2))',
        }}
      />
      <OrnamentLine flip />
      <p style={{ fontSize: 13, color: '#6B3A4B', letterSpacing: '5px', textTransform: 'uppercase', marginTop: 12, fontWeight: 500 }}>
        CULINARY STUDIO
      </p>
      <div style={{ width: 130, height: 0.5, background: 'rgba(107,58,75,0.3)', marginTop: 10 }} />
    </div>
  );
}

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);
  const [confirm, setConfirm]   = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]     = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return; }
    if (password.length < 6)  { setError('Passwort muss mindestens 6 Zeichen lang sein.'); return; }
    if (!termsAccepted) { setError('Bitte AGB und Datenschutzerklärung akzeptieren.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, termsAccepted }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Fehler beim Registrieren.'); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const supabase = await createClient();
      await supabase.auth.resend({ type: 'signup', email });
      setResent(true);
    } catch {
      setError('Bestätigungsmail konnte nicht erneut gesendet werden.');
    }
    setResending(false);
  };

  const fieldCls   = "w-full pl-10 pr-4 py-3.5 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8]";
  const fieldStyle = { background: 'var(--surface)', border: '1px solid var(--border)' };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(107,58,75,0.45)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(107,58,75,0.06), inset 0 0 0 1px rgba(107,58,75,0.08)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#E8E0D8';
    e.currentTarget.style.boxShadow   = 'none';
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left: Blob Background ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col" style={{ background: 'var(--bg)' }}>
        <BlobBackground />
        <div className="absolute inset-y-0 right-0 w-32 z-10" style={{
          background: 'linear-gradient(90deg, transparent, #FAF8F5)',
        }} />

        <div className="relative z-10 p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(107,58,75,0.12)', border: '1px solid rgba(107,58,75,0.3)' }}>
            <span style={{ color: '#6B3A4B', fontSize: 10 }}>✦</span>
            <span style={{ color: '#6B3A4B', fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
              Fine Dining Studio
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-auto p-10 pb-12">
          <div className="w-10 h-px mb-4" style={{ background: 'rgba(107,58,75,0.4)' }} />
          <h2 className="font-heading text-[28px] font-bold leading-tight mb-2" style={{ color: 'var(--text)' }}>
            Dein digitaler<br />Michelin-Sous-Chef
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, letterSpacing: '2px' }}>
            Rezepte · Menüs · Kreationen
          </p>
        </div>
      </div>

      {/* ── Right: Form ────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-10 relative overflow-y-auto"
        style={{ background: 'var(--bg)' }}>

        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(107,58,75,0.04) 0%, transparent 70%)',
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
                  style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.25)' }}>
                  <CheckCircle size={32} color="#6B3A4B" />
                </div>
              </div>
              <h2 className="font-heading text-[22px] font-bold text-[#2C2420] mb-3">Bestätigungsmail verschickt!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                Wir haben eine Email an<br />
                <strong style={{ color: '#2C2420' }}>{email}</strong><br />
                geschickt. Bitte klicke auf den Link darin,<br />
                um deinen Account zu bestätigen.
              </p>
              <button type="button" onClick={handleResend} disabled={resending || resent}
                className="mt-6 text-[12px] font-semibold transition-colors disabled:opacity-50"
                style={{ color: '#6B3A4B' }}>
                {resending ? 'Wird gesendet…' : resent ? 'Erneut gesendet ✓' : 'Keine Mail erhalten? Erneut senden'}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="font-heading text-[24px] font-bold text-[#2C2420]">Account erstellen</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  Kostenlos starten, jederzeit upgraden.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>
                    Name
                  </label>
                  <div className="relative">
                    <User size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Dein Name" autoComplete="name" required
                      className={fieldCls} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>
                    E-Mail
                  </label>
                  <div className="relative">
                    <Mail size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="deine@email.de" autoComplete="email" required
                      className={fieldCls} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* Passwort */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>
                    Passwort
                  </label>
                  <div className="relative">
                    <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 Zeichen" autoComplete="new-password" required
                      className={fieldCls + ' pr-11'} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#B09880' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6B3A4B')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#B09880')}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Passwort bestätigen */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>
                    Passwort bestätigen
                  </label>
                  <div className="relative">
                    <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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

                {/* AGB / Datenschutz */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 shrink-0" style={{ width: 15, height: 15, accentColor: '#6B3A4B' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Ich akzeptiere die{' '}
                    <Link href="/agb" target="_blank" className="font-semibold" style={{ color: '#6B3A4B' }}>AGB</Link>
                    {' '}und{' '}
                    <Link href="/datenschutz" target="_blank" className="font-semibold" style={{ color: '#6B3A4B' }}>Datenschutzerklärung</Link>.
                  </span>
                </label>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-[12px]"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#FCA5A5' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || !name || !email || !password || !confirm || !termsAccepted}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-40 mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #562E3C 0%, #6B3A4B 40%, #7D4558 70%, #6B3A4B 100%)',
                    color: '#FFFFFF',
                    boxShadow: (!loading && name && email && password && confirm && termsAccepted)
                      ? '0 0 0 1px rgba(107,58,75,0.35), 0 4px 24px rgba(107,58,75,0.4), 0 1px 0 rgba(255,255,255,0.15) inset'
                      : '0 1px 0 rgba(255,255,255,0.15) inset',
                    letterSpacing: '0.5px',
                  }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Account wird erstellt…</> : 'Account erstellen'}
                </button>
              </form>
            </>
          )}

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span style={{ color: '#B09880', fontSize: 10, letterSpacing: '2px' }}>ODER</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <p className="text-center" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Bereits registriert?{' '}
            <Link href="/login" className="font-semibold transition-colors"
              style={{ color: '#6B3A4B' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#562E3C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B3A4B')}>
              Anmelden
            </Link>
          </p>

          <p className="text-center mt-10" style={{ fontSize: 10, color: 'rgba(var(--text-rgb), 0.2)', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Luca Culinary Studio
          </p>
        </div>
      </div>
    </div>
  );
}

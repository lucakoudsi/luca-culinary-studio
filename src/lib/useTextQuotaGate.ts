'use client';
import { useEffect, useState } from 'react';

export type TextQuotaGate = {
  /** null = Kontingent-Status noch nicht geladen. */
  ready: boolean;
  /** true, wenn die Aktion (dieses Gewicht) gerade NICHT ausgefuehrt werden darf. */
  blocked: boolean;
  /** Grund fuer die Sperre, als fertiger UI-Text. Nur gesetzt wenn blocked || !ready. */
  reason: string;
  /** Lokal nach einer erfolgreichen Aktion aufrufen, damit die Sperre auch mitten in der Session korrekt greift, ohne einen Extra-Request. */
  consume: () => void;
  /** Bei quota_exceeded vom Server aufrufen (z.B. 429-Antwort), setzt das Restguthaben sofort auf 0. */
  markExhausted: () => void;
};

/**
 * Proaktive, rein clientseitige Kontingent-Anzeige -- liest einmalig den
 * bestehenden, reinen Lese-Endpunkt GET /api/profil/kontingent (kein
 * Verbrauch) und sperrt UI-Elemente, BEVOR eine Anfrage rausgeht, die
 * serverseitig ohnehin abgelehnt wuerde. Die eigentliche Absicherung bleibt
 * vollstaendig serverseitig in der jeweiligen KI-Route (Tier- +
 * Kontingent-Pruefung vor jedem OpenAI-Call) -- das hier ist ausschliesslich
 * UX, kein Sicherheitsmechanismus. Gemeinsam genutzt von SousChefPanel und
 * der Kalorien-Schaetzung auf der Bearbeiten-Seite, statt zweimal denselben
 * Fetch+Vergleich zu bauen.
 */
export function useTextQuotaGate(weight: number): TextQuotaGate {
  const [quota, setQuota] = useState<{ tier: number; remaining: number } | null>(null);

  useEffect(() => {
    fetch('/api/profil/kontingent').then(r => r.json()).then(d => {
      if (typeof d.tier === 'number' && d.text && typeof d.text.remaining === 'number') {
        setQuota({ tier: d.tier, remaining: d.text.remaining });
      }
    }).catch(() => {});
  }, []);

  const ready = quota !== null;
  const blocked = ready && (quota!.tier < 2 || quota!.remaining < weight);
  const reason = !ready
    ? 'Prüfe KI-Guthaben…'
    : quota!.tier < 2
      ? 'Ab Basic verfügbar.'
      : 'KI-Guthaben aufgebraucht -- nächsten Monat geht es weiter.';

  const consume = () => setQuota(q => q ? { ...q, remaining: Math.max(0, q.remaining - weight) } : q);
  const markExhausted = () => setQuota(q => q ? { ...q, remaining: 0 } : q);

  return { ready, blocked, reason, consume, markExhausted };
}

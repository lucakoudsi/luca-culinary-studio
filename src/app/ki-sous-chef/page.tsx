'use client';
import { useState, useRef, useEffect } from 'react';
import { ChefHat, Send, Loader2, User } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const quickPrompts = [
  'Welche Sauce passt zu Steinbutt?',
  'Wie fermentiere ich schwarzen Knoblauch?',
  'Dessert für ein 7-Gang-Menü?',
  'Techniken für perfektes Tartare',
  'Was passt zu Bärlauch im Frühling?',
  'Foie Gras vegan ersetzen?',
];

const responses: [RegExp, string][] = [
  [/steinbutt|plattfisch/i, `Steinbutt hat ein delikates, nussiges Fleisch – Saucen müssen tragen, nicht überdecken. Meine Empfehlungen:\n\n**Beurre Blanc** — Reduktion aus trockenem Champagner, Schalotten und weißem Pfeffer, dann mit eiskalter Butter montiert. Zeitlos und präzise.\n\n**Champagner-Kaviar-Sauce** — Fischfond mit Champagner auf ein Drittel reduziert, Crème fraîche eingearbeitet, Beluga-Kaviar kalt als Finish. Luxuriös ohne zu schwer zu werden.\n\n**Trüffel-Nage** — Heller Fischfond mit schwarzer Trüffel infusiert, klar gehalten, wenig Fett. Unterstreicht die Mineralik des Fisches.\n\nWichtig: Steinbutt braucht Hitze und Butter – aber keine schwere Rahmsoße. Die Sauce ist Rahmen, nicht Hauptdarsteller.`],
  [/knoblauch|schwarzer|ferment/i, `Schwarzer Knoblauch entsteht durch die Maillard-Reaktion bei niedrigen Temperaturen – kein klassisches Ferment, sondern enzymatische Reifung.\n\n**Methode:**\n1. Ganze, ungeschälte Knoblauchknollen nehmen\n2. In Reiskocher auf „Warmhalten" legen (60–70°C)\n3. 40–50 Tage Geduld – Wöchentlich auf Kondensation kontrollieren\n4. Fertig: Zehen sind tief schwarz, weich, kein Beißen mehr\n\n**Aroma:** Balsamisch, Tamarinde, tiefes Umami, leichte Süße.\n\n**Verwendung:** Schwarze-Knoblauch-Butter für Steaks, Vinaigrette für Salate, als eigenständiges Element auf dem Teller neben Rotem Fleisch.`],
  [/tartare|tatar/i, `Perfektes Tartare lebt von drei Dingen: Produktqualität, Temperatur und Präzision beim Schnitt.\n\n**Schnitt:** Niemals den Wolf – ausschließlich Messer. Zuerst in dünne Scheiben, dann Julienne, dann kleine Würfel (3–4mm). Jede Textur zählt.\n\n**Temperatur:** Das Fleisch muss bis kurz vor dem Anrichten kalt bleiben – 0–2°C. Nie bei Raumtemperatur stehen lassen.\n\n**Würzen:** Erst würzen, dann schnell und leicht vermengen. Senf, Worcestershire, Tabasco, Eigelb. Die Würze soll das Fleisch begleiten, nicht überdecken.\n\n**Fettkompensation:** Ein Spritzer hochwertiges Olivenöl oder ein Hauch gehackte Kapern binden das Gericht.\n\nWenn du ein Produkt oben drauflegst – Jakobsmuschel-Tartare, Krabben – gilt dasselbe Prinzip: kalt, präzise, respektvoll.`],
  [/dessert|7.gang|sieben|gang/i, `Für das finale Dessert eines 7-Gängers empfehle ich einen klaren Kontrast zum Vorangegangenen: leicht, frisch, mit einer Überraschung.\n\n**Ideen auf verschiedenen Niveaus:**\n\n**Klassisch-elegant:** Mille-feuille mit Vanillecreme und karamellisierten Blätterteig-Schichten. Bekannt, beruhigend, handwerklich stark.\n\n**Modern:** Miso-Crème Brûlée mit Sesam-Praline und Yuzu-Gel. Die Miso-Süße endet das Menü mit einem unerwarteten Umami-Finish.\n\n**Avantgarde:** Topinambur-Eis mit fermentiertem Karamell, Koji-Crumble und Bienenpollen. Verbindet den Fermentations-Bogen des Menüs.\n\nGenerell: Das Dessert ist Erinnerung. Es sollte leise ankommen und laut nachklingen.`],
  [/bärlauch|frühling|frühjahr/i, `Bärlauch ist Frühling in seiner intensivsten Form – aber er toleriert keine Hitze.\n\n**Goldene Regel:** Nie kochen – immer nur kurz erwärmen oder roh verwenden.\n\n**Pairings die funktionieren:**\n- **Ricotta-Ravioli** mit Bärlauch-Pesto: Die Milchproteinfülle nimmt die Schärfe auf\n- **Lammrücken** mit Bärlauch-Salsa verde: Klassisch, stark, überzeugend\n- **Jakobsmuschel** mit Bärlauch-Schaum: Kontrast zwischen Meer und Wald\n- **Burrata** mit gehacktem Bärlauch, gutem Olivenöl, Fleur de Sel: Simpel und brillant\n\n**Technik-Tipp:** Bärlauch-Öl kalt herstellen – Blätter in Eiswasser blanchieren (5 Sek.), sofort in Eiswasser abschrecken, dann mit Neutralöl mixen und filtern. Leuchtendes Grün, stabiles Aroma.`],
  [/foie|vegan|ersetzen|ersatz/i, `Foie Gras vegan ersetzen ist eine ernste Herausforderung – die Kombination aus Fett-Schmelz, Umami und Reichhaltigkeit ist einmalig. Aber es gibt ehrliche Annäherungen:\n\n**Cashew-Terrine:** Rohe Cashews über Nacht einweichen, mit weißem Miso, Kokosöl und Trüffelöl mixen, in Terrinenform setzen und kühlen. Cremig, reichhaltig, fein.\n\n**Schwarze-Bohnen-Mousse:** Gekochte schwarze Bohnen mit Räucheröl und Tahini verarbeiten. Ergibt Tiefe und Farbe – nicht identisch, aber eigenständig stark.\n\n**Weiße Bohnen mit Trüffelöl:** Die klassische provenzalische Lösung – Cassoulet-Basis als Fine-Dining-Mousse interpretiert.\n\nMein ehrlicher Rat: Nenne es nicht „vegane Foie Gras" – präsentiere es als eigenständiges Gericht. Das ist stärker.`],
];

function getMockResponse(text: string): string {
  for (const [pattern, reply] of responses) {
    if (pattern.test(text)) return reply;
  }
  return `Das ist eine interessante kulinarische Frage. Lass mich meine Gedanken dazu teilen:\n\nIn der professionellen Küche kommt es immer auf das Zusammenspiel von Textur, Temperatur und Aroma an. Die präzise Antwort hängt stark vom Kontext ab – welche anderen Komponenten hat das Gericht? Welche Aussage soll der Gang machen?\n\nMein grundlegender Ansatz: Starte mit dem Produkt, nicht mit der Technik. Was will diese Zutat in ihrer besten Form sein? Aus der Antwort ergibt sich die Methode von selbst.\n\nGib mir mehr Details – ich helfe dir gern präziser.`;
}

function now() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const boldLine = line.match(/^\*\*(.+?)\*\*/);
    if (boldLine) {
      const rest = line.slice(boldLine[0].length);
      return (
        <p key={i} className="mt-2 first:mt-0">
          <span className="font-semibold text-text-primary">{boldLine[1]}</span>{rest}
        </p>
      );
    }
    const numLine = line.match(/^(\d+)\.\s(.+)/);
    if (numLine) {
      return (
        <p key={i} className="flex gap-2 mt-1.5 first:mt-0">
          <span className="font-semibold flex-shrink-0" style={{ color: '#C9A84C' }}>{numLine[1]}.</span>
          <span>{numLine[2]}</span>
        </p>
      );
    }
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <p key={i} className="mt-1 first:mt-0 leading-relaxed">{line}</p>;
  });
}

const initial: Message[] = [{
  id: 1,
  role: 'assistant',
  text: 'Guten Tag. Ich bin dein KI-Sous-Chef. Was beschäftigt dich heute in der Küche?\n\nIch helfe dir bei Rezeptentwicklung, Techniken, Pairings, Fermentation und allem rund um professionelle Küche.',
  time: '09:00',
}];

export default function KiSousChefPage() {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text, time: now() }]);
    setInput('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 900));
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: getMockResponse(text), time: now() }]);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="flex flex-col" style={{ background: '#0A0A0A', height: '100vh' }}>
      <div className="px-8 pt-8 pb-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
          style={{ color: 'rgba(201,168,76,0.55)' }}>✦ &nbsp;Kulinarische KI</div>
        <h1 className="font-heading font-bold leading-none"
          style={{ fontSize: 28, color: '#F5F0E8', letterSpacing: '2px', textTransform: 'uppercase' }}>
          KI-Sous-Chef
        </h1>
        <p className="mt-1.5" style={{ color: 'rgba(168,152,128,0.65)', fontSize: 13 }}>
          Dein kulinarischer Assistent für Rezepte, Techniken und Inspiration
        </p>
      </div>
      <div className="flex flex-col flex-1 p-8 max-w-[900px] w-full mx-auto min-h-0">

      {/* Chat */}
      <div className="flex-1 overflow-y-auto bg-card border border-border rounded-xl p-5 mb-4 space-y-5 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
              msg.role === 'assistant' ? 'bg-gold/10 border border-gold/30' : 'bg-white/5 border border-white/10'
            }`}>
              {msg.role === 'assistant'
                ? <ChefHat size={15} color="#C9A84C" strokeWidth={1.5} />
                : <User size={14} className="text-text-secondary" />}
            </div>
            <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-xl px-4 py-3 text-[13px] ${
                msg.role === 'user'
                  ? 'rounded-tr-sm text-[#0A0A0A]'
                  : 'bg-background border border-border text-text-secondary rounded-tl-sm'
              }`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #9A7A30, #C9A84C)' } : {}}>
                {renderText(msg.text)}
              </div>
              <span className="text-[10px] text-text-muted px-1">{msg.time}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gold/10 border border-gold/30">
              <ChefHat size={15} color="#C9A84C" strokeWidth={1.5} />
            </div>
            <div className="bg-background border border-border rounded-xl rounded-tl-sm px-4 py-3.5">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#C9A84C', opacity: 0.6, animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
        {quickPrompts.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-[11px] px-3 py-1.5 rounded-full bg-card border border-border text-text-muted hover:border-gold/30 hover:text-text-secondary transition-all whitespace-nowrap">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Frage stellen oder Idee beschreiben…"
          className="flex-1 bg-card border border-border-strong rounded-xl px-4 py-3 text-text-primary text-[13px] outline-none focus:border-gold/40 transition-colors" />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #9A7A30, #E2C06A)' }}>
          {loading
            ? <Loader2 size={18} className="animate-spin" color="#0A0A0A" />
            : <Send size={18} color="#0A0A0A" />}
        </button>
      </div>
    </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { FlaskConical, Plus, Calendar, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Note { id: number; text: string; date: string }
type FermentStatus = 'Aktiv' | 'Bereit' | 'Abgeschlossen' | 'Problem';

interface FermentProject {
  id: number;
  name: string;
  type: string;
  startDate: string;
  targetDays: number;
  status: FermentStatus;
  description: string;
  notes: Note[];
  temperature: string;
  vessel: string;
}

const initial: FermentProject[] = [
  {
    id: 1,
    name: 'Shio Koji – Reis',
    type: 'Koji',
    startDate: '2026-06-01',
    targetDays: 14,
    status: 'Bereit',
    description: 'Shio Koji aus kurzkörnigem Sushi-Reis. Wird als Marinade für Steinbutt und Rinderfilet eingesetzt.',
    notes: [
      { id: 1, text: 'Tag 3: Myzel beginnt sich zu bilden, angenehmer Duft nach Kastanie und Rosen.', date: '2026-06-04' },
      { id: 2, text: 'Tag 7: Vollständige Kolonialisierung, Temperatur leicht erhöht auf 31°C.', date: '2026-06-08' },
      { id: 3, text: 'Tag 14: Perfektes Ergebnis – süßlicher Umami-Duft, cremige Konsistenz. Bereit.', date: '2026-06-15' },
    ],
    temperature: '28–32°C',
    vessel: 'Holzbox mit Deckel',
  },
  {
    id: 2,
    name: 'Schwarzer Knoblauch',
    type: 'Maillard-Reifung',
    startDate: '2026-05-15',
    targetDays: 40,
    status: 'Aktiv',
    description: 'Ganzer Knoblauch bei niedriger Temperatur gereift. Tiefes, balsamisches Umami-Profil für Saucen und Butter.',
    notes: [
      { id: 4, text: 'Woche 1: Äußere Schalen bräunen, intensiver Knoblauchgeruch. Auf Kondensation achten.', date: '2026-05-22' },
      { id: 5, text: 'Woche 2: Zehen verfärben dunkelbraun, Geruch wird milder und süßlicher.', date: '2026-05-29' },
    ],
    temperature: '60–70°C',
    vessel: 'Reiskocher (Warmhalten)',
  },
  {
    id: 3,
    name: 'Kimchi – Herbstvariante',
    type: 'Milchsäurefermentation',
    startDate: '2026-06-10',
    targetDays: 21,
    status: 'Aktiv',
    description: 'Eigene Kimchi-Variante mit Hokkaido-Kürbis, Daikon und hausgemachter Gochujang-Paste.',
    notes: [
      { id: 6, text: 'Tag 1: Salzen und Würzen abgeschlossen – Konsistenz schön fest, gut durchgemischt.', date: '2026-06-10' },
    ],
    temperature: '4–8°C (nach 24h Raumtemperatur)',
    vessel: 'Keramikgefäß 2L',
  },
  {
    id: 4,
    name: 'Pilz-Garum',
    type: 'Enzymfermentation',
    startDate: '2026-04-01',
    targetDays: 90,
    status: 'Abgeschlossen',
    description: 'Garum aus Pfifferlingen und Shiitake. Intensiver Umami-Träger für Saucen, Emulsionen und Marinaden.',
    notes: [
      { id: 7, text: 'Monat 1: Dunkelbraunfärbung schreitet fort, Flüssigkeit beginnt sich zu trennen.', date: '2026-05-01' },
      { id: 8, text: 'Monat 2: Abgeseiht und gefiltert. Intensiver Pilz-Umami, kaum noch Eigengeruch.', date: '2026-06-01' },
      { id: 9, text: 'Abschluss: Perfektes Ergebnis. 850ml gewonnen, im Kühlhaus bei 2°C gelagert.', date: '2026-06-30' },
    ],
    temperature: '60°C (Ofen)',
    vessel: 'Vakuumbeutel / Sous-vide',
  },
];

const statusColors: Record<FermentStatus, string> = {
  Aktiv: '#7BB8D4', Bereit: '#7CB87A', Abgeschlossen: '#A89880', Problem: '#E06B6B',
};

function StatusIcon({ status }: { status: FermentStatus }) {
  if (status === 'Bereit' || status === 'Abgeschlossen') return <CheckCircle2 size={12} />;
  if (status === 'Problem') return <AlertCircle size={12} />;
  return <Clock size={12} />;
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function ProjectCard({ project, onAddNote }: { project: FermentProject; onAddNote: (id: number, text: string) => void }) {
  const [noteText, setNoteText] = useState('');
  const [open, setOpen] = useState(false);
  const days = daysSince(project.startDate);
  const progress = Math.min((days / project.targetDays) * 100, 100);
  const color = statusColors[project.status];

  const submit = () => {
    if (!noteText.trim()) return;
    onAddNote(project.id, noteText);
    setNoteText('');
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"
                style={{ background: `${color}15`, color, border: `1px solid ${color}35` }}>
                <StatusIcon status={project.status} /> {project.status}
              </span>
              <span className="text-[11px] text-text-muted">{project.type}</span>
            </div>
            <h3 className="font-heading text-[17px] font-bold text-text-primary">{project.name}</h3>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[22px] font-bold leading-none" style={{ color }}>{Math.min(days, project.targetDays)}</div>
            <div className="text-[10px] text-text-muted mt-0.5">/ {project.targetDays} Tage</div>
          </div>
        </div>

        <p className="text-[12px] text-text-secondary leading-relaxed mb-4">{project.description}</p>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-text-muted">Fortschritt</span>
            <span className="text-[11px] font-semibold" style={{ color }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: color }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted mb-4">
          <span className="flex items-center gap-1"><Calendar size={11} />{project.startDate}</span>
          <span>Temp: {project.temperature}</span>
          <span>Gefäß: {project.vessel}</span>
        </div>

        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
          style={{ color: '#C9A84C' }}>
          {project.notes.length} Notiz{project.notes.length !== 1 ? 'en' : ''}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="space-y-2.5 mb-4">
            {project.notes.length === 0 && (
              <p className="text-[12px] text-text-muted italic">Noch keine Notizen.</p>
            )}
            {project.notes.map(n => (
              <div key={n.id} className="bg-background rounded-lg px-3.5 py-2.5">
                <p className="text-[12px] text-text-secondary leading-relaxed">{n.text}</p>
                <p className="text-[10px] text-text-muted mt-1">{n.date}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Beobachtung notieren…"
              className="flex-1 bg-background border border-border-strong rounded-lg px-3 py-2 text-text-primary text-[12px] outline-none focus:border-gold/40" />
            <button onClick={submit}
              className="px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center"
              style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FermentationPage() {
  const [projects, setProjects] = useState<FermentProject[]>(initial);

  const addNote = (projectId: number, text: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, notes: [...p.notes, { id: Date.now(), text, date: new Date().toISOString().slice(0, 10) }] }
        : p
    ));
  };

  const active = projects.filter(p => p.status === 'Aktiv' || p.status === 'Bereit');
  const done = projects.filter(p => p.status === 'Abgeschlossen' || p.status === 'Problem');

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(201,168,76,0.55)' }}>✦ &nbsp;Laufende Projekte</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: '#F5F0E8', letterSpacing: '2px', textTransform: 'uppercase' }}>Fermentation</h1>
        <p className="mt-1.5" style={{ color: 'rgba(168,152,128,0.65)', fontSize: 13 }}>{active.length} laufende Projekte · {done.length} abgeschlossen</p>
      </div>
      <div className="p-8 max-w-[1200px]">

      {active.length > 0 && (
        <div className="mb-8">
          <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4">Aktive Projekte</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
            {active.map(p => <ProjectCard key={p.id} project={p} onAddNote={addNote} />)}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4">Abgeschlossen</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
            {done.map(p => <ProjectCard key={p.id} project={p} onAddNote={addNote} />)}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

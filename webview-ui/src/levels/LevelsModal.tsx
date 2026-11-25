import { levelOf, levelProgress, xpForLevel } from '../../../core/src/xp.js';
import { Modal } from '../components/ui/Modal.js';
import { useXp } from './xpStore.js';

interface LevelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function LevelRow({ name, xp, accent }: { name: string; xp: number; accent?: boolean }) {
  const level = levelOf(xp);
  const next = xpForLevel(level + 1);
  return (
    <div className="flex flex-col gap-2 py-4" data-testid="level-row">
      <div className="flex items-baseline justify-between gap-8 text-sm">
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap"
          style={accent ? { color: 'var(--color-skill-border)' } : undefined}
        >
          {name}
        </span>
        <span className="shrink-0">
          Nv {level}{' '}
          <span className="text-text-muted text-xs">
            ({xp}/{next} XP)
          </span>
        </span>
      </div>
      <div className="h-6 bg-btn-bg border-2 border-border">
        <div
          className="h-full"
          style={{
            width: `${Math.round(levelProgress(xp) * 100)}%`,
            background: accent ? 'var(--color-skill-border)' : 'var(--color-accent)',
          }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  entries,
  accent,
}: {
  title: string;
  entries: [string, number][];
  accent?: boolean;
}) {
  return (
    <div className="mb-10">
      <div className="text-base text-accent-bright mb-2">{title}</div>
      {entries.length === 0 ? (
        <div className="text-sm text-text-muted py-4">Todavía nada. ¡A trabajar!</div>
      ) : (
        entries.map(([name, xp]) => <LevelRow key={name} name={name} xp={xp} accent={accent} />)
      )}
    </div>
  );
}

const byXp = (record: Record<string, number>): [string, number][] =>
  Object.entries(record).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

/** The office's levels: the main agents, each sub-agent role and each skill. */
export function LevelsModal({ isOpen, onClose }: LevelsModalProps) {
  const xp = useXp();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Niveles">
      <div className="px-10 pb-8 w-[min(420px,85vw)] max-h-[65vh] overflow-y-auto">
        <p className="text-xs text-text-muted m-0 mb-8">
          Cada herramienta que usa un agente suma 1 XP; lanzar un subagente da 5 XP a su rol y
          cargar una skill le da 10 XP.
        </p>
        <Section title="Agentes principales" entries={[['Lead', xp.lead]]} />
        <Section title="Roles" entries={byXp(xp.roles)} />
        <Section title="Skills" entries={byXp(xp.skills)} accent />
      </div>
    </Modal>
  );
}

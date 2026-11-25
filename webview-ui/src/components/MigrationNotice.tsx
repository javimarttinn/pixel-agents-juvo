import { Button } from './ui/Button.js';

interface MigrationNoticeProps {
  onDismiss: () => void;
}

export function MigrationNotice({ onDismiss }: MigrationNoticeProps) {
  return (
    <div
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-100"
      onClick={onDismiss}
    >
      <div
        className="pixel-panel py-24 px-32 max-w-xl text-center leading-[1.3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-12 text-accent">¡Te debemos una disculpa!</div>
        <p className="text-xl m-0 mb-12">
          Hemos pasado a assets totalmente open source, hechos desde cero. Por desgracia, eso
          significa que tu oficina anterior se ha tenido que restablecer.
        </p>
        <p className="text-xl m-0 mb-12">Lo sentimos de verdad.</p>
        <p className="text-xl m-0 mb-12">
          ¿La buena noticia? Ha sido algo puntual y abre la puerta a mejoras muy interesantes.
        </p>
        <p className="text-xl m-0 mb-20">
          ¡Atento a lo que viene, y gracias por usar Pixel Agents!
        </p>
        <Button variant="accent" size="xl" onClick={onDismiss}>
          Entendido
        </Button>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils/cn';

function toneFor(score: number): string {
  if (score >= 72) return 'var(--color-positive)';
  if (score >= 58) return 'var(--color-accent-500)';
  if (score >= 42) return 'var(--color-warning)';
  return 'var(--color-negative)';
}

/** Cadran circulaire du score de cohérence. */
export function ScoreDial({
  score,
  size = 96,
  label,
  className,
}: {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = size >= 80 ? 8 : 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Score de cohérence : ${clamped} sur 100`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={toneFor(clamped)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold tracking-tight text-fg tabular"
          style={{ fontSize: size >= 80 ? 22 : 13 }}
        >
          {clamped}
        </span>
        {label && size >= 80 ? <span className="text-[10px] text-fg-subtle">{label}</span> : null}
      </div>
    </div>
  );
}

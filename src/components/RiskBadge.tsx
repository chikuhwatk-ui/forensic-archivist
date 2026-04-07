import { cn } from '../lib/cn';
import { RiskLevel } from '../types';

const styles: Record<RiskLevel, string> = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  high: 'bg-red-100 text-red-800 border-red-300',
};

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const ariaLabel = score !== undefined
    ? `Risk level: ${level}, score ${score} out of 100`
    : `Risk level: ${level}`;

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border',
        styles[level]
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
        )}
      />
      {level.toUpperCase()}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}

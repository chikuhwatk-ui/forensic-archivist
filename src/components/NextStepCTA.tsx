import { Link } from 'react-router-dom';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface NextStepCTAProps {
  label: string;        // e.g. "Review flagged items"
  description?: string; // optional supporting line
  to: string;           // target route
  icon?: LucideIcon;
  disabled?: boolean;
  disabledHint?: string;
}

export function NextStepCTA({
  label,
  description,
  to,
  icon: Icon,
  disabled = false,
  disabledHint,
}: NextStepCTAProps) {
  const content = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <div
            className={
              disabled
                ? 'w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0'
                : 'w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'
            }
          >
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
            Next step
          </div>
          <div
            className={
              disabled
                ? 'font-headline font-bold text-slate-400 text-lg leading-tight truncate'
                : 'font-headline font-bold text-blue-950 text-lg leading-tight truncate'
            }
          >
            {label}
          </div>
          {(description || (disabled && disabledHint)) && (
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              {disabled ? disabledHint : description}
            </div>
          )}
        </div>
      </div>
      <div
        className={
          disabled
            ? 'shrink-0 bg-slate-200 text-slate-400 px-4 py-2 rounded-lg font-headline font-bold text-sm flex items-center gap-2'
            : 'shrink-0 bg-primary text-white px-4 py-2 rounded-lg font-headline font-bold text-sm flex items-center gap-2 shadow-md shadow-primary/20 group-hover:translate-x-0.5 transition-transform'
        }
      >
        Continue
        <ArrowRight size={15} />
      </div>
    </div>
  );

  if (disabled) {
    return (
      <div
        aria-disabled="true"
        className="block rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4 hover:border-primary/40 hover:from-primary/10 transition-colors"
    >
      {content}
    </Link>
  );
}

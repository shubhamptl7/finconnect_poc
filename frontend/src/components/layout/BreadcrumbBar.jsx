import { Link } from 'react-router-dom'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BreadcrumbBar({
  items = [],
  rightElement,
  liveSync = false,
  badge,
  badgeIcon: BadgeIcon,
  backTo,
  backLabel = 'Overview',
  className,
}) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-3 px-3.5 py-1.5 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
      className
    )}>
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 min-w-0 truncate">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <div key={idx} className="flex items-center gap-1.5 truncate">
              {idx > 0 && <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />}
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-brand-600 transition-colors truncate">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast ? "font-bold text-slate-800" : "text-slate-500", "truncate")}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Action / Status Element */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightElement ? (
          rightElement
        ) : liveSync ? (
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>Live Gateway Sync</span>
          </div>
        ) : badge ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
            {BadgeIcon && <BadgeIcon size={12} />}
            {badge}
          </span>
        ) : backTo ? (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-brand-700 bg-slate-100/60 hover:bg-brand-50/80 px-2.5 py-0.5 rounded-lg border border-slate-200/60 transition-all"
          >
            <ArrowLeft size={11} />
            <span>Back to {backLabel}</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default BreadcrumbBar;

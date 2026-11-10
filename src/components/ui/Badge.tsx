import type { ReactNode } from 'react';
import type { BadgeTone } from '@/lib/status';
import s from './Badge.module.css';

/** Status badge whose copy shortens on phones (full text kept for screen readers via the visible variant). */
export function ResponsiveBadge({ tone, full, compact }: { tone: BadgeTone; full: string; compact: string }) {
  if (full === compact) return <Badge tone={tone} className={s.responsive}>{full}</Badge>;
  return (
    <Badge tone={tone} title={full} className={s.responsive}>
      <span className={s.full}>{full}</span>
      <span className={s.compact}>{compact}</span>
    </Badge>
  );
}

export function Badge({
  tone = 'neutral',
  children,
  title,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span className={[s.badge, s[tone], className].filter(Boolean).join(' ')} title={title}>
      {children}
    </span>
  );
}

/** "x 1 Qty" */
export function QtyChip({ quantity }: { quantity: number }) {
  return <span className={s.chip}>x {quantity} Qty</span>;
}

/** "20% Off" */
export function DiscountTag({ percent }: { percent: number }) {
  return <span className={s.discount}>{percent}% Off</span>;
}

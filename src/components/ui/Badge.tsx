import type { ReactNode } from 'react';
import type { BadgeTone } from '@/lib/status';
import s from './Badge.module.css';

export function Badge({ tone = 'neutral', children, title }: { tone?: BadgeTone; children: ReactNode; title?: string }) {
  return (
    <span className={`${s.badge} ${s[tone]}`} title={title}>
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

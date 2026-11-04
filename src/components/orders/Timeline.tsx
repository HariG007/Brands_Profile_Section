import { useId, useState, type ReactNode } from 'react';
import type { TrackingEvent } from '@/data/types';
import { formatEventTime } from '@/lib/format';
import s from './Timeline.module.css';

function Event({ event, action }: { event: TrackingEvent; action?: ReactNode }) {
  return (
    <li className={s.event}>
      <span className={s.rail} aria-hidden />
      <div className={s.content}>
        <div className={s.head}>
          <p className={s.title}>{event.title}</p>
          {action}
        </div>
        <div className={s.lines}>
          {event.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <p className={s.time}>
            (<time dateTime={event.occurredAt}>{formatEventTime(event.occurredAt)}</time>)
          </p>
        </div>
      </div>
    </li>
  );
}

/** Tracking timeline: shows the latest scan, expandable to the full history. */
export function Timeline({ events }: { events: TrackingEvent[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (events.length === 0) return <p style={{ padding: 12, fontSize: 14, color: 'var(--color-text-secondary)' }}>Tracking updates will appear here once your order ships.</p>;
  const [latest, ...rest] = events;

  const toggle =
    rest.length > 0 ? (
      <button className={s.toggle} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={id}>
        {open ? 'Hide Details' : 'View in detail'}
      </button>
    ) : undefined;

  return (
    <div className={[s.timeline, open && s.expanded].filter(Boolean).join(' ')}>
      <ol>
        <Event event={latest} action={toggle} />
      </ol>
      <div className={s.list} id={id} aria-hidden={!open}>
        <ol className={s.listInner} inert={!open}>
          {rest.map((e) => (
            <Event key={e.id} event={e} />
          ))}
        </ol>
      </div>
    </div>
  );
}

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './Icon';
import s from './FilterMenu.module.css';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface Props<T extends string> {
  value: T;
  options: FilterOption<T>[];
  onChange: (v: T) => void;
  /** Accessible name, e.g. "Filter orders by status" */
  label: string;
  /** Value treated as "no filter" (trigger is not highlighted). */
  neutralValue?: T;
}

/** Status filter dropdown (single-select listbox) with full keyboard support. */
export function FilterMenu<T extends string>({ value, options, onChange, label, neutralValue }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open]);

  const openMenu = () => {
    setFocus(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const choose = (o: FilterOption<T>) => {
    if (o.disabled) return;
    onChange(o.value);
    setOpen(false);
    trigger.current?.focus();
  };
  const move = (dir: 1 | -1) => {
    setFocus((i) => {
      let n = i;
      for (let k = 0; k < options.length; k++) {
        n = (n + dir + options.length) % options.length;
        if (!options[n].disabled) return n;
      }
      return i;
    });
  };

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setFocus(0); }
    else if (e.key === 'End') { e.preventDefault(); setFocus(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[focus]); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); }
  };

  const filtered = neutralValue !== undefined && value !== neutralValue;

  return (
    <div className={s.root} ref={root}>
      <button
        ref={trigger}
        type="button"
        className={[s.trigger, filtered && s.active].filter(Boolean).join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${current.label}`}
        aria-activedescendant={open ? `${listId}-${focus}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
      >
        <Icon name="filter" size={16} />
        <span className={s.triggerLabel}>{current.label}</span>
        <Icon name="chevron-down" size={16} className={s.chev} />
        {filtered && <span className={s.dot} aria-hidden />}
      </button>
      {open && (
        <ul className={s.menu} role="listbox" id={listId} aria-label={label}>
          <li className={s.heading} role="presentation">Filter by status</li>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              data-focused={i === focus}
              className={s.option}
              onPointerEnter={() => !o.disabled && setFocus(i)}
              onClick={() => choose(o)}
            >
              <span>{o.label}</span>
              {o.count !== undefined && <span className={s.optCount}>{o.count}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

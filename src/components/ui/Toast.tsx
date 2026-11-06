import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import s from './Toast.module.css';

type Tone = 'neutral' | 'success' | 'danger';
interface ToastAction {
  label: string;
  onClick: () => void;
}
interface ToastOptions {
  action?: ToastAction;
  /** ms; defaults to 3200 (5000 when there is an action, to leave time for Undo). */
  duration?: number;
}
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
  action?: ToastAction;
}

type Show = (message: string, tone?: Tone, options?: ToastOptions) => void;
const ToastContext = createContext<Show>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const [top, setTop] = useState<number>();
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback<Show>(
    (message, tone = 'neutral', options = {}) => {
      const id = ++seq.current;
      // Desktop: sit just below the site header (not over the announcement bar);
      // once the header has scrolled away, pin near the top of the viewport.
      const header = document.querySelector('header');
      const desktop = window.matchMedia('(min-width: 768px)').matches;
      setTop(desktop && header ? Math.max(16, header.getBoundingClientRect().bottom + 12) : undefined);
      setItems((list) => [...list.slice(-2), { id, message, tone, action: options.action }]);
      window.setTimeout(() => dismiss(id), options.duration ?? (options.action ? 5000 : 3200));
    },
    [dismiss],
  );
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={s.region} role="status" aria-live="polite" style={top !== undefined ? { top } : undefined}>
        {items.map((t) => (
          <div key={t.id} className={`${s.toast} ${s[t.tone]}`}>
            {t.tone === 'success' && <Icon name="check-circle" size={16} />}
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                className={s.action}
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

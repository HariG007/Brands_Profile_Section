import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import s from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  actions: ReactNode;
  /** Called for Esc, backdrop click and the close button — the parent decides whether to close. */
  onClose: () => void;
  /** 'sm' = confirm dialog, 'md' = form dialog (bottom sheet on mobile). */
  size?: 'sm' | 'md';
}

/** Accessible dialog built on the native <dialog> element (focus trap + inert background). */
export function Modal({ open, title, description, children, actions, onClose, size = 'sm' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`${s.dialog} ${s[size]}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className={s.body}>
        <div className={s.head}>
          <div>
            <h2 id={titleId} className={s.title}>{title}</h2>
            {description && <p id={descId} className={s.description}>{description}</p>}
          </div>
          {size === 'md' && (
            <button type="button" className={s.close} onClick={onClose} aria-label="Close">
              <Icon name="close" size={20} />
            </button>
          )}
        </div>
        {children && <div className={s.content}>{children}</div>}
        <div className={s.actions}>{actions}</div>
      </div>
    </dialog>
  );
}

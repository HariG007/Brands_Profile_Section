import { useId, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';
import s from './Field.module.css';

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Static text before the input, e.g. "+91". */
  prefix?: string;
  /** Trailing content inside the control, e.g. a "Verified" tick. */
  suffix?: ReactNode;
}

export function TextField({
  label,
  error,
  hint,
  required,
  disabled,
  className,
  prefix,
  suffix,
  ...input
}: BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={[s.field, className].filter(Boolean).join(' ')}>
      <label className={s.label} htmlFor={id}>
        {label}
        {required && <span className={s.required} aria-hidden>*</span>}
      </label>
      <div className={[s.control, error && s.invalid, disabled && s.disabled].filter(Boolean).join(' ')}>
        {prefix && <span className={s.prefix} aria-hidden>{prefix}</span>}
        <input
          id={id}
          className={s.input}
          disabled={disabled}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? msgId : undefined}
          {...input}
        />
        {suffix}
      </div>
      {(error || hint) && (
        <span id={msgId} className={error ? s.message : `${s.message} ${s.hint}`} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}

interface SelectProps extends BaseProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: { value: string; label: string }[];
}

export function SelectField({ label, error, required, options, disabled, className, prefix: _prefix, suffix: _suffix, ...select }: SelectProps) {
  void _prefix;
  void _suffix;
  const id = useId();
  return (
    <div className={[s.field, className].filter(Boolean).join(' ')}>
      <label className={s.label} htmlFor={id}>
        {label}
        {required && <span className={s.required} aria-hidden>*</span>}
      </label>
      <div className={[s.control, error && s.invalid, disabled && s.disabled].filter(Boolean).join(' ')}>
        <select id={id} className={s.input} disabled={disabled} aria-invalid={!!error || undefined} {...select}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={16} className={s.selectIcon} />
      </div>
      {error && (
        <span className={s.message} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

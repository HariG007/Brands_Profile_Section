import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import s from './Surface.module.css';

export function SectionTab({ children }: { children: ReactNode }) {
  return <h1 className={s.tab}>{children}</h1>;
}

export function Panel({
  children,
  padding = 24,
  className,
  as: Tag = 'section',
  ...rest
}: {
  children: ReactNode;
  padding?: 0 | 16 | 24 | 'header';
  className?: string;
  as?: 'section' | 'div' | 'aside';
  'aria-label'?: string;
}) {
  const pad = padding === 16 ? s.pad16 : padding === 24 ? s.pad24 : padding === 'header' ? s.padHeader : '';
  return (
    <Tag className={[s.panel, pad, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}

export function Strip({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[s.strip, className].filter(Boolean).join(' ')}>{children}</div>;
}

export const Divider = () => <hr className={s.divider} />;

export function SectionTitle({
  icon,
  image,
  children,
  id,
  count,
  countNoun = 'item',
}: {
  icon?: IconName;
  image?: string;
  children: ReactNode;
  id?: string;
  /** Optional subtle count pill shown after the title (hidden when undefined). */
  count?: number;
  countNoun?: string;
}) {
  return (
    <div className={s.sectionTitle}>
      {icon && <Icon name={icon} size={20} />}
      {image && <img src={image} alt="" width={24} height={24} style={{ width: 24, height: 24 }} />}
      <h2 className={s.title} id={id}>
        {children}
        {count !== undefined && (
          <span className={s.titleCount} key={count}>
            <span aria-hidden>{count > 999 ? '999+' : count}</span>
            <span className="visually-hidden">
              {' '}
              ({count} {count === 1 ? countNoun : `${countNoun}s`})
            </span>
          </span>
        )}
      </h2>
    </div>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className={s.breadcrumb}>
      {items.map((c, i) => (
        <Fragment key={c.label}>
          {c.to && i < items.length - 1 ? (
            <Link to={c.to} className={s.crumbLink}>
              <span>{c.label}</span>
              <Icon name="chevron-right" size={16} />
            </Link>
          ) : (
            <span className={s.crumbCurrent} aria-current="page">
              {c.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

export function Skeleton({ width = '100%', height = 16, style }: { width?: number | string; height?: number | string; style?: CSSProperties }) {
  return <span className={s.skeleton} style={{ width, height, ...style }} aria-hidden />;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className={s.state} role="status">
      <Icon name="package-2" size={32} />
      <p className={s.stateTitle}>{title}</p>
      {body && <p className={s.stateBody}>{body}</p>}
      {action &&
        (action.href ? (
          <a href={action.href}>
            <Button>{action.label}</Button>
          </a>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={s.state} role="alert">
      <Icon name="help" size={32} />
      <p className={s.stateTitle}>We couldn’t load this section</p>
      <p className={s.stateBody}>{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

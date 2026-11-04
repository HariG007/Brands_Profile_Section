import { useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { initials, type AccountSummary } from '@/hooks/useAccountSummary';
import { accountNav, STOREFRONT_URL, type AccountNavItem } from './navigation';
import s from './ProfileSidebar.module.css';

interface VariantProps {
  summary: AccountSummary;
  onLogout: () => void;
}

function Count({ value, noun }: { value?: number; noun: string }) {
  if (!value) return null;
  return (
    <span className={s.count}>
      <span aria-hidden>{value > 99 ? '99+' : value}</span>
      <span className="visually-hidden">, {value} {value === 1 ? noun : `${noun}s`}</span>
    </span>
  );
}

function Avatar({ summary, size = 44 }: { summary: AccountSummary; size?: number }) {
  return (
    <span className={s.avatar} style={{ width: size, height: size }} aria-hidden>
      {initials(summary.customer) || <Icon name="account-circle" size={20} />}
    </span>
  );
}

function Item({
  item,
  className,
  count,
}: {
  item: AccountNavItem;
  className: string;
  count?: number;
}) {
  return (
    <NavLink to={item.to} className={className}>
      {({ isActive }) => (
        <>
          <Icon name={isActive ? item.activeIcon : item.icon} size={20} />
          <span className={s.label}>{item.label}</span>
          {item.key === 'orders' && <Count value={count} noun="order" />}
        </>
      )}
    </NavLink>
  );
}

function BackLink() {
  return (
    <a href={STOREFRONT_URL} className={s.back}>
      <Icon name="arrow-circle-left" size={20} />
      <span>Back to Shopping</span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Account sidebar — profile card + one joined menu                    */
/* ------------------------------------------------------------------ */
export function ProfileSidebar({ summary, onLogout }: VariantProps) {
  const c = summary.customer;
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  // Red "nudge" that slides between menu items instead of jumping.
  const [nudge, setNudge] = useState<{ top: number; height: number; ready: boolean } | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const place = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      setNudge((prev) =>
        active ? { top: active.offsetTop, height: active.offsetHeight, ready: prev !== null } : null,
      );
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [pathname]);

  return (
    <div className={s.root}>
      <BackLink />
      {/* The whole card opens Profile; on hover/focus the initials turn into an edit pencil. */}
      <Link to="/account/profile" className={s.profileCard} aria-label={`Edit profile${c ? ` — ${c.firstName} ${c.lastName}` : ''}`}>
        <span className={s.avatarEdit}>
          <Avatar summary={summary} />
          <span className={s.avatarPencil} aria-hidden>
            <Icon name="edit" size={18} />
          </span>
        </span>
        <span className={s.identityFull}>
          <span className={s.nameFull}>{c ? `${c.firstName} ${c.lastName}` : ' '}</span>
          <span className={s.emailFull}>{c?.email ?? ' '}</span>
          {c?.phone && <span className={s.emailFull}>{c.phone.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2')}</span>}
        </span>
      </Link>
      <nav ref={navRef} className={`${s.menu} ${s.menuSliding}`} aria-label="Account">
        {nudge && (
          <span
            className={`${s.nudge} ${nudge.ready ? s.nudgeAnimated : ''}`}
            style={{ transform: `translateY(${nudge.top}px)`, height: nudge.height }}
            aria-hidden
          />
        )}
        {accountNav.map((item) => (
          <Item key={item.key} item={item} className={s.menuItem} count={summary.orders} />
        ))}
      </nav>
      <button type="button" className={`${s.menuItem} ${s.logoutRow} ${s.logout}`} onClick={onLogout}>
        <Icon name="logout" size={20} />
        <span className={s.label}>Logout</span>
      </button>
    </div>
  );
}

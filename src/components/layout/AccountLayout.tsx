import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { useAccountSummary } from '@/hooks/useAccountSummary';
import { AnnouncementBar } from './AnnouncementBar';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { accountNav, STOREFRONT_URL } from './navigation';
import { ProfileSidebar } from './ProfileSidebar';
import s from './AccountLayout.module.css';

/**
 * `thumbOrder` reverses the list for the mobile sheet: the sheet grows upward from
 * the bottom bar, so the most-used item (first in `accountNav`) ends up last —
 * right above the thumb — and rarely used ones sit higher up.
 */
/** Small count pill used as a nudge next to a nav label (e.g. Orders · 5). */
function CountBadge({ count, noun }: { count: number; noun: string }) {
  const label = count > 99 ? '99+' : String(count);
  return (
    <span className={s.count} key={count /* re-run the nudge when the count changes */}>
      <span aria-hidden>{label}</span>
      <span className="visually-hidden">
        , {count} {count === 1 ? noun : `${noun}s`}
      </span>
    </span>
  );
}

interface NavItemsProps {
  onNavigate?: () => void;
  thumbOrder?: boolean;
  /** Optional per-item counts keyed by nav key. */
  counts?: Partial<Record<string, number>>;
}

function NavItems({ onNavigate, thumbOrder = false, counts = {} }: NavItemsProps) {
  const items = thumbOrder ? [...accountNav].reverse() : accountNav;
  return (
    <>
      {items.map((item) => (
        <NavLink key={item.key} to={item.to} className={s.navItem} onClick={onNavigate} data-nav={item.key}>
          {({ isActive }) => (
            <>
              {isActive && <span className={s.indicator} aria-hidden />}
              <Icon name={isActive ? item.activeIcon : item.icon} size={20} />
              <span>{item.label}</span>
              {!!counts[item.key] && <CountBadge count={counts[item.key]!} noun="order" />}
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

export function AccountLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Order count for the "Orders" nudge badge (hidden while loading, on error or when 0).
  const summary = useAccountSummary();
  const counts = { orders: summary.orders ?? 0 };

  const touchY = useRef<number | null>(null);

  const current = accountNav.find((n) => pathname.startsWith(n.to)) ?? accountNav[0];

  // Close the sheet on route change and scroll to top on page change.
  useEffect(() => {
    setSheetOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  // When the sheet opens: keep its bottom (nearest the thumb) in view and put
  // keyboard focus on the current page's item.
  useEffect(() => {
    if (!sheetOpen) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.scrollTop = sheet.scrollHeight;
    sheet.querySelector<HTMLElement>('[aria-current="page"]')?.focus({ preventScroll: true });
  }, [sheetOpen]);

  // Swipe down on the sheet to dismiss it.
  const onTouchStart = (e: TouchEvent) => {
    touchY.current = sheetRef.current && sheetRef.current.scrollTop <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchY.current !== null && e.changedTouches[0].clientY - touchY.current > 60) setSheetOpen(false);
    touchY.current = null;
  };

  const askLogout = () => {
    setSheetOpen(false);
    setConfirmLogout(true);
  };

  return (
    <div className={s.page}>
      <AnnouncementBar />
      <SiteHeader />

      <div className={s.shell}>
        <aside className={s.sidebar} aria-label="Account navigation">
          <ProfileSidebar summary={summary} onLogout={askLogout} />
        </aside>

        <main className={s.content} id="main">
          <Outlet />
        </main>
      </div>

      <SiteFooter />

      {/* Mobile: thumb-zone account menu. The sheet opens upward from the bottom bar;
          the toggle sits bottom-right for one-handed (right thumb) use, and the open
          and close actions share the same spot. */}
      {sheetOpen && <div className={s.scrim} onClick={() => setSheetOpen(false)} aria-hidden />}
      <div className={`${s.mobileNav} ${sheetOpen ? s.sheetOpen : ''}`}>
        {sheetOpen && (
          <div
            id="account-sheet"
            ref={sheetRef}
            className={s.sheet}
            role="dialog"
            aria-label="Account menu"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <span className={s.grabber} aria-hidden />
            {/* Rare actions: far from the thumb (top), kept apart from navigation */}
            <div className={s.utilityRow}>
              <a href={STOREFRONT_URL} className={s.sheetBack}>
                <Icon name="arrow-circle-left" size={20} />
                <span>Back to Shopping</span>
              </a>
              <button className={`${s.navItem} ${s.logout} ${s.logoutCompact}`} onClick={askLogout}>
                <Icon name="logout" size={20} />
                <span>Logout</span>
              </button>
            </div>
            <hr className={s.divider} />
            {/* Frequent actions: least used at the top, most used at the bottom */}
            <nav className={s.sheetList} aria-label="Account sections">
              <NavItems thumbOrder counts={counts} onNavigate={() => setSheetOpen(false)} />
            </nav>
          </div>
        )}
        <button
          className={s.bar}
          onClick={() => setSheetOpen((o) => !o)}
          aria-expanded={sheetOpen}
          aria-controls="account-sheet"
        >
          <span className={s.barTitle}>User Account / {current.pageTitle}</span>
          <span className={s.barBtn}>
            <Icon name={sheetOpen ? 'close' : 'dehaze'} size={24} label={sheetOpen ? 'Close account menu' : 'Open account menu'} />
          </span>
        </button>
      </div>

      <Modal
        open={confirmLogout}
        title="Log out of your account?"
        onClose={() => setConfirmLogout(false)}
        actions={
          <>
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmLogout(false);
                navigate('/logged-out');
              }}
            >
              Logout
            </Button>
          </>
        }
      >
        You’ll need to sign in again to view your orders and saved addresses.
      </Modal>
    </div>
  );
}

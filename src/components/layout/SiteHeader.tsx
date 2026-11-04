import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/images/turms-logo.webp';
import { Icon } from '@/components/ui/Icon';
import { STOREFRONT_URL } from './navigation';
import s from './SiteHeader.module.css';

const NAV = [
  { label: 'Mens Wear', href: `${STOREFRONT_URL}/collections/men`, menu: true },
  { label: 'Womens Wear', href: `${STOREFRONT_URL}/collections/women`, menu: true },
  { label: 'About Us', href: `${STOREFRONT_URL}/pages/about-us`, menu: false },
  { label: 'Contact Us', href: `${STOREFRONT_URL}/pages/contact`, menu: false },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className={s.header}>
      {/* Desktop */}
      <div className={s.desktop}>
        <nav className={s.nav} aria-label="Main">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className={s.navItem}>
              {n.label}
              {n.menu && <Icon name="chevron-down-sm" size={12} />}
            </a>
          ))}
        </nav>
        <a href={STOREFRONT_URL} className={s.logo} aria-label="TURMS — Intelligent Apparel home">
          <img src={logo} alt="TURMS Intelligent Apparel" width={155} height={60} />
        </a>
        <div className={s.utility}>
          <div className={s.utilityList}>
            <a href={`${STOREFRONT_URL}/search`} className={s.utilityLink}>
              <Icon name="search" size={24} />
              Search
            </a>
            <Link to="/account/orders" className={s.utilityLink} aria-current="page">
              Account
            </Link>
          </div>
          <div className={s.cart}>
            <a href={`${STOREFRONT_URL}/cart`} className={s.utilityLink}>
              Cart
            </a>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className={s.mobile}>
        <div className={s.iconGroup}>
          <button className={s.iconBtn} aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <Icon name="menu" size={24} />
          </button>
          <a className={s.iconBtn} href={`${STOREFRONT_URL}/search`} aria-label="Search">
            <Icon name="search" size={24} />
          </a>
        </div>
        <a href={STOREFRONT_URL} className={s.mobileLogo} aria-label="TURMS home">
          <img src={logo} alt="TURMS Intelligent Apparel" width={80} height={31} />
        </a>
        <div className={`${s.iconGroup} ${s.iconGroupEnd}`}>
          <Link className={s.iconBtn} to="/account/orders" aria-label="Account">
            <Icon name="account" size={24} />
          </Link>
          <a className={s.iconBtn} href={`${STOREFRONT_URL}/cart`} aria-label="Cart">
            <Icon name="bag" size={24} />
          </a>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className={s.scrim} onClick={() => setMenuOpen(false)} />
          <div className={s.drawer} role="dialog" aria-modal="true" aria-label="Site menu">
            <div className={s.drawerHead}>
              <img src={logo} alt="TURMS" width={80} height={31} style={{ width: 80, height: 'auto' }} />
              <button className={s.drawerClose} onClick={() => setMenuOpen(false)} aria-label="Close menu" autoFocus>
                <Icon name="close" size={24} />
              </button>
            </div>
            <nav className={s.drawerList} aria-label="Main">
              {NAV.map((n) => (
                <a key={n.label} href={n.href} className={s.drawerItem}>
                  {n.label}
                  {n.menu && <Icon name="chevron-down-sm" size={12} rotate={-90} />}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

import { useState, type FormEvent } from 'react';
import footerLogo from '@/assets/images/turms-logo-footer.webp';
import jeans from '@/assets/images/collection-travel-jeans.webp';
import linen from '@/assets/images/collection-linen-shirts.webp';
import socks from '@/assets/images/collection-socks.webp';
import { Icon } from '@/components/ui/Icon';
import { STOREFRONT_URL } from './navigation';
import s from './SiteFooter.module.css';

const TILES = [
  { title: '30 Days No Wash Travel Jeans', image: jeans, href: `${STOREFRONT_URL}/collections/travel-jeans` },
  { title: 'Linen Shirts', image: linen, href: `${STOREFRONT_URL}/collections/linen-shirts` },
  { title: '7 Days No Smell Socks', image: socks, href: `${STOREFRONT_URL}/collections/socks` },
];

const COLUMNS = [
  { title: 'Resources', links: ['Business Enquiries', 'Shipping & Delivery Times', 'Wash Care'] },
  { title: 'Company', links: ['About Us', 'Blog', 'Technology', 'Contact Us', 'FAQ’s', 'B2B Order Enquiry'] },
  { title: 'Return, Shipping, Privacy Policies', links: ['Return & Exchange', 'Privacy Policy', 'Terms and Conditions', 'Shipping Policy'] },
];

const SEARCHES = 'Anti-stain shirts | Travel jeans | Linen shirts | No smell socks | Stretch chinos | Wrinkle-free trousers | Polo t-shirts | Women wide-leg pants';

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showSearches, setShowSearches] = useState(false);

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    setMsg(ok ? { ok, text: 'Thanks! You’re subscribed to our newsletter.' } : { ok, text: 'Please enter a valid e-mail address.' });
    if (ok) setEmail('');
  };

  return (
    <footer className={s.footer}>
      <section className={s.treasures} aria-labelledby="tech-treasures">
        <div>
          <p className={s.eyebrow}>Be in touch</p>
          <h2 id="tech-treasures" className={s.heading}>Tech Treasures</h2>
        </div>
        <div className={s.tiles}>
          {TILES.map((t) => (
            <a key={t.title} href={t.href} className={s.tile}>
              <img src={t.image} alt="" loading="lazy" />
              <span className={s.tileTitle}>{t.title}</span>
            </a>
          ))}
        </div>
      </section>

      <div className={s.main}>
        <div className={s.columns}>
          <div className={s.about}>
            <img src={footerLogo} alt="TURMS Intelligent Apparel" width={160} height={62} loading="lazy" />
            <p>
              <strong>TURMS</strong> <em>(In Etruscan/ Greek means God of Trade/Commerce)</em> is India’s first technology driven and
              award-winning “<strong>Intelligent Apparels” &amp; “Performance”</strong> fashion brand, in operation since year 2016.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className={s.colTitle}>{c.title}</p>
              <ul className={s.links}>
                {c.links.map((l) => (
                  <li key={l}>
                    <a href={STOREFRONT_URL}>{l}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label="Contacts">
            <p className={s.colTitle}>Contacts</p>
            <ul className={s.links}>
              {(['facebook', 'instagram', 'youtube'] as const).map((n) => (
                <li key={n}>
                  <a className={s.social} href={`https://www.${n}.com/urturms`} target="_blank" rel="noreferrer">
                    <Icon name={n} size={20} />
                    {n === 'youtube' ? 'YouTube' : n[0].toUpperCase() + n.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className={s.newsletter}>
            <p className={s.newsTitle}>Newsletter</p>
            <p className={s.newsBody}>Stay up to date with the new collections, products and exclusive offers.</p>
            <form className={s.form} onSubmit={subscribe} noValidate>
              <label htmlFor="newsletter-email" className="visually-hidden">E-mail</label>
              <input
                id="newsletter-email"
                className={s.email}
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMsg(null);
                }}
              />
              <button type="submit" className={s.subscribe}>Subscribe now</button>
            </form>
            {msg && <p className={`${s.formMsg} ${msg.ok ? '' : s.formErr}`} role="status">{msg.text}</p>}
          </div>
        </div>
      </div>

      <div className={s.bottom}>© Copyright, 2025 URturms</div>
      <div className={s.searches}>
        <div className={s.searchesInner}>
          <span>TOP SEARCHES</span>
          <button className={s.searchesToggle} onClick={() => setShowSearches((v) => !v)} aria-expanded={showSearches}>
            Show/Hide Searches {showSearches ? '−' : '+'}
          </button>
        </div>
        {showSearches && <p className={s.searchList}>{SEARCHES}</p>}
      </div>
    </footer>
  );
}

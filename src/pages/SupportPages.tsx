import { Link } from 'react-router-dom';
import logo from '@/assets/images/turms-logo.webp';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { EmptyState, SectionTab } from '@/components/ui/Surface';
import p from './Page.module.css';
import s from './SupportPages.module.css';

const CHANNELS: { title: string; body: string; href: string; icon: IconName; action: string; external?: boolean }[] = [
  { title: 'WhatsApp', body: 'Chat with our care team, 10 AM – 7 PM, Mon–Sat.', href: 'https://wa.me/919714563909', icon: 'chat-bubble', action: 'Opens WhatsApp in a new tab', external: true },
  { title: 'Email', body: 'care@urturms.com — we reply within 24 hours.', href: 'mailto:care@urturms.com', icon: 'mail', action: 'Opens your email app' },
  { title: 'Call', body: '+91 97145 63909 — 10 AM – 7 PM, Mon–Sat.', href: 'tel:+919714563909', icon: 'call', action: 'Starts a phone call' },
];

export function ChatPage() {
  return (
    <div className={p.stack24}>
      <SectionTab>Chat with us</SectionTab>
      <section className={s.card}>
        <p className={s.lead}>Questions about an order, sizing or returns? Reach us on any channel below.</p>
        <div className={s.channels}>
          {CHANNELS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className={s.channel}
              target={c.external ? '_blank' : undefined}
              rel={c.external ? 'noopener noreferrer' : undefined}
              aria-label={`${c.title}: ${c.body} ${c.action}`}
            >
              <span className={s.channelIcon} aria-hidden>
                <Icon name={c.icon} size={c.icon === 'call' ? 18 : 20} />
              </span>
              <span className={s.channelText}>
                <span className={s.channelTitle}>{c.title}</span>
                <span className={s.channelBody}>{c.body}</span>
              </span>
              <Icon name="arrow-outward" size={16} className={s.channelArrow} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

const FAQS = [
  { q: 'How do I track my order?', a: 'Go to Orders, open an order and tap any item to see its AWB number and live tracking timeline.' },
  { q: 'Can I edit an order after placing it?', a: 'Orders saved as drafts can be edited from Orders → Edit Order Details. Placed orders can’t be edited once they’re packed.' },
  { q: 'What if my delivery attempt failed?', a: 'Open the item and choose “Reattempt”. Our courier partner will contact you before the next attempt.' },
  { q: 'How do returns work?', a: 'Delivered items can be returned from the item page via “Initiate Return”. We schedule a free pickup and refund within 5–7 business days.' },
  { q: 'How do I change my default address?', a: 'Go to Address and tap “Set as Default” on the address you want. You can also tick “Make this my default address” while adding or editing one.' },
];

export function FaqPage() {
  return (
    <div className={p.stack24}>
      <SectionTab>FAQs</SectionTab>
      <section className={s.card} style={{ gap: 0 }}>
        {FAQS.map((f) => (
          <details key={f.q} className={s.faq}>
            <summary>
              {f.q}
              <Icon name="chevron-down" size={16} />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}

export function LoggedOutPage() {
  return (
    <div className={s.center}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
        <img src={logo} alt="TURMS Intelligent Apparel" width={155} height={60} style={{ width: 155, height: 'auto' }} />
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>You’ve been logged out</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>See you again soon.</p>
        <Link to="/account/orders">
          <Button>Log in again</Button>
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className={p.stack24}>
      <SectionTab>Page not found</SectionTab>
      <EmptyState
        title="This page doesn’t exist"
        body="The link may be broken or the page may have moved."
        action={{ label: 'Go to Orders', href: '/account/orders' }}
      />
    </div>
  );
}

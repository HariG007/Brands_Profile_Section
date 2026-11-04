import s from './AnnouncementBar.module.css';

const MESSAGE = 'Turms, a brand that impressed the Sharks and won Dhoni’s heart | Trusted by 1 Million customers | Free shipping as a bird | Seasonal sale is live now';

export function AnnouncementBar() {
  return (
    <div className={s.bar} role="region" aria-label="Announcement">
      <div className={s.track}>
        <p className={s.text}>{MESSAGE}</p>
        <p className={`${s.text} ${s.clone}`} aria-hidden>
          {MESSAGE}
        </p>
      </div>
    </div>
  );
}

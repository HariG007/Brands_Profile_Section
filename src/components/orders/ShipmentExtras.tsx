import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import s from './ShipmentExtras.module.css';

export function StatusBanner({ text, art, variant }: { text: string; art: string; variant: 'delivered' | 'failed' | 'in-transit' }) {
  return (
    <div className={s.banner} role="status">
      <p className={s.bannerText}>{text}</p>
      <img className={`${s.bannerArt} ${s[`art-${variant}`]}`} src={art} alt="" />
    </div>
  );
}

export function RatingStars({
  value,
  onRate,
  disabled,
}: {
  value: number;
  onRate?: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={s.stars} role="radiogroup" aria-label="Rate this product" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={s.star}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onRate?.(n)}
        >
          <Icon name={n <= shown ? 'kid-star-filled' : 'kid-star'} size={16} />
        </button>
      ))}
    </div>
  );
}

export { s as shipmentStyles };

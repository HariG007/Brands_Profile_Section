import type { Product } from '@/data/types';
import { DiscountTag } from '@/components/ui/Badge';
import { formatRupee } from '@/lib/format';
import s from './ProductCard.module.css';

const discountPct = (p: Product) =>
  p.discountPercent ?? Math.floor(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);

function Details({ product }: { product: Product }) {
  const pct = discountPct(product);
  return (
    <div className={s.body}>
      <div className={s.names}>
        <p className={s.title} title={product.title}>{product.title}</p>
        <p className={s.variant}>{product.variant}</p>
      </div>
      <div className={s.prices}>
        <span className={s.price}>{formatRupee(product.price)}</span>
        {product.compareAtPrice > product.price && (
          <>
            <span className={s.mrp}>
              <span className="visually-hidden">MRP was </span>MRP {formatRupee(product.compareAtPrice)}
            </span>
            {pct > 0 && <DiscountTag percent={pct} />}
          </>
        )}
      </div>
    </div>
  );
}

export function ProductCard({ product, layout = 'vertical' }: { product: Product; layout?: 'vertical' | 'compact' }) {
  return (
    <a href={product.url} className={layout === "compact" ? s.compact : s.card} data-rail-item="">
      <div className={s.image}>
        <img src={product.image} alt={`${product.title} — ${product.variant}`} loading="lazy" width={214} height={214} />
      </div>
      <Details product={product} />
    </a>
  );
}

export { s as productCardStyles };

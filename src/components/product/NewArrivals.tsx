import { useLayoutEffect, useRef, useState } from 'react';
import { accountService } from '@/data/accountService';
import { useAsync } from '@/hooks/useAsync';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Surface';
import { ProductCard } from './ProductCard';
import s from './NewArrivals.module.css';

interface Props {
  /** vertical = tall cards, compact = wide cards (image left) */
  layout?: 'vertical' | 'compact';
  /** Max products shown. */
  limit?: number;
  title?: string;
  subtle?: boolean;
  /** Render without its own white panel (when nested inside another panel). */
  flush?: boolean;
  /** Auto-advance the rail (default on). */
  autoPlay?: boolean;
}

export function NewArrivals({
  layout = 'vertical',
  title = 'Explore Our New Arrivals',
  subtle = false,
  flush = false,
  autoPlay = true,
  limit,
}: Props) {
  const res = useAsync(() => accountService.getNewArrivals(), []);
  const railRef = useRef<HTMLDivElement>(null);
  const all = res.status === 'success' ? res.data : [];
  const products = limit ? all.slice(0, limit) : all;
  const [overflows, setOverflows] = useState(false);

  // Loop (clone the set) only when the original cards don't fit the rail.
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail || products.length === 0) return;
    const measure = () => {
      const items = rail.querySelectorAll<HTMLElement>('[data-rail-item]');
      const last = items[products.length - 1];
      setOverflows(!!last && last.offsetLeft + last.offsetWidth > rail.clientWidth + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    return () => ro.disconnect();
  }, [products.length]);

  const loop = autoPlay && overflows;
  const go = useAutoScroll(railRef, { enabled: loop, setSize: products.length });


  // Recommendations are non-critical: hide the rail when empty or failing.
  if (res.status === 'error' || (res.status === 'success' && res.data.length === 0)) return null;

  return (
    <section className={[s.section, flush && s.flush].filter(Boolean).join(' ')} aria-label={title}>
      <div className={s.head}>
        <h2 className={subtle ? s.subtle : s.title}>{title}</h2>
        {res.status === 'success' && products.length > 1 && overflows && (
          <div className={s.arrows}>
            <button type="button" className={s.arrow} onClick={() => go(-1)} aria-label="Previous product">
              <Icon name="chevron-down" size={16} rotate={90} />
            </button>
            <button type="button" className={s.arrow} onClick={() => go(1)} aria-label="Next product">
              <Icon name="chevron-down" size={16} rotate={-90} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={railRef}
        className={s.rail}
        tabIndex={0}
        aria-label="New arrivals, scroll horizontally"
        aria-live="off"
      >
        {res.status === 'loading'
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} style={{ flex: layout === 'compact' ? '0 0 270px' : '0 0 214px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton height={layout === 'vertical' ? 214 : 100} />
                {layout === 'vertical' && <Skeleton width="70%" height={14} />}
                {layout === 'vertical' && <Skeleton width="45%" height={14} />}
              </div>
            ))
          : (
            <>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} layout={layout} />
              ))}
              {/* Visual clones for a seamless loop — hidden from assistive tech and tab order */}
              {loop && (
                <div className={s.clones} aria-hidden inert>
                  {products.map((p) => (
                    <ProductCard key={`clone-${p.id}`} product={p} layout={layout} />
                  ))}
                </div>
              )}
            </>
          )}
      </div>
    </section>
  );
}

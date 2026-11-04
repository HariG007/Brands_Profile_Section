import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import historyIllustration from '@/assets/images/illustration-order-history.webp';
import { accountService } from '@/data/accountService';
import { useAsync } from '@/hooks/useAsync';
import { OrderAccordion } from '@/components/orders/OrderAccordion';
import { NewArrivals } from '@/components/product/NewArrivals';
import { Button } from '@/components/ui/Button';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { isOrderFilter, matchesFilter, ORDER_FILTERS, type OrderFilter } from '@/lib/status';
import { EmptyState, ErrorState, SectionTab, SectionTitle, Skeleton } from '@/components/ui/Surface';
import s from './OrdersPage.module.css';
import p from './Page.module.css';

const PAGE_SIZE = 5;

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading orders">
      {[0, 1, 2].map((i) => (
        <div key={i} className={s.skRow}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 140 }}>
            <Skeleton height={34} />
            <Skeleton width="80%" height={12} />
          </div>
          <Skeleton width={60} height={60} />
          <Skeleton width={60} height={60} />
          <Skeleton width={60} height={60} />
        </div>
      ))}
    </div>
  );
}

export function OrdersPage() {
  const res = useAsync(() => accountService.getOrders(), []);
  // Single-open accordion: opening an order closes the one that was open.
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const toggle = (id: string) => {
    const opening = openId !== id;
    setOpenId(opening ? id : null);
    if (!opening) return;
    // When a row above collapses, the newly opened row shifts up — keep its header in view
    // once the collapse/expand animation (320ms) has settled.
    window.setTimeout(() => {
      const el = document.getElementById(`order-${id}`);
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      }
    }, 340);
  };

  // Status filter lives in the URL (?status=failed) so it survives refresh/back and can be shared.
  const [params, setParams] = useSearchParams();
  const raw = params.get('status');
  const filter: OrderFilter = isOrderFilter(raw) ? raw : 'all';
  const setFilter = (f: OrderFilter) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (f === 'all') next.delete('status');
        else next.set('status', f);
        return next;
      },
      { replace: true },
    );

  const all = useMemo(() => (res.status === 'success' ? res.data : []), [res.status, res.data]);
  const orders = useMemo(() => all.filter((o) => matchesFilter(o, filter)), [all, filter]);
  const filterOptions = useMemo(
    () =>
      ORDER_FILTERS.map((f) => {
        const count = all.filter((o) => matchesFilter(o, f.value)).length;
        return { ...f, count, disabled: f.value !== 'all' && count === 0 };
      }),
    [all],
  );
  const activeLabel = ORDER_FILTERS.find((f) => f.value === filter)!.label;

  // A new filter starts from the first page with everything collapsed.
  useEffect(() => {
    setVisible(PAGE_SIZE);
    setOpenId(null);
  }, [filter]);

  return (
    <div className={p.stack}>
      <SectionTab>My Orders</SectionTab>
      <NewArrivals layout="compact" />

      <section className={s.card} aria-labelledby="order-history-title">
        <div className={s.cardHead}>
          <SectionTitle
            image={historyIllustration}
            id="order-history-title"
            count={res.status === 'success' && all.length > 0 ? all.length : undefined}
            countNoun="order"
          >
            Order History &amp; Status
          </SectionTitle>
          {res.status === 'success' && all.length > 0 && (
            <FilterMenu
              label="Filter orders by status"
              value={filter}
              neutralValue="all"
              options={filterOptions}
              onChange={setFilter}
            />
          )}
        </div>

        <div className={s.cardBody}>
          {res.status === 'loading' && <ListSkeleton />}
          {res.status === 'error' && <ErrorState message={res.error.message} onRetry={res.retry} />}
          {res.status === 'success' &&
            (all.length === 0 ? (
              <EmptyState
                title="You haven’t placed any orders yet"
                body="When you place an order, you can track its status and view details right here."
                action={{ label: 'Start Shopping', href: 'https://urturms.com' }}
              />
            ) : orders.length === 0 ? (
              <EmptyState
                title={`No ${activeLabel.toLowerCase()} orders`}
                body="Try a different status to see more of your orders."
                action={{ label: 'Show all orders', onClick: () => setFilter('all') }}
              />
            ) : (
              <div className={s.list}>
                {filter !== 'all' && (
                  <p className={s.filterNote} role="status">
                    Showing {orders.length} of {all.length} orders · <strong>{activeLabel}</strong>
                    <button type="button" className={s.clear} onClick={() => setFilter('all')}>
                      Clear filter
                    </button>
                  </p>
                )}
                {orders.slice(0, visible).map((o, i) => (
                  <Fragment key={o.id}>
                    {i > 0 && <hr className={s.sep} />}
                    <OrderAccordion order={o} open={openId === o.id} onToggle={() => toggle(o.id)} />
                  </Fragment>
                ))}
                {orders.length > visible && (
                  <Button variant="outline" className={s.more} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Show more orders ({orders.length - visible})
                  </Button>
                )}
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

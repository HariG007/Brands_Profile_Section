import { useId, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Order } from '@/data/types';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatOrderDate } from '@/lib/format';
import { draftLabel, orderStatusChips } from '@/lib/status';
import { OrderItemRow } from './OrderItemRow';
import s from './OrderAccordion.module.css';

const MAX_THUMBS = 3;
const THUMB_GAP = 8;

/**
 * How many thumbnails fit in the strip's current width, leaving room for the
 * "+N more" label when some are hidden. Re-measures on resize.
 */
function useThumbFit(total: number) {
  const ref = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState(Math.min(total, MAX_THUMBS));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (el.offsetParent === null) return; // hidden (e.g. normal orders on phones)
      const cs = getComputedStyle(el);
      const width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const thumb = el.querySelector('img')?.offsetWidth || 60;
      const moreW = (moreRef.current?.offsetWidth || 64) + THUMB_GAP;
      // Down to 0: when not even one image + label fits, the strip stays empty
      // (the "View Full Order (N)" link already carries the item count).
      let k = Math.min(total, MAX_THUMBS);
      while (k > 0 && k * thumb + (k - 1) * THUMB_GAP + (total > k ? moreW : 0) > width) k--;
      setFit(k);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [total]);
  return { ref, moreRef, fit };
}

interface Props {
  order: Order;
  open: boolean;
  onToggle: () => void;
}

export function OrderAccordion({ order, open, onToggle }: Props) {
  const panelId = useId();
  const navigate = useNavigate();
  const isDraft = order.kind === 'draft';
  const orderUrl = `/account/orders/${order.id}`;
  const { ref: thumbsRef, moreRef, fit } = useThumbFit(order.lineItems.length);
  const thumbs = order.lineItems.slice(0, fit);
  const extra = order.lineItems.length - thumbs.length;
  const chips = orderStatusChips(order);
  // Same count as "Total Products" on the order page (sum of quantities).
  const itemCount = order.lineItems.reduce((n, li) => n + li.quantity, 0);
  const ctaLabel = `View Full Order (${itemCount})`;
  const ctaA11y = `View full order #${order.number}: ${itemCount} ${itemCount === 1 ? 'item' : 'items'}, shipment, delivery address and payment summary`;
  const statusChips = (cls: string) =>
    chips.length > 0 && (
      <span className={cls} aria-label={`Status: ${chips.map((c) => c.label).join(', ')}`}>
        {chips.map((c) => (
          <Badge key={c.key} tone={c.tone}>
            {c.label}
          </Badge>
        ))}
      </span>
    );

  // The whole header toggles; nested links stop propagation.
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div id={`order-${order.id}`} className={[s.item, open && s.open, isDraft ? s.draft : s.placed].filter(Boolean).join(' ')}>
      <div className={s.header} onClick={onToggle}>
        <div className={s.left}>
          {!isDraft && (
            <div className={s.meta}>
              <p className={s.idBox}>Order Id: #{order.number}</p>
              <p className={s.date}>Order date:  {formatOrderDate(order.placedAt)}</p>
              {statusChips(`${s.chips} ${s.mobileChips}`)}
              <Link to={orderUrl} className={`${s.link} ${s.mobileLink}`} onClick={stop} aria-label={ctaA11y}>
                {ctaLabel}
              </Link>
            </div>
          )}
          <div ref={thumbsRef} className={s.thumbs} aria-label={`${order.lineItems.length} items`}>
            {thumbs.map((li) => (
              <img key={li.id} className={s.thumb} src={li.image} alt="" width={60} height={60} loading="lazy" />
            ))}
            {extra > 0 && thumbs.length > 0 && (
              <span ref={moreRef} className={s.more}>
                +{extra} more
              </span>
            )}
          </div>
        </div>

        <div className={s.cta}>
          {isDraft ? (
            <>
              <a
                href={order.resumeUrl}
                className={s.link}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!order.resumeUrl) {
                    e.preventDefault();
                    navigate(orderUrl);
                  }
                }}
              >
                Edit Order Details
                <Icon name="edit" size={16} />
              </a>
              <Badge tone="warning">{draftLabel(order.draftSavedAt)}</Badge>
            </>
          ) : (
            <>
              <Link to={orderUrl} className={s.link} onClick={stop} aria-label={ctaA11y}>
                {ctaLabel}
              </Link>
              {statusChips(s.chips)}
            </>
          )}
        </div>

        <button
          type="button"
          className={s.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${open ? 'Hide' : 'Show'} items in ${isDraft ? 'draft order' : `order #${order.number}`}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <Icon name="chevron-down" size={16} className={s.chevron} />
        </button>
      </div>

      <div className={s.panel} id={panelId} role="region" aria-hidden={!open}>
        <div className={s.panelInner} inert={!open}>
          <div className={s.body}>
            {order.lineItems.map((li) => (
              <OrderItemRow key={li.id} item={li} to={isDraft ? undefined : `${orderUrl}/items/${li.id}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

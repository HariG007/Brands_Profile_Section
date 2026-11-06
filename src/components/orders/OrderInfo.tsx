import type { Order } from '@/data/types';
import { formatAddress } from '@/lib/address';
import { formatDiscount, formatLongDate, formatRs } from '@/lib/format';
import { downloadInvoice } from '@/lib/invoice';
import { hasInvoice } from '@/lib/status';
import s from './OrderInfo.module.css';

const paymentLabel = (o: Order) => (o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid');

export function OrderInfoRows({ order }: { order: Order }) {
  const a = order.shippingAddress;
  return (
    <dl className={s.rows}>
      <div className={s.row}>
        <dt className={s.label}>Order Placed on</dt>
        <dd className={s.value} style={{ margin: 0 }}>{formatLongDate(order.placedAt)}</dd>
      </div>
      <div className={s.row}>
        <dt className={s.label}>{paymentLabel(order)}</dt>
        <dd className={s.value} style={{ margin: 0 }}>{formatRs(order.summary.total)}</dd>
      </div>
      <div className={`${s.row} ${s.rowTop}`}>
        <dt className={`${s.label} ${s.labelAuto}`}>Delivery Address</dt>
        <dd className={s.address} style={{ margin: 0 }}>
          <span>Name: {a.name}</span>
          <span>Phone No: {a.phone}</span>
          <span>{formatAddress(a)}</span>
        </dd>
      </div>
    </dl>
  );
}

export function OrderSummaryCard({ order }: { order: Order }) {
  const { summary } = order;
  return (
    <section className={s.summary} aria-labelledby="order-summary">
      <div className={s.summaryHead}>
        <h2 id="order-summary" className={s.summaryTitle}>Order Summary</h2>
        {hasInvoice(order) && (
          <button type="button" className={s.invoice} onClick={() => downloadInvoice(order)} aria-label={`Download invoice for order #${order.number} (PDF)`}>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
            </svg>
            Invoice
          </button>
        )}
      </div>
      <div className={s.summaryBody}>
        <p className={s.sumRow}><span>Item Total</span><span>{formatRs(summary.itemTotal)}</span></p>
        <p className={s.sumRow}><span>Item Discount</span><span>{formatDiscount(summary.itemDiscount)}</span></p>
        <p className={s.sumRow}><span>Subtotal</span><span>{formatRs(summary.subtotal)}</span></p>
        <hr className={s.hr} />
        <p className={s.sumRow}><span>Shipping</span><span>{summary.shipping === 0 ? formatRs(0) : formatRs(summary.shipping)}</span></p>
        <p className={s.sumRow}>
          <span>{paymentLabel(order)}</span>
          <span>{order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span>
        </p>
        <hr className={s.hr} />
        <p className={`${s.sumRow} ${s.total}`}><span>Order Total</span><span>{formatRs(summary.total)}</span></p>
      </div>
    </section>
  );
}

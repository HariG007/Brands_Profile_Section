import type { Order } from '@/data/types';
import { formatAddress } from '@/lib/address';
import { formatDiscount, formatLongDate, formatRs } from '@/lib/format';
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
      <h2 id="order-summary" className={s.summaryHead}>Order Summary</h2>
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

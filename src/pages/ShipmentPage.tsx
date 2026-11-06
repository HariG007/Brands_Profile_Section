import { useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import deliveredArt from '@/assets/images/illustration-delivered.webp';
import failedArt from '@/assets/images/illustration-failed.webp';
import inTransitArt from '@/assets/images/illustration-in-transit.webp';
import { accountService } from '@/data/accountService';
import type { LineItem, Order, ShipmentStatus } from '@/data/types';
import { useAsync } from '@/hooks/useAsync';
import { DetailHeader } from '@/components/orders/DetailHeader';
import { OrderInfoRows } from '@/components/orders/OrderInfo';
import { RatingStars, shipmentStyles as x, StatusBanner } from '@/components/orders/ShipmentExtras';
import { Timeline } from '@/components/orders/Timeline';
import { NewArrivals } from '@/components/product/NewArrivals';
import { Badge, QtyChip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Panel, SectionTab, Strip } from '@/components/ui/Surface';
import { useToast } from '@/components/ui/Toast';
import { formatOrderDate, formatRs, formatStatusDate } from '@/lib/format';
import { returnWindow, statusHeadline, STATUS_TONE } from '@/lib/status';
import type { UpcomingStep } from '@/components/orders/Timeline';
import { DetailSkeleton } from './OrderDetailPage';
import s from './Page.module.css';

const refundTo = (order: Order) => (order.paymentMethod === 'cod' ? 'your bank account' : 'your original payment method');

const ON_THE_WAY: Partial<Record<ShipmentStatus, string>> = {
  packed: 'Packed and ready to ship',
  in_transit: 'Your order is on its way! will reach you soon...',
  out_for_delivery: 'Out for delivery, arriving today',
};

/** Banner + a short explanatory row, in the same style as the failed-delivery panel. */
function NotePanel({ banner, label, value, note }: { banner: ReactNode; label: string; value: string; note: string }) {
  return (
    <Panel className={s.aside}>
      <div className={s.stack} style={{ gap: 8 }}>
        {banner}
        <div className={x.failBody}>
          <p className={x.reason}>
            <span className={x.reasonLabel}>{label}</span>
            <span className={x.reasonValue}>{value}</span>
          </p>
          <p className={x.muted}>{note}</p>
        </div>
      </div>
      <NewArrivals flush subtle title="Meanwhile, Explore Our New Arrivals" />
    </Panel>
  );
}

function ShipmentAside({ order, item }: { order: Order; item: LineItem }) {
  const toast = useToast();
  const [reattempt, setReattempt] = useState<'idle' | 'loading' | 'done'>('idle');
  const sh = item.shipment!;
  const status = sh.status;
  const lineTotal = formatRs(item.price * item.quantity);

  if (status === 'delivered')
    return (
      <Panel padding={16} className={s.aside}>
        <StatusBanner text="Your Order has Delivered Successfully" art={deliveredArt} variant="delivered" />
        <NewArrivals flush />
      </Panel>
    );

  if (ON_THE_WAY[status])
    return (
      <Panel className={s.aside}>
        <StatusBanner text={ON_THE_WAY[status]!} art={inTransitArt} variant="in-transit" />
        <NewArrivals flush subtle title="Meanwhile, Explore Our New Arrivals" />
      </Panel>
    );

  if (status === 'return_in_progress')
    return (
      <NotePanel
        banner={<StatusBanner text="Your return is in progress" art={deliveredArt} variant="delivered" />}
        label="Refund amount:"
        value={formatRs(sh.return?.refundAmount ?? item.price * item.quantity)}
        note={`Refunded to ${refundTo(order)} within 5–7 business days of pickup.`}
      />
    );

  if (status === 'refunded')
    return (
      <NotePanel
        banner={<StatusBanner text="Your refund has been issued" art={deliveredArt} variant="delivered" />}
        label="Refunded:"
        value={formatRs(sh.return?.refundAmount ?? item.price * item.quantity)}
        note={`Credited to ${refundTo(order)}${sh.return?.refundedAt ? ` on ${formatStatusDate(sh.return.refundedAt)}` : ''}. It can take 2–3 days to show up.`}
      />
    );

  if (status === 'cancelled')
    return (
      <NotePanel
        banner={<StatusBanner text="This item was cancelled" art={failedArt} variant="failed" />}
        label={order.paymentMethod === 'cod' ? 'Amount due:' : 'Refund amount:'}
        value={order.paymentMethod === 'cod' ? formatRs(0) : lineTotal}
        note={
          order.paymentMethod === 'cod'
            ? 'Nothing was charged for this item.'
            : 'Refunded to your original payment method within 5–7 business days.'
        }
      />
    );

  const request = async () => {
    setReattempt('loading');
    try {
      await accountService.requestReattempt(order.id, item.id);
      setReattempt('done');
      toast('Reattempt requested — we’ll try delivering again within 24–48 hrs', 'success');
    } catch (e) {
      setReattempt('idle');
      toast((e as Error).message, 'danger');
    }
  };

  return (
    <Panel className={s.aside}>
      <div className={s.stack} style={{ gap: 8 }}>
        <StatusBanner text="Delivery Attempt Unsuccessful" art={failedArt} variant="failed" />
        <div className={x.failBody}>
          <p className={x.reason}>
            <span className={x.reasonLabel}>Reason for Failed Delivery:</span>
            <span className={x.reasonValue}>{item.shipment!.failureReason ?? 'Not available'}</span>
          </p>
          <div>
            <Button
              iconRight={reattempt === 'done' ? undefined : 'replay'}
              loading={reattempt === 'loading'}
              disabled={reattempt === 'done'}
              onClick={request}
            >
              {reattempt === 'done' ? 'Reattempt Requested' : 'Reattempt'}
            </Button>
          </div>
          {reattempt === 'done' && <p className={x.note}>Our courier partner will contact you before the next attempt.</p>}
        </div>
      </div>
    </Panel>
  );
}

export function ShipmentPage() {
  const { orderId = '', itemId = '' } = useParams();
  const res = useAsync(() => accountService.getOrder(orderId), [orderId]);
  const toast = useToast();
  const [rating, setRating] = useState<number | null>(null);
  const [returnState, setReturnState] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle');

  const shell = (children: ReactNode) => (
    <div className={s.stack}>
      <SectionTab>My Orders</SectionTab>
      {children}
    </div>
  );

  if (res.status === 'loading') return shell(<DetailSkeleton />);
  if (res.status === 'error') return shell(<ErrorState message={res.error.message} onRetry={res.retry} />);

  const order = res.data;
  const item = order?.lineItems.find((li) => li.id === itemId);
  if (!order || !item || !item.shipment)
    return shell(
      <EmptyState
        title="Tracking details unavailable"
        body="This item hasn’t shipped yet or the link is incorrect."
        action={{ label: 'Go to Order History', href: '/account/orders' }}
      />,
    );

  const sh = item.shipment;
  const delivered = sh.status === 'delivered';
  const afterDelivery = delivered || sh.status === 'return_in_progress' || sh.status === 'refunded';
  const currentRating = rating ?? item.rating;
  const rw = returnWindow(item);

  // Return progress: steps still to come, furthest first.
  const upcoming: UpcomingStep[] = [];
  if (sh.status === 'return_in_progress' && sh.return) {
    upcoming.push({ title: 'REFUND ISSUED', note: `To ${refundTo(order)}, within 5–7 business days of pickup` });
    if (!sh.return.pickedUpAt) upcoming.push({ title: 'PICKED UP', note: `Expected on ${formatOrderDate(sh.return.pickupDate)}` });
  }

  const rate = async (v: number) => {
    setRating(v);
    await accountService.rateItem(order.id, item.id, v);
    toast(`Thanks! You rated this ${v} star${v > 1 ? 's' : ''}`, 'success');
  };

  const confirmReturn = async () => {
    setReturnState('loading');
    try {
      const updated = await accountService.initiateReturn(order.id, item.id);
      setReturnState('idle');
      if (updated) res.setData(updated);
      const pickup = updated?.lineItems.find((l) => l.id === item.id)?.shipment?.return?.pickupDate;
      toast(pickup ? `Return requested. Pickup on ${formatOrderDate(pickup)}` : 'Return requested', 'success');
    } catch (e) {
      setReturnState('idle');
      toast((e as Error).message, 'danger');
    }
  };

  const actions = afterDelivery ? (
    <>
      <Button size="sm" iconRight="local-mall" onClick={() => toast('Item added to your cart', 'success')}>
        Buy Again
      </Button>
      {rw?.open && (
        <Button size="sm" variant="outline" iconRight="undo" onClick={() => setReturnState('confirm')}>
          Initiate Return
        </Button>
      )}
    </>
  ) : undefined;
  const awbTitle = sh.awb ? `AWB No: ${sh.awb}` : 'Item Tracking';

  return shell(
    <>
      <DetailHeader
        crumbs={[
          { label: 'Orders', to: '/account/orders' },
          { label: `Order #${order.number}`, to: `/account/orders/${order.id}` },
          { label: awbTitle },
        ]}
        title={awbTitle}
        copyValue={sh.awb}
        backTo={`/account/orders/${order.id}`}
        actions={actions}
        stackActionsOnMobile
      />

      <div className={[s.detailGrid, afterDelivery && s.detailGridWide].filter(Boolean).join(' ')}>
        <Panel>
          <div className={s.stack}>
            <Strip>
              <span>Order Info</span>
              <Badge tone={STATUS_TONE[sh.status]}>{statusHeadline(sh)}</Badge>
            </Strip>
            <OrderInfoRows order={order} />
            <Strip>
              <span>Order Timeline</span>
            </Strip>
            <div>
              <div className={x.itemHead}>
                <img className={x.itemThumb} src={item.image} alt="" width={46} height={46} />
                <div className={x.itemInfo}>
                  <div className={x.itemLine}>
                    <p className={x.itemName}>{item.title}</p>
                    <QtyChip quantity={item.quantity} />
                  </div>
                  <div className={x.itemLine}>
                    <p className={x.itemPrice}>{formatRs(item.price)}</p>
                    {delivered && <RatingStars value={currentRating} onRate={rate} />}
                  </div>
                  {rw && <p className={rw.open ? x.returned : `${x.returned} ${x.returnClosed}`}>{rw.label}</p>}
                </div>
              </div>
              <Timeline events={sh.events} upcoming={upcoming} />
            </div>
          </div>
        </Panel>

        <ShipmentAside order={order} item={item} />
      </div>

      <Modal
        open={returnState === 'confirm' || returnState === 'loading'}
        title="Initiate a return?"
        onClose={() => returnState !== 'loading' && setReturnState('idle')}
        actions={
          <>
            <Button variant="outline" onClick={() => setReturnState('idle')} disabled={returnState === 'loading'}>
              Cancel
            </Button>
            <Button onClick={confirmReturn} loading={returnState === 'loading'}>
              Confirm Return
            </Button>
          </>
        }
      >
        We’ll schedule a free pickup for “{item.title}” ({item.variant}). Your refund goes to {refundTo(order)} within 5–7
        business days after pickup.
      </Modal>
    </>,
  );
}

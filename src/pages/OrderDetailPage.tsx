import { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { accountService } from '@/data/accountService';
import type { Order } from '@/data/types';
import { useAsync } from '@/hooks/useAsync';
import { DetailHeader } from '@/components/orders/DetailHeader';
import { OrderInfoRows, OrderSummaryCard } from '@/components/orders/OrderInfo';
import { OrderItemRow } from '@/components/orders/OrderItemRow';
import { NewArrivals } from '@/components/product/NewArrivals';
import { Badge, ResponsiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Panel, SectionTab, Skeleton, Strip } from '@/components/ui/Surface';
import { useToast } from '@/components/ui/Toast';
import { draftLabel, overallStatus, statusHeadline, STATUS_TONE } from '@/lib/status';
import s from './Page.module.css';

export function OrderStatusBadge({ order }: { order: Order }) {
  const st = overallStatus(order);
  if (st === 'draft') return <Badge tone="warning">{draftLabel(order.draftSavedAt)}</Badge>;
  if (st === 'mixed') return null;
  const first = order.lineItems[0]?.shipment;
  return first ? <ResponsiveBadge tone={STATUS_TONE[st]} full={statusHeadline(first)} compact={statusHeadline(first, true)} /> : null;
}

export function DetailSkeleton() {
  return (
    <div className={s.stack} aria-busy="true" aria-label="Loading order">
      <div style={{ background: '#fff', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width={160} height={12} />
        <Skeleton width={220} height={24} />
      </div>
      <div className={s.detailGrid}>
        <div style={{ background: '#fff', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={44} />
          <Skeleton width="60%" />
          <Skeleton width="50%" />
          <Skeleton height={64} />
          <Skeleton height={44} />
          <Skeleton height={66} />
        </div>
        <div style={{ background: '#fff', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={28} />
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={14} />)}
        </div>
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const res = useAsync(() => accountService.getOrder(orderId), [orderId]);
  const toast = useToast();

  if (res.status === 'loading')
    return (
      <div className={s.stack}>
        <SectionTab>My Orders</SectionTab>
        <DetailSkeleton />
      </div>
    );

  if (res.status === 'error')
    return (
      <div className={s.stack}>
        <SectionTab>My Orders</SectionTab>
        <ErrorState message={res.error.message} onRetry={res.retry} />
      </div>
    );

  const order = res.data;
  if (!order)
    return (
      <div className={s.stack}>
        <SectionTab>My Orders</SectionTab>
        <EmptyState
          title="We couldn’t find that order"
          body="It may have been removed, or the link is incorrect. Check your order history for all your orders."
          action={{ label: 'Go to Order History', href: '/account/orders' }}
        />
      </div>
    );

  const isDraft = order.kind === 'draft';
  const st = overallStatus(order);
  const title = isDraft ? 'Draft Order' : `Order #${order.number}`;
  const itemCount = order.lineItems.reduce((n, li) => n + li.quantity, 0);

  const actions = isDraft ? (
    <a href={order.resumeUrl}>
      <Button size="sm" iconRight="local-mall">Complete Order</Button>
    </a>
  ) : st === 'delivered' ? (
    <Button size="sm" iconRight="local-mall" onClick={() => toast(`${itemCount} items added to your cart`, 'success')}>
      Buy Again
    </Button>
  ) : undefined;

  return (
    <div className={s.stack}>
      <SectionTab>My Orders</SectionTab>
      <DetailHeader
        crumbs={[{ label: 'Orders', to: '/account/orders' }, { label: title }]}
        title={title}
        backTo="/account/orders"
        actions={actions}
      />

      <div className={s.detailGrid}>
        <Panel>
          <div className={s.stack24}>
            <Strip>
              <span>Overall Shipment Info</span>
              <OrderStatusBadge order={order} />
            </Strip>
            <OrderInfoRows order={order} />
            <Strip>
              <span>Total Products: {itemCount}</span>
            </Strip>
            <div className={s.stack}>
              {order.lineItems.map((li, i) => (
                <Fragment key={li.id}>
                  {i > 0 && <hr className={s.divider} />}
                  <OrderItemRow item={li} plain to={isDraft ? undefined : `/account/orders/${order.id}/items/${li.id}`} />
                </Fragment>
              ))}
            </div>
          </div>
        </Panel>

        <aside className={s.aside} aria-label="Order summary and recommendations">
          <Panel>
            <OrderSummaryCard order={order} />
          </Panel>
          <NewArrivals />
        </aside>
      </div>
    </div>
  );
}

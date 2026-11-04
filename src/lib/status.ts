import type { Order, OverallStatus, ShipmentStatus } from '@/data/types';
import { formatEta, formatShortDate, formatStatusDate } from './format';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'brand' | 'neutral';

export const STATUS_TONE: Record<ShipmentStatus, BadgeTone> = {
  delivered: 'success',
  failed: 'danger',
  in_transit: 'warning',
};

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  delivered: 'Delivered',
  failed: 'Failed',
  in_transit: 'In-Transit',
};

/** Order-level status: shared by every shipment, otherwise "mixed". */
export function overallStatus(order: Order): OverallStatus {
  if (order.kind === 'draft') return 'draft';
  const set = new Set(order.lineItems.map((li) => li.shipment?.status));
  if (set.size === 1) {
    const [only] = [...set];
    if (only) return only;
  }
  return 'mixed';
}

/** Badge copy for "Overall Shipment Info" / "Order Info", e.g. "Delivered (30 Jun, 2025)". */
export function statusHeadline(
  status: ShipmentStatus,
  opts: { statusDate?: string; estimatedDelivery?: string },
): string {
  if (status === 'in_transit') {
    return opts.estimatedDelivery
      ? `In-Transit (Estimated Date of Delivery: ${formatEta(opts.estimatedDelivery)})`
      : 'In-Transit';
  }
  return opts.statusDate ? `${STATUS_LABEL[status]} (${formatStatusDate(opts.statusDate)})` : STATUS_LABEL[status];
}

export const draftLabel = (savedAt?: string) => (savedAt ? `Draft Saved (${formatShortDate(savedAt)})` : 'Draft Saved');

/* ------------------------------------------------------------------ */
/* Order-list filtering + per-order status summary                     */
/* ------------------------------------------------------------------ */

export type OrderFilter = 'all' | 'draft' | 'in_transit' | 'delivered' | 'failed' | 'returned';

export const ORDER_FILTERS: { value: OrderFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_transit', label: 'In-Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'returned', label: 'Returned' },
  { value: 'draft', label: 'Draft' },
];

export const isOrderFilter = (v: string | null): v is OrderFilter =>
  !!v && ORDER_FILTERS.some((f) => f.value === v);

/** An order matches a status filter when any of its items is in that status. */
export function matchesFilter(order: Order, filter: OrderFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'draft':
      return order.kind === 'draft';
    case 'returned':
      return order.lineItems.some((li) => li.returnRequested);
    default:
      return order.kind === 'placed' && order.lineItems.some((li) => li.shipment?.status === filter);
  }
}

export interface StatusChip {
  key: string;
  tone: BadgeTone;
  label: string;
}

/** Shipment priority for the row summary: problems first, then progress, then done. */
const STATUS_ORDER: ShipmentStatus[] = ['failed', 'in_transit', 'delivered'];

/**
 * Status chips for an order row, derived from the items inside it:
 *  - every item in one status  → one chip, e.g. "Delivered"
 *  - mixed                     → one chip per status with counts, e.g. "2 Failed" · "1 Delivered"
 *  - returns are added as an extra chip
 */
export function orderStatusChips(order: Order): StatusChip[] {
  if (order.kind === 'draft') return [];
  const counts = new Map<ShipmentStatus, number>();
  for (const li of order.lineItems) {
    const st = li.shipment?.status;
    if (st) counts.set(st, (counts.get(st) ?? 0) + 1);
  }
  const present = STATUS_ORDER.filter((st) => counts.has(st));
  const chips: StatusChip[] =
    present.length === 1
      ? [{ key: present[0], tone: STATUS_TONE[present[0]], label: STATUS_LABEL[present[0]] }]
      : present.map((st) => ({ key: st, tone: STATUS_TONE[st], label: `${counts.get(st)} ${STATUS_LABEL[st]}` }));
  const returned = order.lineItems.filter((li) => li.returnRequested).length;
  if (returned) chips.push({ key: 'returned', tone: 'neutral', label: `${returned} Return Requested` });
  return chips;
}

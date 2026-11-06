import type { LineItem, Order, OverallStatus, Shipment, ShipmentStatus } from '@/data/types';
import { formatEta, formatOrderDate, formatShortDate, formatStatusDate } from './format';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'brand' | 'neutral';

/** Tone follows meaning: grey = not moving yet / closed, yellow = moving, green = done, red = needs attention. */
export const STATUS_TONE: Record<ShipmentStatus, BadgeTone> = {
  packed: 'neutral',
  in_transit: 'warning',
  out_for_delivery: 'warning',
  delivered: 'success',
  failed: 'danger',
  cancelled: 'neutral',
  return_in_progress: 'warning',
  refunded: 'success',
};

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  packed: 'Packed',
  in_transit: 'In-Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
  return_in_progress: 'Return in Progress',
  refunded: 'Refunded',
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
export function statusHeadline(sh: Pick<Shipment, 'status' | 'statusDate' | 'estimatedDelivery' | 'return'>): string {
  const label = STATUS_LABEL[sh.status];
  switch (sh.status) {
    case 'packed':
    case 'in_transit':
      return sh.estimatedDelivery ? `${label} (Estimated Date of Delivery: ${formatEta(sh.estimatedDelivery)})` : label;
    case 'out_for_delivery':
      return `${label} (Arriving today)`;
    case 'return_in_progress':
      return sh.return && !sh.return.pickedUpAt ? `${label} (Pickup: ${formatEta(sh.return.pickupDate)})` : label;
    case 'refunded':
      return sh.return?.refundedAt ? `${label} (${formatStatusDate(sh.return.refundedAt)})` : label;
    default:
      return sh.statusDate ? `${label} (${formatStatusDate(sh.statusDate)})` : label;
  }
}

export const draftLabel = (savedAt?: string) => (savedAt ? `Draft Saved (${formatShortDate(savedAt)})` : 'Draft Saved');

/* ------------------------------------------------------------------ */
/* Returns                                                             */
/* ------------------------------------------------------------------ */

/** Return policy: free returns within this many days of delivery. */
export const RETURN_WINDOW_DAYS = 7;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Last day a delivered item can be returned, or null when not applicable. */
export function returnDeadline(item: LineItem): Date | null {
  const sh = item.shipment;
  if (!sh || sh.status !== 'delivered' || !sh.statusDate) return null;
  const d = startOfDay(new Date(`${sh.statusDate}T00:00:00`));
  d.setDate(d.getDate() + RETURN_WINDOW_DAYS);
  return d;
}

/** "Return available until Fri, 7 Nov" | "Return window closed" | null (not delivered). */
export function returnWindow(item: LineItem, now = new Date()): { open: boolean; label: string } | null {
  const end = returnDeadline(item);
  if (!end) return null;
  const open = startOfDay(now) <= end;
  const iso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  return open ? { open, label: `Return available until ${formatOrderDate(iso)}` } : { open, label: 'Return window closed' };
}

/** An invoice exists once something in the order has been delivered. */
export const hasInvoice = (order: Order) =>
  order.kind === 'placed' &&
  order.lineItems.some((li) => ['delivered', 'return_in_progress', 'refunded'].includes(li.shipment?.status ?? ''));

/* ------------------------------------------------------------------ */
/* Order-list filtering + per-order status summary                     */
/* ------------------------------------------------------------------ */

export type OrderFilter = 'all' | 'draft' | 'packed' | 'in_transit' | 'delivered' | 'failed' | 'returned' | 'cancelled';

/** Filter groups: each covers one or more shipment statuses. */
const FILTER_STATUSES: Partial<Record<OrderFilter, ShipmentStatus[]>> = {
  packed: ['packed'],
  in_transit: ['in_transit', 'out_for_delivery'],
  delivered: ['delivered'],
  failed: ['failed'],
  returned: ['return_in_progress', 'refunded'],
  cancelled: ['cancelled'],
};

export const ORDER_FILTERS: { value: OrderFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'packed', label: 'Packed' },
  { value: 'in_transit', label: 'In-Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'returned', label: 'Returns' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'draft', label: 'Draft' },
];

export const isOrderFilter = (v: string | null): v is OrderFilter =>
  !!v && ORDER_FILTERS.some((f) => f.value === v);

/** An order matches a status filter when any of its items is in that status. */
export function matchesFilter(order: Order, filter: OrderFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'draft') return order.kind === 'draft';
  const statuses = FILTER_STATUSES[filter] ?? [];
  return order.kind === 'placed' && order.lineItems.some((li) => !!li.shipment && statuses.includes(li.shipment.status));
}

export interface StatusChip {
  key: string;
  tone: BadgeTone;
  label: string;
}

/** Shipment priority for the row summary: problems first, then progress, then done. */
const STATUS_ORDER: ShipmentStatus[] = [
  'failed',
  'out_for_delivery',
  'in_transit',
  'packed',
  'return_in_progress',
  'delivered',
  'refunded',
  'cancelled',
];

/**
 * Status chips for an order row, derived from the items inside it:
 *  - every item in one status  → one chip, e.g. "Delivered"
 *  - mixed                     → one chip per status with counts, e.g. "2 Failed" · "1 Delivered"
 */
export function orderStatusChips(order: Order): StatusChip[] {
  if (order.kind === 'draft') return [];
  const counts = new Map<ShipmentStatus, number>();
  for (const li of order.lineItems) {
    const st = li.shipment?.status;
    if (st) counts.set(st, (counts.get(st) ?? 0) + 1);
  }
  const present = STATUS_ORDER.filter((st) => counts.has(st));
  return present.length === 1
    ? [{ key: present[0], tone: STATUS_TONE[present[0]], label: STATUS_LABEL[present[0]] }]
    : present.map((st) => ({ key: st, tone: STATUS_TONE[st], label: `${counts.get(st)} ${STATUS_LABEL[st]}` }));
}

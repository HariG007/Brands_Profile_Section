import coalBlack from '@/assets/images/product-coal-black.webp';
import blushPink from '@/assets/images/product-blush-pink.webp';
import khaki from '@/assets/images/product-khaki.webp';
import limeGreen from '@/assets/images/product-lime-green.webp';
import { formatOrderDate } from '@/lib/format';
import type {
  Address,
  Customer,
  LineItem,
  Order,
  Product,
  Shipment,
  ShipmentStatus,
  TrackingEvent,
} from './types';

export const customer: Customer = {
  id: 'gid://shopify/Customer/7712',
  firstName: 'Smit',
  lastName: 'Pandya',
  email: 'pandyasmit8397@gmail.com',
  phone: '+919714563909',
  dateOfBirth: '1998-10-10',
  gender: 'male',
};

export const addresses: Address[] = [
  {
    id: 'addr-1',
    name: 'Smit Pandya',
    phone: '9714563909',
    line1: 'B-27 Suresh park society-1, near Ganesh society',
    line2: 'Opposite Hariyaali Restaurant, near Parivar cross road, Waghodia Road',
    city: 'Vadodara',
    province: 'Gujarat',
    zip: '390019',
    country: 'India',
    label: 'home',
    isDefault: true,
  },
  {
    id: 'addr-2',
    name: 'Smit Pandya',
    phone: '9714563909',
    line1: 'Flat 302, Sky Heights, Alkapuri',
    line2: 'Near Race Course Circle',
    city: 'Vadodara',
    province: 'Gujarat',
    zip: '390007',
    country: 'India',
    label: 'work',
    isDefault: false,
  },
];

const PRODUCT_TITLE = 'High West Wide-Leg Pant Cotton';

const catalog = {
  coal: { image: coalBlack, variant: 'Coal - Black' },
  blush: { image: blushPink, variant: 'Blush - Pink' },
  khaki: { image: khaki, variant: 'Khaki - Beige' },
  lime: { image: limeGreen, variant: 'Lime - Green' },
} as const;

export const newArrivals: Product[] = (
  [
    ['coal', 'p-1'],
    ['blush', 'p-2'],
    ['khaki', 'p-3'],
    ['lime', 'p-4'],
    ['coal', 'p-5'],
    ['blush', 'p-6'],
  ] as const
).map(([key, id]) => ({
  id,
  title: PRODUCT_TITLE,
  variant: catalog[key].variant,
  price: 400,
  compareAtPrice: 510,
  discountPercent: 20,
  image: catalog[key].image,
  url: `https://urturms.com/products/high-west-wide-leg-pant-cotton?variant=${id}`,
}));

/* ------------------------------------------------------------------- dates */

/**
 * Mock dates are relative to today so every state stays realistic
 * (an open return window, an ETA in the future, a pickup tomorrow…).
 */
const pad = (n: number) => String(n).padStart(2, '0');
const at = (dayOffset: number, time = '11:20'): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${time}:00+05:30`;
};
const day = (dayOffset: number) => at(dayOffset).slice(0, 10);

/* ---------------------------------------------------------------- tracking */

const ev = (id: string, title: string, lines: string[], occurredAt: string): TrackingEvent => ({
  id,
  title,
  lines,
  occurredAt,
});

const HUB = 'Location: WHITE FIELD BRANCH';

interface TrackOpts {
  awb?: string;
  status: ShipmentStatus;
  /** Day the order was placed (offset from today). */
  placed: number;
  /** Day of the final outcome: delivered / failed / cancelled (offset). */
  outcome?: number;
  eta?: number;
  failureReason?: string;
  ret?: { requested: number; pickup: number; pickedUp?: number; refunded?: number; amount: number };
}

const JOURNEY: ShipmentStatus[] = ['packed', 'in_transit', 'out_for_delivery', 'delivered'];

/** Builds a shipment with a believable event history (latest first). */
function track(o: TrackOpts): Shipment {
  const k = o.awb ?? `pending-${o.placed}-${o.status}`;
  const reached = (s: ShipmentStatus) => {
    const stage = ['failed', 'return_in_progress', 'refunded'].includes(o.status)
      ? JOURNEY.indexOf(o.status === 'failed' ? 'out_for_delivery' : 'delivered')
      : JOURNEY.indexOf(o.status);
    return stage >= JOURNEY.indexOf(s);
  };
  const e: TrackingEvent[] = [
    ev(`${k}-placed`, 'ORDER PLACED', ['We have successfully received your order!', 'Excitement is on the way!'], at(o.placed, '19:44')),
  ];
  if (o.status === 'cancelled') {
    e.push(ev(`${k}-cancel`, 'ORDER CANCELLED', ['Cancelled at your request', 'Refund initiated to your original payment method'], at(o.outcome ?? o.placed, '21:05')));
  }
  if (reached('packed')) e.push(ev(`${k}-packed`, 'PACKED', ['Packed at our warehouse', HUB], at(o.placed, '22:10')));
  if (reached('in_transit')) {
    e.push(ev(`${k}-shipped`, 'ORDER SHIPPED', ['Pickup Scheduled', HUB], at(o.placed + 1, '09:30')));
    e.push(ev(`${k}-picked`, 'PICKED UP', ['Booked', HUB], at(o.placed + 1, '13:15')));
    e.push(ev(`${k}-hub`, 'IN TRANSIT', ['Arrived at destination hub', 'Location: VADODARA HUB'], at(o.placed + 2, '06:40')));
  }
  if (reached('out_for_delivery'))
    e.push(ev(`${k}-ofd`, 'OUT FOR DELIVERY', ['With our delivery partner', 'Location: VADODARA'], at(o.outcome ?? 0, '08:30')));
  if (reached('delivered')) e.push(ev(`${k}-dlv`, 'DELIVERED', ['Delivered to customer', 'Received by: Smit'], at(o.outcome ?? 0, '14:10')));
  if (o.status === 'failed')
    e.push(ev(`${k}-fail`, 'DELIVERY FAILED', [`Reason: ${o.failureReason}`, 'We’ll reattempt on your request'], at(o.outcome ?? 0, '15:25')));
  if (o.ret) {
    e.push(ev(`${k}-rreq`, 'RETURN REQUESTED', ['Return request received'], at(o.ret.requested, '10:05')));
    e.push(ev(`${k}-rpick`, 'PICKUP SCHEDULED', [`Courier will collect it on ${formatOrderDate(day(o.ret.pickup))}`, 'Keep the item packed with its tags on'], at(o.ret.requested, '10:06')));
    if (o.ret.pickedUp !== undefined) e.push(ev(`${k}-rpicked`, 'PICKED UP', ['Return collected from your address'], at(o.ret.pickedUp, '12:30')));
    if (o.ret.refunded !== undefined)
      e.push(ev(`${k}-refund`, 'REFUND ISSUED', [`Rs. ${o.ret.amount.toLocaleString('en-IN')} credited to your original payment method`], at(o.ret.refunded, '16:00')));
  }
  return {
    awb: reached('packed') ? o.awb : undefined,
    status: o.status,
    statusDate: o.outcome !== undefined ? day(o.outcome) : undefined,
    estimatedDelivery: o.eta !== undefined ? day(o.eta) : undefined,
    failureReason: o.failureReason,
    return: o.ret && {
      requestedAt: at(o.ret.requested, '10:05'),
      pickupDate: day(o.ret.pickup),
      pickedUpAt: o.ret.pickedUp !== undefined ? at(o.ret.pickedUp, '12:30') : undefined,
      refundedAt: o.ret.refunded !== undefined ? at(o.ret.refunded, '16:00') : undefined,
      refundAmount: o.ret.amount,
    },
    events: e.reverse(),
  };
}

/* ------------------------------------------------------------------ orders */

let lineSeq = 0;
const item = (
  key: keyof typeof catalog,
  price: number,
  shipment: Shipment | null,
  quantity = 1,
): LineItem => ({
  id: `li-${++lineSeq}`,
  title: PRODUCT_TITLE,
  variant: catalog[key].variant,
  image: catalog[key].image,
  quantity,
  price,
  shipment,
  rating: 0,
});

const summarise = (items: LineItem[], discount = 0, shipping = 0) => {
  const itemTotal = items.reduce((sum, li) => sum + li.price * li.quantity, 0);
  const subtotal = itemTotal - discount;
  return { itemTotal, itemDiscount: discount, subtotal, shipping, total: subtotal + shipping };
};

const makeOrder = (o: Omit<Order, 'summary'> & { discount?: number; shippingFee?: number }): Order => ({
  ...o,
  summary: summarise(o.lineItems, o.discount, o.shippingFee),
});

const base = { kind: 'placed' as const, paymentMethod: 'prepaid' as const, paymentStatus: 'paid' as const, shippingAddress: addresses[0] };

export const orders: Order[] = [
  makeOrder({
    ...base,
    id: 'draft-1042',
    number: 'D1042',
    kind: 'draft',
    placedAt: at(-3, '10:12'),
    draftSavedAt: day(-3),
    resumeUrl: 'https://urturms.com/cart',
    paymentStatus: 'pending',
    lineItems: [
      item('khaki', 1799, null),
      item('lime', 1799, null),
      item('coal', 1799, null),
      item('blush', 1799, null),
      item('khaki', 1799, null),
      item('coal', 1799, null),
    ],
  }),
  // Split shipment: one parcel out for delivery, one packed.
  makeOrder({
    ...base,
    id: '521451',
    number: '521451',
    placedAt: at(-1, '18:02'),
    lineItems: [
      item('coal', 1699, track({ awb: '89892887900', status: 'out_for_delivery', placed: -2, outcome: 0, eta: 0 })),
      item('khaki', 1799, track({ awb: '89892887901', status: 'packed', placed: -1, eta: 3 })),
    ],
  }),
  makeOrder({
    ...base,
    id: '521450',
    number: '521450',
    placedAt: at(-3, '08:40'),
    lineItems: [
      item('khaki', 1799, track({ awb: '89892887880', status: 'in_transit', placed: -3, eta: 2 })),
      item('lime', 1799, track({ awb: '89892887881', status: 'in_transit', placed: -3, eta: 2 })),
      item('coal', 1699, track({ awb: '89892887882', status: 'in_transit', placed: -3, eta: 2 })),
    ],
  }),
  makeOrder({
    ...base,
    id: '521449',
    number: '521449',
    placedAt: at(-4, '20:30'),
    lineItems: [
      item('blush', 1799, track({ status: 'cancelled', placed: -4, outcome: -4 })),
      item('coal', 1799, track({ status: 'cancelled', placed: -4, outcome: -4 })),
    ],
  }),
  makeOrder({
    ...base,
    id: '521448',
    number: '521448',
    placedAt: at(-5, '09:05'),
    lineItems: [
      item('khaki', 1799, track({ awb: '89892887870', status: 'failed', placed: -5, outcome: -1, failureReason: 'Customer Unavailable' })),
      item('lime', 1799, track({ awb: '89892887871', status: 'failed', placed: -5, outcome: -1, failureReason: 'Customer Unavailable' })),
      item('coal', 1699, track({ awb: '89892887872', status: 'delivered', placed: -5, outcome: -2 })),
    ],
  }),
  // Delivered two days ago; one item is being returned.
  makeOrder({
    ...base,
    id: '521447',
    number: '521447',
    placedAt: at(-6, '11:20'),
    lineItems: [
      item('khaki', 1799, track({ awb: '89892887862', status: 'delivered', placed: -6, outcome: -2 })),
      item('lime', 1799, track({ awb: '89892887863', status: 'return_in_progress', placed: -6, outcome: -2, ret: { requested: -1, pickup: 1, amount: 1799 } })),
      item('coal', 1699, track({ awb: '89892887864', status: 'delivered', placed: -6, outcome: -2 })),
    ],
  }),
  // Delivered weeks ago — return window closed.
  makeOrder({
    ...base,
    id: '521438',
    number: '521438',
    placedAt: at(-24, '11:20'),
    lineItems: [
      item('khaki', 1799, track({ awb: '89892887852', status: 'delivered', placed: -24, outcome: -20 })),
      item('lime', 1799, track({ awb: '89892887853', status: 'delivered', placed: -24, outcome: -20 })),
      item('coal', 1699, track({ awb: '89892887854', status: 'delivered', placed: -24, outcome: -20 })),
    ],
  }),
  // COD, 6 lines, discount + shipping fee; one line returned and refunded.
  makeOrder({
    ...base,
    id: '521402',
    number: '521402',
    placedAt: at(-40, '16:02'),
    paymentMethod: 'cod',
    shippingAddress: addresses[1],
    discount: 300,
    shippingFee: 99,
    lineItems: [
      item('lime', 1799, track({ awb: '89892887890', status: 'delivered', placed: -40, outcome: -36 })),
      item('khaki', 1799, track({ awb: '89892887891', status: 'delivered', placed: -40, outcome: -36 })),
      item('coal', 1799, track({ awb: '89892887892', status: 'delivered', placed: -40, outcome: -36 })),
      item(
        'blush',
        1799,
        track({ awb: '89892887893', status: 'refunded', placed: -40, outcome: -36, ret: { requested: -34, pickup: -33, pickedUp: -33, refunded: -29, amount: 3598 } }),
        2,
      ),
      item('coal', 1699, track({ awb: '89892887894', status: 'delivered', placed: -40, outcome: -36 })),
      item('khaki', 1699, track({ awb: '89892887895', status: 'delivered', placed: -40, outcome: -36 })),
    ],
  }),
];

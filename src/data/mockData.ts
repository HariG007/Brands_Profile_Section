import coalBlack from '@/assets/images/product-coal-black.webp';
import blushPink from '@/assets/images/product-blush-pink.webp';
import khaki from '@/assets/images/product-khaki.webp';
import limeGreen from '@/assets/images/product-lime-green.webp';
import type {
  Address,
  Customer,
  LineItem,
  Order,
  Product,
  Shipment,
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

/* ---------------------------------------------------------------- tracking */

const ev = (id: string, title: string, lines: string[], occurredAt: string): TrackingEvent => ({
  id,
  title,
  lines,
  occurredAt,
});

const baseEvents = (awb: string): TrackingEvent[] => [
  ev(`${awb}-3`, 'PICKED UP', ['Booked', 'Location: WHITE FIELD BRANCH'], '2025-06-27T19:44:00+05:30'),
  ev(`${awb}-2`, 'ORDER SHIPPED', ['Pickup Scheduled', 'Location: WHITE FIELD BRANCH'], '2025-06-27T19:44:00+05:30'),
  ev(
    `${awb}-1`,
    'ORDER PLACED',
    ['We have successfully received your order!', 'Excitement is on the way!'],
    '2025-06-27T19:44:00+05:30',
  ),
];

const delivered = (awb: string): Shipment => ({
  awb,
  status: 'delivered',
  statusDate: '2025-06-30',
  events: baseEvents(awb),
});

const failed = (awb: string): Shipment => ({
  awb,
  status: 'failed',
  statusDate: '2025-06-30',
  failureReason: 'Customer Unavailable',
  events: baseEvents(awb),
});

const inTransit = (awb: string): Shipment => ({
  awb,
  status: 'in_transit',
  estimatedDelivery: '2025-06-29',
  events: baseEvents(awb),
});

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

export const orders: Order[] = [
  makeOrder({
    id: 'draft-1042',
    number: 'D1042',
    kind: 'draft',
    placedAt: '2025-05-20T10:12:00+05:30',
    draftSavedAt: '2025-05-20',
    resumeUrl: 'https://urturms.com/cart',
    paymentMethod: 'prepaid',
    paymentStatus: 'pending',
    shippingAddress: addresses[0],
    lineItems: [
      item('khaki', 1799, null),
      item('lime', 1799, null),
      item('coal', 1799, null),
      item('blush', 1799, null),
      item('khaki', 1799, null),
      item('coal', 1799, null),
    ],
  }),
  makeOrder({
    id: '521438',
    number: '521438',
    kind: 'placed',
    placedAt: '2025-06-24T11:20:00+05:30',
    paymentMethod: 'prepaid',
    paymentStatus: 'paid',
    shippingAddress: addresses[0],
    lineItems: [
      item('khaki', 1799, delivered('89892887862')),
      item('lime', 1799, delivered('89892887863')),
      item('coal', 1699, delivered('89892887864')),
    ],
  }),
  makeOrder({
    id: '521437',
    number: '521437',
    kind: 'placed',
    placedAt: '2025-06-24T09:05:00+05:30',
    paymentMethod: 'prepaid',
    paymentStatus: 'paid',
    shippingAddress: addresses[0],
    lineItems: [
      item('khaki', 1799, failed('89892887870')),
      item('lime', 1799, failed('89892887871')),
      item('coal', 1699, delivered('89892887872')),
    ],
  }),
  makeOrder({
    id: '521436',
    number: '521436',
    kind: 'placed',
    placedAt: '2025-06-24T08:40:00+05:30',
    paymentMethod: 'prepaid',
    paymentStatus: 'paid',
    shippingAddress: addresses[0],
    lineItems: [
      item('khaki', 1799, inTransit('89892887880')),
      item('lime', 1799, inTransit('89892887881')),
      item('coal', 1699, inTransit('89892887882')),
    ],
  }),
  makeOrder({
    id: '521402',
    number: '521402',
    kind: 'placed',
    placedAt: '2025-06-10T16:02:00+05:30',
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    shippingAddress: addresses[1],
    discount: 300,
    shippingFee: 99,
    lineItems: [
      item('lime', 1799, delivered('89892887890')),
      item('khaki', 1799, delivered('89892887891')),
      item('coal', 1799, delivered('89892887892')),
      item('blush', 1799, delivered('89892887893'), 2),
      item('coal', 1699, delivered('89892887894')),
      item('khaki', 1699, delivered('89892887895')),
    ],
  }),
];

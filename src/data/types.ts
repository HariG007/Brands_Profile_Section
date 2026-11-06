/**
 * Domain types for the account section. They intentionally mirror the shape of
 * the Shopify Customer Account API (customer, addresses, orders, fulfillments)
 * so the mock service can be swapped for real GraphQL calls without touching UI.
 */

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** E.164 formatted, e.g. +919714563909 */
  phone: string;
  /** ISO date (yyyy-mm-dd) */
  dateOfBirth: string;
  gender: Gender;
}

export type AddressLabel = 'home' | 'work' | 'other';

export interface Address {
  id: string;
  /** Recipient's full name */
  name: string;
  /** 10-digit Indian mobile number */
  phone: string;
  /** House / flat / building */
  line1: string;
  /** Area, street, landmark (optional) */
  line2: string;
  city: string;
  /** State / UT */
  province: string;
  /** 6-digit PIN code */
  zip: string;
  country: string;
  label: AddressLabel;
  isDefault: boolean;
}

export interface Product {
  id: string;
  title: string;
  variant: string;
  price: number;
  compareAtPrice: number;
  /** Campaign discount shown on the tag (merchant-set, not derived from MRP). */
  discountPercent?: number;
  image: string;
  url: string;
}

/**
 * Shipment (fulfillment) status for a line item, in journey order:
 * packed → in_transit → out_for_delivery → delivered | failed,
 * plus cancelled, and after delivery return_in_progress → refunded.
 */
export type ShipmentStatus =
  | 'packed'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'return_in_progress'
  | 'refunded';

/** Return request on a delivered item (Shopify: Return + reverse fulfillment). */
export interface ReturnInfo {
  /** ISO date-time */
  requestedAt: string;
  /** Courier pickup date. ISO date. */
  pickupDate: string;
  /** ISO date-time, once the courier has collected it. */
  pickedUpAt?: string;
  /** ISO date-time, once the refund has been issued. */
  refundedAt?: string;
  refundAmount: number;
}

export interface TrackingEvent {
  id: string;
  /** e.g. PICKED UP, ORDER SHIPPED, ORDER PLACED */
  title: string;
  /** Description lines shown under the title. */
  lines: string[];
  /** ISO date-time */
  occurredAt: string;
}

export interface Shipment {
  /** Courier AWB, assigned once the item is packed. */
  awb?: string;
  status: ShipmentStatus;
  /** Delivered (delivered/return/refunded), attempted (failed) or cancelled date. ISO date. */
  statusDate?: string;
  /** Estimated delivery date for in-transit shipments. ISO date. */
  estimatedDelivery?: string;
  failureReason?: string;
  return?: ReturnInfo;
  /** Latest event first. */
  events: TrackingEvent[];
}

export interface LineItem {
  id: string;
  title: string;
  variant: string;
  image: string;
  quantity: number;
  price: number;
  /** Null for draft orders (not fulfilled yet). */
  shipment: Shipment | null;
  /** 0 = not rated yet. */
  rating: number;
}

export interface OrderSummary {
  itemTotal: number;
  itemDiscount: number;
  subtotal: number;
  shipping: number;
  total: number;
}

export type PaymentMethod = 'prepaid' | 'cod';

export interface Order {
  id: string;
  /** Display number without the hash, e.g. 521438 */
  number: string;
  kind: 'placed' | 'draft';
  /** ISO date-time */
  placedAt: string;
  /** Draft orders only: when the cart was last saved. ISO date. */
  draftSavedAt?: string;
  /** Draft orders only: where the customer resumes editing / checkout. */
  resumeUrl?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending';
  shippingAddress: Address;
  lineItems: LineItem[];
  summary: OrderSummary;
}

/** Derived, order-level status used by the badges in "Overall Shipment Info". */
export type OverallStatus = ShipmentStatus | 'mixed' | 'draft';

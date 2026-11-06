/**
 * Account service — the single seam between UI and data.
 *
 * Today it serves in-memory mock data with realistic latency. To go live, swap
 * each function body for a Shopify Customer Account API call (GraphQL):
 *   getCustomer      -> query { customer { firstName lastName emailAddress phoneNumber … } }
 *   getAddresses     -> query { customer { addresses { nodes { … } } defaultAddress { id } } }
 *   getOrders        -> query { customer { orders(first: 20) { nodes { … fulfillments … } } } }
 *   updateCustomer   -> mutation customerUpdate(input: …)
 *   create/update/deleteAddress -> customerAddressCreate / customerAddressUpdate / customerAddressDelete
 *   setDefaultAddress           -> customerAddressUpdate(defaultAddress: true)
 *
 * QA helper: append `?state=loading | empty | error` to any account URL to
 * force that state for every request on the page.
 */
import { addresses, customer, newArrivals, orders } from './mockData';
import { formatOrderDate } from '@/lib/format';
import type { Address, Customer, LineItem, Order, Product } from './types';

type Scenario = 'normal' | 'loading' | 'empty' | 'error';

const LATENCY_MS = 450;

export type OtpChannel = 'email' | 'phone';
/** Mock one-time code accepted by verifyOtp (shown as a hint in the dialog). */
export const DEMO_OTP = '123456';

function scenario(): Scenario {
  if (typeof window === 'undefined') return 'normal';
  const s = new URLSearchParams(window.location.search).get('state');
  return s === 'loading' || s === 'empty' || s === 'error' ? s : 'normal';
}

/** Fired after any mutation that changes what the account sidebar shows. */
export const ACCOUNT_CHANGED = 'account:changed';
const notifyChanged = () => window.dispatchEvent(new Event(ACCOUNT_CHANGED));

export class ServiceError extends Error {
  constructor(message = 'Something went wrong while loading your account.') {
    super(message);
    this.name = 'ServiceError';
  }
}

function respond<T>(value: T, emptyValue: T): Promise<T> {
  const s = scenario();
  return new Promise((resolve, reject) => {
    if (s === 'loading') return; // never resolves — lets QA inspect skeletons
    setTimeout(() => {
      if (s === 'error') reject(new ServiceError());
      else resolve(structuredClone(s === 'empty' ? emptyValue : value));
    }, LATENCY_MS);
  });
}

/* In-memory store so edits survive navigation within the session. */
const store = {
  customer: structuredClone(customer),
  addresses: structuredClone(addresses),
  orders: structuredClone(orders),
};

export const accountService = {
  getCustomer(): Promise<Customer> {
    return respond(store.customer, store.customer);
  },

  async updateCustomer(patch: Partial<Customer>): Promise<Customer> {
    await new Promise((r) => setTimeout(r, LATENCY_MS));
    if (scenario() === 'error') throw new ServiceError('We could not save your profile. Please try again.');
    store.customer = { ...store.customer, ...patch };
    notifyChanged();
    return structuredClone(store.customer);
  },

  /**
   * Sends a one-time code to a new email or phone before it can be saved.
   * Live: Shopify Customer Account API verifies email changes itself; phone
   * changes go through your SMS/OTP provider (e.g. MSG91, Twilio Verify).
   */
  async sendOtp(channel: OtpChannel, target: string): Promise<void> {
    void target;
    void channel;
    await mutationDelay(500);
  },

  /** Mock: the code is always 123456. */
  async verifyOtp(channel: OtpChannel, target: string, code: string): Promise<void> {
    void target;
    void channel;
    await new Promise((r) => setTimeout(r, 400));
    if (code !== DEMO_OTP) throw new ServiceError('That code isn’t right. Check it and try again.');
  },

  getAddresses(): Promise<Address[]> {
    return respond(store.addresses, []);
  },

  /** customerAddressCreate (+ customerUpdate defaultAddress when isDefault) */
  async createAddress(draft: Omit<Address, 'id'>): Promise<Address[]> {
    await mutationDelay();
    const addr: Address = { ...draft, id: `addr-${Date.now()}` };
    // The first saved address is always the default.
    if (store.addresses.length === 0) addr.isDefault = true;
    if (addr.isDefault) store.addresses.forEach((a) => (a.isDefault = false));
    store.addresses.push(addr);
    notifyChanged();
    return structuredClone(store.addresses);
  },

  /** customerAddressUpdate */
  async updateAddress(id: string, draft: Omit<Address, 'id'>): Promise<Address[]> {
    await mutationDelay();
    const i = store.addresses.findIndex((a) => a.id === id);
    if (i < 0) throw new ServiceError('This address no longer exists.');
    const wasDefault = store.addresses[i].isDefault;
    // A default address can't be "un-defaulted" directly — another one must be chosen.
    const next = { ...draft, id, isDefault: wasDefault || draft.isDefault };
    if (next.isDefault) store.addresses.forEach((a) => (a.isDefault = false));
    store.addresses[i] = next;
    notifyChanged();
    return structuredClone(store.addresses);
  },

  /** customerAddressDelete. Returns the updated list and the removed address. */
  async deleteAddress(id: string): Promise<{ list: Address[]; removed: Address; index: number }> {
    await mutationDelay(300);
    const index = store.addresses.findIndex((a) => a.id === id);
    if (index < 0) throw new ServiceError('This address no longer exists.');
    const [removed] = store.addresses.splice(index, 1);
    // Promote the next address when the default is removed.
    if (removed.isDefault && store.addresses.length) store.addresses[0].isDefault = true;
    notifyChanged();
    return { list: structuredClone(store.addresses), removed: structuredClone(removed), index };
  },

  /** customerUpdate(defaultAddress) */
  async setDefaultAddress(id: string): Promise<Address[]> {
    await mutationDelay(300);
    store.addresses.forEach((a) => (a.isDefault = a.id === id));
    notifyChanged();
    return structuredClone(store.addresses);
  },

  getOrders(): Promise<Order[]> {
    return respond(store.orders, []);
  },

  async getOrder(orderId: string): Promise<Order | null> {
    const list = await respond(store.orders, []);
    return list.find((o) => o.id === orderId) ?? null;
  },

  getNewArrivals(): Promise<Product[]> {
    return respond(newArrivals, []);
  },

  async rateItem(orderId: string, itemId: string, rating: number): Promise<void> {
    await new Promise((r) => setTimeout(r, 250));
    const li = findItem(orderId, itemId);
    if (li) li.rating = rating;
  },

  async requestReattempt(orderId: string, itemId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 700));
    if (scenario() === 'error') throw new ServiceError('Reattempt request failed. Please try again.');
    void findItem(orderId, itemId);
  },

  /**
   * Starts a return for a delivered item and schedules the pickup for tomorrow.
   * Live: returnRequest(input: { orderId, returnLineItems }) on the Customer Account API.
   */
  async initiateReturn(orderId: string, itemId: string): Promise<Order | null> {
    await mutationDelay(600);
    const order = store.orders.find((o) => o.id === orderId);
    const li = order?.lineItems.find((l) => l.id === itemId);
    if (!order || !li?.shipment) throw new ServiceError('This item can’t be returned.');
    const now = new Date();
    const pickup = new Date(now);
    pickup.setDate(pickup.getDate() + 1);
    const pickupIso = `${pickup.getFullYear()}-${String(pickup.getMonth() + 1).padStart(2, '0')}-${String(pickup.getDate()).padStart(2, '0')}`;
    li.shipment.status = 'return_in_progress';
    li.shipment.return = { requestedAt: now.toISOString(), pickupDate: pickupIso, refundAmount: li.price * li.quantity };
    li.shipment.events.unshift(
      { id: `${li.id}-rpick-${now.getTime()}`, title: 'PICKUP SCHEDULED', lines: [`Courier will collect it on ${formatOrderDate(pickupIso)}`, 'Keep the item packed with its tags on'], occurredAt: now.toISOString() },
      { id: `${li.id}-rreq-${now.getTime()}`, title: 'RETURN REQUESTED', lines: ['Return request received'], occurredAt: now.toISOString() },
    );
    return structuredClone(order);
  },
};

async function mutationDelay(ms = LATENCY_MS) {
  await new Promise((r) => setTimeout(r, ms));
  if (scenario() === 'error') throw new ServiceError('We couldn’t save that change. Please try again.');
}

function findItem(orderId: string, itemId: string): LineItem | undefined {
  return store.orders.find((o) => o.id === orderId)?.lineItems.find((l) => l.id === itemId);
}

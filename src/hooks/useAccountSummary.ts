import { useCallback, useEffect, useState } from 'react';
import { ACCOUNT_CHANGED, accountService } from '@/data/accountService';
import type { Customer } from '@/data/types';

export interface AccountSummary {
  customer?: Customer;
  orders?: number;
  addresses?: number;
}

/**
 * Lightweight data for the account sidebar (name, email, counts).
 * Refreshes silently — keeping the last values on screen — whenever the profile
 * or addresses change, so cards and counts never flash back to a loading state.
 */
export function useAccountSummary(): AccountSummary {
  const [summary, setSummary] = useState<AccountSummary>({});

  const load = useCallback(async () => {
    const [customer, orders, addresses] = await Promise.allSettled([
      accountService.getCustomer(),
      accountService.getOrders(),
      accountService.getAddresses(),
    ]);
    setSummary((prev) => ({
      customer: customer.status === 'fulfilled' ? customer.value : prev.customer,
      orders: orders.status === 'fulfilled' ? orders.value.length : prev.orders,
      addresses: addresses.status === 'fulfilled' ? addresses.value.length : prev.addresses,
    }));
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener(ACCOUNT_CHANGED, load);
    return () => window.removeEventListener(ACCOUNT_CHANGED, load);
  }, [load]);

  return summary;
}

export const initials = (c?: Customer) =>
  c ? `${c.firstName[0] ?? ''}${c.lastName[0] ?? ''}`.toUpperCase() : '';

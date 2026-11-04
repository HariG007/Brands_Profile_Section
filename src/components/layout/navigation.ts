import type { IconName } from '@/components/ui/Icon';

export interface AccountNavItem {
  key: string;
  label: string;
  /** Title used in the mobile bottom bar: "User Account / My Profile" */
  pageTitle: string;
  to: string;
  icon: IconName;
  activeIcon: IconName;
}

export const STOREFRONT_URL = 'https://urturms.com';

export const accountNav: AccountNavItem[] = [
  { key: 'orders', label: 'Orders', pageTitle: 'My Orders', to: '/account/orders', icon: 'package-2', activeIcon: 'package-2-active' },
  { key: 'profile', label: 'Profile', pageTitle: 'My Profile', to: '/account/profile', icon: 'account-circle-muted', activeIcon: 'account-circle' },
  { key: 'address', label: 'Address', pageTitle: 'My Address', to: '/account/addresses', icon: 'globe-location-pin', activeIcon: 'globe-location-pin-active' },
  { key: 'chat', label: 'Chat with us', pageTitle: 'Chat with us', to: '/account/chat', icon: 'chat-paste-go', activeIcon: 'chat-paste-go-active' },
  { key: 'faqs', label: 'FAQs', pageTitle: 'FAQs', to: '/account/faqs', icon: 'help', activeIcon: 'help-active' },
];

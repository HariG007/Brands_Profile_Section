import type { Address, AddressLabel } from '@/data/types';

/** Single-line address used on cards and order pages. */
export function formatAddress(a: Pick<Address, 'line1' | 'line2' | 'city' | 'province' | 'zip' | 'country'>) {
  const parts = [a.line1, a.line2, a.city, a.province && a.zip ? `${a.province} - ${a.zip}` : a.province || a.zip, a.country];
  return parts.map((p) => p?.trim()).filter(Boolean).join(', ');
}

export const ADDRESS_LABELS: { value: AddressLabel; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
];

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export type AddressDraft = Omit<Address, 'id'>;

export const emptyAddress = (isDefault: boolean): AddressDraft => ({
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  province: '',
  zip: '',
  country: 'India',
  label: 'home',
  isDefault,
});

export type AddressErrors = Partial<Record<keyof AddressDraft, string>>;

export function validateAddress(a: AddressDraft): AddressErrors {
  const e: AddressErrors = {};
  const name = a.name.trim();
  if (!name) e.name = 'Full name is required';
  else if (!/^[\p{L}][\p{L} .'-]{1,59}$/u.test(name)) e.name = 'Use letters only (2–60 characters)';
  const phone = a.phone.replace(/\D/g, '');
  if (!phone) e.phone = 'Mobile number is required';
  else if (!/^[6-9]\d{9}$/.test(phone)) e.phone = 'Enter a valid 10-digit mobile number';
  if (!a.line1.trim()) e.line1 = 'House / flat / building is required';
  else if (a.line1.trim().length < 5) e.line1 = 'Add a few more details';
  if (!a.city.trim()) e.city = 'City is required';
  if (!a.province) e.province = 'Select a state';
  if (!a.zip.trim()) e.zip = 'PIN code is required';
  else if (!/^[1-9]\d{5}$/.test(a.zip.trim())) e.zip = 'Enter a valid 6-digit PIN code';
  return e;
}

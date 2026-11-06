/**
 * Address helpers: PIN-code → city/state, and device location → address.
 *
 * Both use free public endpoints with a short timeout. PIN lookups fall back to
 * the PIN's postal-circle prefix so the state still fills in when offline.
 * Swap for your own geo service (or Shopify's address autocomplete) in production.
 */
import { INDIAN_STATES } from '@/lib/address';

export interface PlaceGuess {
  city?: string;
  province?: string;
  zip?: string;
  line2?: string;
}

const TIMEOUT_MS = 4000;

async function getJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(t);
  }
}

/** Map an API state name onto our select's list ("Delhi" vs "NCT of Delhi", etc.). */
export function matchState(name?: string) {
  if (!name) return undefined;
  const n = name.toLowerCase().replace(/^nct of /, '').replace(/&/g, 'and').trim();
  return INDIAN_STATES.find((s) => s.toLowerCase() === n) ?? INDIAN_STATES.find((s) => n.includes(s.toLowerCase()));
}

/** First 2–3 digits of an Indian PIN identify the postal circle (state). */
const PREFIX_STATE: [RegExp, string][] = [
  [/^11/, 'Delhi'], [/^1(2|3[0-6])/, 'Haryana'], [/^160/, 'Chandigarh'], [/^1(4|5|6)/, 'Punjab'],
  [/^17/, 'Himachal Pradesh'], [/^194/, 'Ladakh'], [/^1(8|9)/, 'Jammu and Kashmir'], [/^24[6-9]|^26[23]/, 'Uttarakhand'],
  [/^2[0-8]/, 'Uttar Pradesh'], [/^3[0-4]/, 'Rajasthan'], [/^396/, 'Dadra and Nagar Haveli and Daman and Diu'], [/^3[6-9]/, 'Gujarat'],
  [/^403/, 'Goa'], [/^4[0-4]/, 'Maharashtra'], [/^49/, 'Chhattisgarh'], [/^4[5-8]/, 'Madhya Pradesh'],
  [/^50/, 'Telangana'], [/^5[1-3]/, 'Andhra Pradesh'], [/^5[6-9]/, 'Karnataka'], [/^605/, 'Puducherry'],
  [/^6[0-4]/, 'Tamil Nadu'], [/^6825[5-9]/, 'Lakshadweep'], [/^6(7|8|9)/, 'Kerala'], [/^744/, 'Andaman and Nicobar Islands'],
  [/^737/, 'Sikkim'], [/^7[0-4]/, 'West Bengal'], [/^7[5-7]/, 'Odisha'], [/^78/, 'Assam'], [/^79[0-2]/, 'Arunachal Pradesh'],
  [/^793/, 'Meghalaya'], [/^795/, 'Manipur'], [/^796/, 'Mizoram'], [/^797/, 'Nagaland'], [/^799/, 'Tripura'],
  [/^8(1|2[0-9]|3[0-5])/, 'Jharkhand'], [/^8[0-5]/, 'Bihar'],
];

interface PostOffice { District: string; State: string }

/** Returns city + state for a 6-digit PIN, or null if the PIN doesn't exist. */
export async function lookupPincode(pin: string): Promise<PlaceGuess | null> {
  try {
    const [r] = await getJson<{ Status: string; PostOffice: PostOffice[] | null }[]>(`https://api.postalpincode.in/pincode/${pin}`);
    if (r?.Status === 'Success' && r.PostOffice?.length) {
      const po = r.PostOffice[0];
      return { city: po.District, province: matchState(po.State) };
    }
    if (r?.Status === 'Error') return null;
  } catch {
    /* offline / blocked: fall through to the prefix map */
  }
  const province = PREFIX_STATE.find(([re]) => re.test(pin))?.[1];
  return province ? { province } : null;
}

interface NominatimAddress {
  postcode?: string; city?: string; town?: string; village?: string; state_district?: string; county?: string;
  state?: string; suburb?: string; neighbourhood?: string; road?: string;
}

export type LocateError = 'denied' | 'unavailable' | 'unsupported';

/** Device location → address fields (OpenStreetMap reverse geocoding). */
export function locateAddress(): Promise<PlaceGuess> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject('unsupported' satisfies LocateError);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await getJson<{ address?: NominatimAddress }>(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${coords.latitude}&lon=${coords.longitude}`,
          );
          const a = r.address ?? {};
          resolve({
            zip: a.postcode?.replace(/\D/g, '').slice(0, 6),
            city: a.city ?? a.town ?? a.state_district ?? a.county ?? a.village,
            province: matchState(a.state),
            line2: [a.road, a.neighbourhood ?? a.suburb].filter(Boolean).join(', '),
          });
        } catch {
          reject('unavailable' satisfies LocateError);
        }
      },
      (err) => reject((err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable') satisfies LocateError),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

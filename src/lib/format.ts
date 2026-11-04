const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Rs. 1,799.00 */
export const formatRs = (amount: number) => `Rs. ${inr.format(amount)}`;

/** -Rs. 0.00 */
export const formatDiscount = (amount: number) => `-Rs. ${inr.format(amount)}`;

/** ₹400 (catalog price style) */
export const formatRupee = (amount: number) => `₹${inrWhole.format(amount)}`;

const parse = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Jun 24, 2025 */
export const formatLongDate = (iso: string) => {
  const d = parse(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/** Tue, 24 Jun */
export const formatOrderDate = (iso: string) => {
  const d = parse(iso);
  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

/** 30 Jun, 2025 */
export const formatStatusDate = (iso: string) => {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`;
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

/** 29th Jun */
export const formatEta = (iso: string) => {
  const d = parse(iso);
  return `${ordinal(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`;
};

/** 20/05/25 */
export const formatShortDate = (iso: string) => {
  const d = parse(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
};

/** 19:44:00 on Sat, 27 June, 2025 */
export const formatEventTime = (iso: string) => {
  const d = parse(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} on ${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}, ${d.getFullYear()}`;
};

/** ISO yyyy-mm-dd <-> dd/mm/yyyy for the DOB field */
export const isoToDisplayDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

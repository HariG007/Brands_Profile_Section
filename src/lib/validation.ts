export const validators = {
  name(v: string, label: string) {
    const t = v.trim();
    if (!t) return `${label} is required`;
    if (t.length > 40) return `${label} must be 40 characters or fewer`;
    if (!/^[\p{L}][\p{L} .'-]*$/u.test(t)) return `${label} can only contain letters, spaces and . ' -`;
    return undefined;
  },
  email(v: string) {
    const t = v.trim();
    if (!t) return 'Email ID is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return 'Enter a valid email address';
    return undefined;
  },
  phone(v: string) {
    const digits = v.replace(/[^\d]/g, '');
    const local = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
    if (!digits) return 'Phone number is required';
    if (!/^[6-9]\d{9}$/.test(local)) return 'Enter a valid 10-digit Indian mobile number';
    return undefined;
  },
  dob(v: string) {
    if (!v.trim()) return undefined; // optional
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim());
    if (!m) return 'Use the format DD/MM/YYYY';
    const [, dd, mm, yyyy] = m.map(Number) as unknown as [number, number, number, number];
    const d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return 'Enter a real date';
    const today = new Date();
    if (d > today) return 'Date of birth can’t be in the future';
    const age = today.getFullYear() - yyyy - (today < new Date(today.getFullYear(), mm - 1, dd) ? 1 : 0);
    if (age < 13) return 'You must be at least 13 years old';
    if (yyyy < 1900) return 'Enter a valid year';
    return undefined;
  },
};

/** "+91 97145 63909" | "9714563909" -> "+919714563909" */
export function normalisePhone(v: string) {
  const digits = v.replace(/[^\d]/g, '');
  const local = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  return `+91${local}`;
}

/** Auto-insert slashes while typing a DD/MM/YYYY date. */
export function maskDate(v: string) {
  const d = v.replace(/[^\d]/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export const displayToIso = (v: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

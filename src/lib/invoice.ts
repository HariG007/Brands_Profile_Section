import type { Order } from '@/data/types';
import { formatAddress } from './address';
import { formatLongDate } from './format';

/**
 * Builds a one-page tax-invoice PDF in the browser (no library: plain PDF
 * text objects in Helvetica). Live: download the invoice your Shopify invoice
 * app generates (e.g. via an order metafield URL) instead.
 */

const money = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** PDF strings: escape \ ( ) and keep to Latin-1. */
const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\xff]/g, (c) => (c === '’' ? "'" : c === '–' ? '-' : '?'));

interface Text {
  x: number;
  y: number;
  s: string;
  size?: number;
  bold?: boolean;
  /** Right-align at x. */
  right?: boolean;
  grey?: boolean;
}

// Helvetica average glyph widths (per 1000 em) — good enough to right-align numbers.
const W: Record<string, number> = { ' ': 278, '.': 278, ',': 278, '-': 333, R: 722, s: 500 };
const width = (s: string, size: number) => [...s].reduce((w, c) => w + (W[c] ?? (/\d/.test(c) ? 556 : 560)), 0) * (size / 1000);

export function buildInvoicePdf(order: Order): Blob {
  const texts: Text[] = [];
  const lines: [number, number, number, number][] = [];
  const t = (x: number, y: number, s: string, o: Partial<Text> = {}) => texts.push({ x, y, s, ...o });
  const L = 48;
  const R = 547;
  let y = 790;

  t(L, y, 'TURMS', { size: 20, bold: true });
  t(R, y, 'TAX INVOICE', { size: 12, bold: true, right: true });
  y -= 16;
  t(L, y, 'Intelligent Apparel  |  urturms.com', { size: 9, grey: true });
  t(R, y, `Invoice No: INV-${order.number}`, { size: 9, right: true });
  y -= 13;
  t(R, y, `Order: #${order.number}   Date: ${formatLongDate(order.placedAt)}`, { size: 9, right: true });
  y -= 20;
  lines.push([L, y, R, y]);

  y -= 22;
  const a = order.shippingAddress;
  t(L, y, 'BILL TO / SHIP TO', { size: 8, bold: true, grey: true });
  t(330, y, 'PAYMENT', { size: 8, bold: true, grey: true });
  y -= 14;
  t(L, y, a.name, { size: 10, bold: true });
  t(330, y, order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid', { size: 10 });
  y -= 13;
  t(L, y, `+91 ${a.phone}`, { size: 9 });
  t(330, y, order.paymentStatus === 'paid' ? 'Paid' : 'Pending', { size: 9 });
  // Wrap the address to ~60 chars per line.
  const words = formatAddress(a).split(' ');
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 60) {
      y -= 12;
      t(L, y, cur.trim(), { size: 9 });
      cur = '';
    }
    cur += ` ${w}`;
  }
  if (cur.trim()) {
    y -= 12;
    t(L, y, cur.trim(), { size: 9 });
  }

  y -= 28;
  const cQty = 360;
  const cRate = 450;
  t(L, y, 'ITEM', { size: 8, bold: true, grey: true });
  t(cQty, y, 'QTY', { size: 8, bold: true, grey: true, right: true });
  t(cRate, y, 'RATE', { size: 8, bold: true, grey: true, right: true });
  t(R, y, 'AMOUNT', { size: 8, bold: true, grey: true, right: true });
  y -= 8;
  lines.push([L, y, R, y]);
  for (const li of order.lineItems) {
    y -= 18;
    t(L, y, `${li.title} (${li.variant})`, { size: 9 });
    t(cQty, y, String(li.quantity), { size: 9, right: true });
    t(cRate, y, money(li.price), { size: 9, right: true });
    t(R, y, money(li.price * li.quantity), { size: 9, right: true });
  }
  y -= 12;
  lines.push([L, y, R, y]);

  const sm = order.summary;
  const row = (label: string, value: string, bold = false) => {
    y -= 16;
    t(cRate, y, label, { size: bold ? 10 : 9, bold, right: true });
    t(R, y, value, { size: bold ? 10 : 9, bold, right: true });
  };
  row('Item Total', money(sm.itemTotal));
  row('Discount', `-${money(sm.itemDiscount)}`);
  row('Shipping', money(sm.shipping));
  y -= 4;
  lines.push([330, y - 4, R, y - 4]);
  row('Order Total', money(sm.total), true);
  y -= 12;
  t(R, y, 'Prices include GST', { size: 8, grey: true, right: true });

  t(L, 60, 'Thank you for shopping with TURMS. This is a computer-generated invoice and needs no signature.', { size: 8, grey: true });

  // ---- serialise
  const content = [
    ...lines.map(([x1, y1, x2, y2]) => `0.85 0.87 0.88 RG 0.6 w ${x1} ${y1} m ${x2} ${y2} l S`),
    ...texts.map((o) => {
      const size = o.size ?? 10;
      const x = o.right ? o.x - width(o.s, size) : o.x;
      const col = o.grey ? '0.47 0.56 0.61 rg' : '0.15 0.15 0.15 rg';
      return `BT ${col} /${o.bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(1)} ${o.y} Td (${esc(o.s)}) Tj ET`;
    }),
  ].join('\n');

  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // Latin-1 bytes so offsets match.
  const bytes = Uint8Array.from(pdf, (c) => c.charCodeAt(0) & 0xff);
  return new Blob([bytes], { type: 'application/pdf' });
}

export function downloadInvoice(order: Order) {
  const url = URL.createObjectURL(buildInvoicePdf(order));
  const a = document.createElement('a');
  a.href = url;
  a.download = `TURMS-Invoice-${order.number}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

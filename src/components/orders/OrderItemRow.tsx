import { Link } from 'react-router-dom';
import type { LineItem } from '@/data/types';
import { Badge, QtyChip } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatRs } from '@/lib/format';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/status';
import s from './OrderItemRow.module.css';

interface Props {
  item: LineItem;
  /** Navigate to the shipment page when provided. */
  to?: string;
  /** Flat variant used inside the Order Detail panel (no card chrome). */
  plain?: boolean;
}

export function OrderItemRow({ item, to, plain }: Props) {
  const status = item.shipment?.status;
  const body = (
    <>
      <div className={s.main}>
        <img className={s.thumb} src={item.image} alt="" width={50} height={50} loading="lazy" />
        <div className={s.info}>
          <div className={s.line}>
            <p className={s.name} title={item.title}>
              {item.title}
              <span className="visually-hidden">, {item.variant}</span>
            </p>
            <span className={s.desktopQty}>
              <QtyChip quantity={item.quantity} />
            </span>
          </div>
          <span className={s.mobileQty}>
            <QtyChip quantity={item.quantity} />
          </span>
          <div className={s.line}>
            <p className={s.price}>{formatRs(item.price)}</p>
            {status && <Badge tone={STATUS_TONE[status]}>Status: {STATUS_LABEL[status]}</Badge>}
          </div>
        </div>
      </div>
      {to && <Icon name="chevron-down" size={16} rotate={-90} className={s.chev} />}
    </>
  );

  const cls = [s.row, plain && s.plain].filter(Boolean).join(' ');
  return to ? (
    <Link to={to} className={cls} aria-label={`${item.title}, ${formatRs(item.price)}${status ? `, ${STATUS_LABEL[status]}` : ''} — view tracking`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

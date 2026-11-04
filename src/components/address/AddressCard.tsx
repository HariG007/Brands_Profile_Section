import type { Address } from '@/data/types';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { ADDRESS_LABELS, formatAddress } from '@/lib/address';
import s from './AddressCard.module.css';

interface Props {
  address: Address;
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMakeDefault: () => void;
}

export function AddressCard({ address, busy, onEdit, onDelete, onMakeDefault }: Props) {
  const label = ADDRESS_LABELS.find((l) => l.value === address.label)?.label;
  const short = `${address.label === 'other' ? 'address' : `${label} address`} for ${address.name}`;
  return (
    <article
      className={[s.card, busy && s.busy].filter(Boolean).join(' ')}
      aria-label={address.isDefault ? `Default ${short}` : short}
      aria-busy={busy || undefined}
    >
      <div className={s.head}>
        <div className={s.row}>
          <p className={s.line}>
            <Icon name="id-card" size={16} />
            <span>Name: {address.name}</span>
          </p>
          <span className={s.badges}>
            {label && <Badge tone="neutral">{label}</Badge>}
            {address.isDefault && <Badge tone="brand">Default</Badge>}
          </span>
        </div>
        <p className={s.line}>
          <Icon name="call" size={16} />
          <span>
            Phone No: <a href={`tel:+91${address.phone}`}>{address.phone}</a>
          </span>
        </p>
      </div>
      <p className={s.address}>{formatAddress(address)}</p>

      <div className={s.actions}>
        <button type="button" className={s.action} onClick={onEdit} aria-label={`Edit ${short}`}>
          <Icon name="edit-muted" size={16} />
          Edit
        </button>
        <button type="button" className={`${s.action} ${s.danger}`} onClick={onDelete} aria-label={`Remove ${short}`}>
          <Icon name="delete" size={16} />
          Remove
        </button>
        {address.isDefault ? (
          <span className={s.defaultNote}>Used at checkout by default</span>
        ) : (
          <button type="button" className={`${s.action} ${s.push}`} onClick={onMakeDefault} aria-label={`Make ${short} the default`}>
            <Icon name="star-check" size={16} />
            Set as Default
          </button>
        )}
      </div>
    </article>
  );
}

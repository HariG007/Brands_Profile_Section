import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Address } from '@/data/types';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import {
  ADDRESS_LABELS,
  emptyAddress,
  INDIAN_STATES,
  validateAddress,
  type AddressDraft,
} from '@/lib/address';
import s from './AddressFormModal.module.css';

interface Props {
  open: boolean;
  /** Address being edited; null = add a new one. */
  address: Address | null;
  /** True when the customer has no addresses yet (new one becomes default). */
  isFirst: boolean;
  onClose: () => void;
  onSubmit: (draft: AddressDraft) => Promise<void>;
}

const FORM_ID = 'address-form';
const toDraft = ({ id: _id, ...rest }: Address): AddressDraft => (void _id, rest);

export function AddressFormModal({ open, address, isFirst, onClose, onSubmit }: Props) {
  const initial = useMemo(() => (address ? toDraft(address) : emptyAddress(isFirst)), [address, isFirst]);
  const [draft, setDraft] = useState<AddressDraft>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof AddressDraft, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Reset every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setDraft(initial);
    setTouched({});
    setSubmitted(false);
    setFormError(null);
  }, [open, initial]);

  const errors = validateAddress(draft);
  const show = (k: keyof AddressDraft) => (touched[k] || submitted ? errors[k] : undefined);
  const dirty = (Object.keys(draft) as (keyof AddressDraft)[]).some((k) => draft[k] !== initial[k]);
  const set = <K extends keyof AddressDraft>(k: K, v: AddressDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const blur = (k: keyof AddressDraft) => () => setTouched((t) => ({ ...t, [k]: true }));

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) {
      // Move focus to the first invalid field.
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${FORM_ID} [aria-invalid="true"]`)?.focus());
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        ...draft,
        name: draft.name.trim(),
        phone: draft.phone.replace(/\D/g, ''),
        line1: draft.line1.trim(),
        line2: draft.line2.trim(),
        city: draft.city.trim(),
        zip: draft.zip.trim(),
      });
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const editingDefault = !!address?.isDefault;

  return (
    <>
      <Modal
        open={open}
        size="md"
        title={address ? 'Edit Address' : 'Add New Address'}
        description={address ? 'Changes apply to future orders only.' : 'We’ll use this for delivery at checkout.'}
        onClose={requestClose}
        actions={
          <>
            <Button variant="outline" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} loading={saving}>
              {address ? 'Save Changes' : 'Save Address'}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} className={s.form} onSubmit={submit} noValidate>
          {formError && (
            <p className={`${s.formError} ${s.full}`} role="alert">
              {formError}
            </p>
          )}
          <TextField
            className={s.mFull}
            label="Full Name"
            required
            autoComplete="name"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={blur('name')}
            error={show('name')}
            maxLength={60}
          />
          <TextField
            className={s.mFull}
            label="Mobile Number"
            required
            prefix="+91"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={draft.phone}
            onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            onBlur={blur('phone')}
            error={show('phone')}
          />
          <TextField
            className={s.full}
            label="Flat, House no., Building, Society"
            required
            autoComplete="address-line1"
            value={draft.line1}
            onChange={(e) => set('line1', e.target.value)}
            onBlur={blur('line1')}
            error={show('line1')}
            maxLength={120}
          />
          <TextField
            className={s.full}
            label="Area, Street, Landmark (optional)"
            autoComplete="address-line2"
            value={draft.line2}
            onChange={(e) => set('line2', e.target.value)}
            maxLength={120}
          />
          <TextField
            label="PIN Code"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            value={draft.zip}
            onChange={(e) => set('zip', e.target.value.replace(/\D/g, '').slice(0, 6))}
            onBlur={blur('zip')}
            error={show('zip')}
          />
          <TextField
            label="City"
            required
            autoComplete="address-level2"
            value={draft.city}
            onChange={(e) => set('city', e.target.value)}
            onBlur={blur('city')}
            error={show('city')}
            maxLength={60}
          />
          <SelectField
            label="State"
            required
            autoComplete="address-level1"
            value={draft.province}
            onChange={(e) => set('province', e.target.value)}
            onBlur={blur('province')}
            error={show('province')}
            options={[{ value: '', label: 'Select state' }, ...INDIAN_STATES.map((st) => ({ value: st, label: st }))]}
          />
          <TextField label="Country" value={draft.country} disabled readOnly />

          <fieldset className={s.full} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className={s.groupLabel}>Save address as</legend>
            <div className={s.pills}>
              {ADDRESS_LABELS.map((l) => (
                <label key={l.value} className={s.pill}>
                  <input
                    type="radio"
                    name="address-label"
                    value={l.value}
                    checked={draft.label === l.value}
                    onChange={() => set('label', l.value)}
                  />
                  {l.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={s.full}>
            {editingDefault || isFirst ? (
              <p className={s.note}>
                <Icon name="star-check" size={16} />
                {editingDefault ? 'This is your default address.' : 'Your first address will be set as default.'}
              </p>
            ) : (
              <label className={s.check}>
                <input type="checkbox" checked={draft.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
                Make this my default address
              </label>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmDiscard}
        title="Discard changes?"
        onClose={() => setConfirmDiscard(false)}
        actions={
          <>
            <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
              Keep editing
            </Button>
            <Button
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              Discard
            </Button>
          </>
        }
      >
        The address details you entered won’t be saved.
      </Modal>
    </>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useBlocker } from 'react-router-dom';
import { accountService } from '@/data/accountService';
import type { Customer, Gender } from '@/data/types';
import { useAsync } from '@/hooks/useAsync';
import { isoToDisplayDate } from '@/lib/format';
import { displayToIso, maskDate, normalisePhone, validators } from '@/lib/validation';
import { NewArrivals } from '@/components/product/NewArrivals';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, SectionTab, Skeleton } from '@/components/ui/Surface';
import { useToast } from '@/components/ui/Toast';
import s from './Page.module.css';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: Gender;
}
type Errors = Partial<Record<keyof FormValues, string>>;

const toForm = (c: Customer): FormValues => ({
  firstName: c.firstName,
  lastName: c.lastName,
  email: c.email,
  phone: c.phone,
  dob: isoToDisplayDate(c.dateOfBirth),
  gender: c.gender,
});

function validate(v: FormValues): Errors {
  return {
    firstName: validators.name(v.firstName, 'First name'),
    lastName: validators.name(v.lastName, 'Last name'),
    email: validators.email(v.email),
    phone: validators.phone(v.phone),
    dob: validators.dob(v.dob),
  };
}

function ProfileSkeleton() {
  return (
    <div className={s.formGrid} aria-busy="true" aria-label="Loading profile">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width={80} height={12} />
          <Skeleton height={36} />
        </div>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const res = useAsync(() => accountService.getCustomer(), []);
  const toast = useToast();
  const [values, setValues] = useState<FormValues | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (res.status === 'success') setValues(toForm(res.data));
  }, [res.status, res.data]);

  const initial = useMemo(() => (res.status === 'success' ? toForm(res.data) : null), [res.status, res.data]);
  const dirty = !!values && !!initial && (Object.keys(values) as (keyof FormValues)[]).some((k) => values[k] !== initial[k]);
  const errors = values ? validate(values) : {};
  const hasErrors = Object.values(errors).some(Boolean);
  const show = (k: keyof FormValues) => (touched[k] || submitted ? errors[k] : undefined);

  // Guard unsaved edits on in-app navigation and tab close.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) => setValues((cur) => (cur ? { ...cur, [k]: v } : cur));
  const blur = (k: keyof FormValues) => () => setTouched((t) => ({ ...t, [k]: true }));

  const reset = () => {
    if (initial) setValues(initial);
    setTouched({});
    setSubmitted(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!values || hasErrors) return;
    setSaving(true);
    try {
      const updated = await accountService.updateCustomer({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: normalisePhone(values.phone),
        dateOfBirth: displayToIso(values.dob),
        gender: values.gender,
      });
      res.setData(updated);
      setTouched({});
      setSubmitted(false);
      toast('Profile updated successfully', 'success');
    } catch (err) {
      toast((err as Error).message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.stack24}>
      <SectionTab>My Profile</SectionTab>

      {res.status === 'loading' || (res.status === 'success' && !values) ? (
        <ProfileSkeleton />
      ) : res.status === 'error' ? (
        <ErrorState message={res.error.message} onRetry={res.retry} />
      ) : (
        values && (
          <form className={s.stack} onSubmit={onSubmit} noValidate aria-label="Profile details">
            <div className={s.formGrid}>
              <TextField
                label="First Name"
                name="given-name"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                onBlur={blur('firstName')}
                error={show('firstName')}
                maxLength={40}
              />
              <TextField
                label="Last Name"
                name="family-name"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                onBlur={blur('lastName')}
                error={show('lastName')}
                maxLength={40}
              />
              <TextField
                label="Email ID"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
                onBlur={blur('email')}
                error={show('email')}
              />
              <TextField
                label="Phone Number"
                type="tel"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                value={values.phone}
                onChange={(e) => set('phone', e.target.value.replace(/[^\d+\s]/g, ''))}
                onBlur={blur('phone')}
                error={show('phone')}
                maxLength={16}
              />
              <TextField
                label="Date of Birth"
                name="bday"
                autoComplete="bday"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                value={values.dob}
                onChange={(e) => set('dob', maskDate(e.target.value))}
                onBlur={blur('dob')}
                error={show('dob')}
              />
              <SelectField
                label="Gender"
                name="sex"
                value={values.gender}
                onChange={(e) => set('gender', e.target.value as Gender)}
                options={GENDERS}
              />
            </div>

            {dirty && (
              <div className={s.actions}>
                <span className={s.actionsNote}>You have unsaved changes</span>
                <Button variant="outline" onClick={reset} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        )
      )}

      <hr className={s.divider} />
      <NewArrivals />

      <Modal
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        onClose={() => blocker.reset?.()}
        actions={
          <>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              Keep editing
            </Button>
            <Button onClick={() => blocker.proceed?.()}>Discard</Button>
          </>
        }
      >
        Your profile edits haven’t been saved yet.
      </Modal>
    </div>
  );
}

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
import { Icon } from '@/components/ui/Icon';
import { OtpModal } from '@/components/profile/OtpModal';
import type { OtpChannel } from '@/data/accountService';
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
  /** Contact changes still waiting for a one-time code, in order (phone first). */
  const [pendingOtp, setPendingOtp] = useState<{ channel: OtpChannel; target: string }[]>([]);
  /** Brief "All changes saved" confirmation after a successful save. */
  const [justSaved, setJustSaved] = useState(false);

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

  useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 3500);
    return () => window.clearTimeout(t);
  }, [justSaved]);
  useEffect(() => {
    if (dirty) setJustSaved(false);
  }, [dirty]);

  const phoneChanged = !!values && !!initial && normalisePhone(values.phone) !== normalisePhone(initial.phone);
  const emailChanged = !!values && !!initial && values.email.trim().toLowerCase() !== initial.email.trim().toLowerCase();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!values || hasErrors) return;
    // New sign-in / delivery contacts must be confirmed with a one-time code first.
    const queue: { channel: OtpChannel; target: string }[] = [];
    if (phoneChanged) queue.push({ channel: 'phone', target: normalisePhone(values.phone) });
    if (emailChanged) queue.push({ channel: 'email', target: values.email.trim().toLowerCase() });
    if (queue.length) setPendingOtp(queue);
    else void save();
  };

  const onOtpVerified = () => {
    const rest = pendingOtp.slice(1);
    setPendingOtp(rest);
    if (!rest.length) void save();
  };

  const save = async () => {
    if (!values) return;
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
      setJustSaved(true);
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
                hint={emailChanged && !show('email') ? 'We’ll send a code to verify this email' : undefined}
                suffix={!emailChanged && <Verified />}
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
                hint={phoneChanged && !show('phone') ? 'Used to sign in and for delivery updates. We’ll verify it with a code.' : undefined}
                suffix={!phoneChanged && <Verified />}
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
                hint="Add your birthday to get a special offer every year"
              />
              <SelectField
                label="Gender"
                name="sex"
                value={values.gender}
                onChange={(e) => set('gender', e.target.value as Gender)}
                options={GENDERS}
              />
            </div>

            {dirty ? (
              <div className={s.actions}>
                <span className={s.actionsNote}>You have unsaved changes</span>
                <Button variant="outline" onClick={reset} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
              </div>
            ) : (
              <p className={`${s.savedNote} ${justSaved ? s.savedNoteOn : ''}`} role="status" aria-live="polite">
                {justSaved && (
                  <>
                    <Icon name="check-circle" size={16} />
                    All changes saved
                  </>
                )}
              </p>
            )}
          </form>
        )
      )}

      <hr className={s.divider} />
      <NewArrivals />

      <OtpModal request={pendingOtp[0] ?? null} onVerified={onOtpVerified} onCancel={() => setPendingOtp([])} />

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

/** Small green tick inside a field whose value has been verified. */
function Verified() {
  return (
    <span className={s.verified} title="Verified">
      <Icon name="check-circle" size={16} label="Verified" />
    </span>
  );
}

import { useEffect, useRef, useState } from 'react';
import { accountService, DEMO_OTP, type OtpChannel } from '@/data/accountService';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import s from './OtpModal.module.css';

const RESEND_AFTER = 30;

interface Props {
  /** What is being verified; null keeps the dialog closed. */
  request: { channel: OtpChannel; target: string } | null;
  onVerified: () => void;
  onCancel: () => void;
}

/** "+919714563909" -> "+91 97145 63909" */
const prettyPhone = (e164: string) => {
  const d = e164.replace(/^\+91/, '');
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
};

/**
 * One-time-code check before a new email or phone number is saved.
 * Sends the code when it opens, auto-verifies on the 6th digit, and allows a
 * resend after 30 s.
 */
export function OtpModal({ request, onVerified, onCancel }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [wait, setWait] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const key = request ? `${request.channel}:${request.target}` : '';

  const send = async () => {
    if (!request) return;
    setSending(true);
    setError(undefined);
    try {
      await accountService.sendOtp(request.channel, request.target);
      setWait(RESEND_AFTER);
      input.current?.focus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  // Fresh state + a new code whenever a different target is opened.
  useEffect(() => {
    if (!key) return;
    setCode('');
    setError(undefined);
    void send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const verify = async (value = code) => {
    if (!request || verifying) return;
    if (!/^\d{6}$/.test(value)) {
      setError('Enter the 6-digit code');
      input.current?.focus();
      return;
    }
    setVerifying(true);
    setError(undefined);
    try {
      await accountService.verifyOtp(request.channel, request.target, value);
      onVerified();
    } catch (e) {
      setError((e as Error).message);
      setCode('');
      input.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const isPhone = request?.channel === 'phone';
  const target = request ? (isPhone ? prettyPhone(request.target) : request.target) : '';

  return (
    <Modal
      open={!!request}
      title={isPhone ? 'Verify your new number' : 'Verify your new email'}
      onClose={onCancel}
      actions={
        <>
          <Button variant="outline" onClick={onCancel} disabled={verifying}>
            Cancel
          </Button>
          <Button onClick={() => verify()} loading={verifying} disabled={sending}>
            Verify &amp; Save
          </Button>
        </>
      }
    >
      <form
        className={s.body}
        onSubmit={(e) => {
          e.preventDefault();
          void verify();
        }}
      >
        <p className={s.lead}>
          {sending ? 'Sending a code to ' : 'Enter the 6-digit code sent to '}
          <strong>{target}</strong>
          {isPhone ? '. You’ll use this number to sign in and get delivery updates.' : '.'}
        </p>
        <input
          ref={input}
          className={`${s.code} ${error ? s.invalid : ''}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="6-digit verification code"
          aria-invalid={!!error || undefined}
          aria-describedby="otp-msg"
          placeholder="••••••"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(v);
            setError(undefined);
            if (v.length === 6) void verify(v);
          }}
        />
        <div id="otp-msg" className={s.meta}>
          {error ? (
            <span className={s.error} role="alert">{error}</span>
          ) : (
            <span className={s.hint}>Demo code: {DEMO_OTP}</span>
          )}
          {wait > 0 ? (
            <span className={s.hint}>Resend in 0:{String(wait).padStart(2, '0')}</span>
          ) : (
            <button type="button" className={s.resend} onClick={send} disabled={sending}>
              Resend code
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

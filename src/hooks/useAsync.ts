import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

/** Runs an async loader on mount / when deps change, with retry and stale-response protection. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const id = ++latest.current;
    setState({ status: 'loading' });
    loader().then(
      (data) => id === latest.current && setState({ status: 'success', data }),
      (error: Error) => id === latest.current && setState({ status: 'error', error }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((data: T) => setState({ status: 'success', data }), []);

  return { ...state, retry, setData } as AsyncState<T> & { retry: () => void; setData: (d: T) => void };
}

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Mobile layout breakpoint — matches the 402px iPhone frames up to tablet portrait. */
export const MOBILE_QUERY = '(max-width: 767px)';
export const useIsMobile = () => useMediaQuery(MOBILE_QUERY);

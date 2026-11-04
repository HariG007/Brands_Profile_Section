import { useEffect, useRef, type RefObject } from 'react';

interface Options {
  /** Turn autoplay on/off (e.g. off while loading or when content fits). */
  enabled: boolean;
  /** Pause between slides, ms. */
  interval?: number;
  /** Slide animation length, ms. */
  duration?: number;
  /** After the shopper scrolls/drags/taps the rail, wait this long before resuming, ms. */
  resumeAfter?: number;
  /** Number of original (non-cloned) children; clones follow them for a seamless loop. */
  setSize: number;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Auto-advances a horizontal rail one card at a time with an eased, rAF-driven
 * scroll, looping seamlessly over a cloned second set of cards.
 *
 * Pauses on hover, keyboard focus, touch/drag/wheel (resumes after `resumeAfter`),
 * when the rail is off-screen, when the tab is hidden, and is disabled entirely
 * for users who prefer reduced motion.
 */
export function useAutoScroll(ref: RefObject<HTMLElement | null>, opts: Options) {
  const { enabled, interval = 3200, duration = 900, resumeAfter = 5000, setSize } = opts;
  const state = useRef({ hovered: false, focused: false, visible: true, lastUser: 0, animating: false, raf: 0 });
  // Manual prev/next (arrow buttons). Falls back to a plain smooth scroll when autoplay is off.
  const fallbackRef = useRef<(dir: 1 | -1) => void>((dir) => {
    const rail = ref.current;
    const card = rail?.querySelector<HTMLElement>('[data-rail-item]');
    const gap = rail ? parseFloat(getComputedStyle(rail).columnGap) || 0 : 0;
    if (rail && card) rail.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: 'smooth' });
  });
  const manual = useRef<(dir: 1 | -1) => void>(fallbackRef.current);

  useEffect(() => {
    const rail = ref.current;
    if (!rail || !enabled || setSize === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const st = state.current;
    st.lastUser = 0;

    // Width of one full set = offset of the first cloned card.
    const cards = () => Array.from(rail.querySelectorAll<HTMLElement>('[data-rail-item]'));
    const setWidth = () => cards()[setSize]?.offsetLeft ?? 0;

    const cancelAnim = () => {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
      st.animating = false;
      rail.style.scrollSnapType = '';
    };

    const animateTo = (target: number) => {
      const start = rail.scrollLeft;
      const delta = target - start;
      const t0 = performance.now();
      st.animating = true;
      rail.style.scrollSnapType = 'none'; // snap would fight per-frame scrolling
      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        rail.scrollLeft = start + delta * easeInOutCubic(p);
        if (p < 1) {
          st.raf = requestAnimationFrame(frame);
        } else {
          // Seamless loop: once we're inside the cloned set, jump back by one set width.
          const w = setWidth();
          if (w > 0 && rail.scrollLeft >= w - 1) rail.scrollLeft -= w;
          cancelAnim();
        }
      };
      st.raf = requestAnimationFrame(frame);
    };

    const step = () => {
      const w = setWidth();
      if (w > 0 && rail.scrollLeft >= w - 1) rail.scrollLeft -= w;
      const cur = rail.scrollLeft;
      const next = cards().find((c) => c.offsetLeft > cur + 2);
      if (next) animateTo(next.offsetLeft);
    };

    const stepBack = () => {
      const w = setWidth();
      // At the very start, hop to the identical position inside the clones so we can go "left".
      if (w > 0 && rail.scrollLeft <= 2) rail.scrollLeft += w;
      const cur = rail.scrollLeft;
      const prev = cards().filter((c) => c.offsetLeft < cur - 2).pop();
      if (prev) animateTo(prev.offsetLeft);
    };

    manual.current = (dir) => {
      st.lastUser = Date.now(); // pause autoplay for `resumeAfter`
      cancelAnim();
      if (dir > 0) step();
      else stepBack();
    };

    const tick = () => {
      const idle = Date.now() - st.lastUser > resumeAfter;
      const fits = rail.scrollWidth <= rail.clientWidth + 2;
      if (!st.hovered && !st.focused && st.visible && !document.hidden && idle && !st.animating && !fits) step();
    };
    const timer = window.setInterval(tick, interval + duration);

    // --- pause triggers
    const userAction = () => {
      st.lastUser = Date.now();
      if (st.animating) cancelAnim();
    };
    const enter = () => (st.hovered = true);
    const leave = () => (st.hovered = false);
    // Only keyboard focus pauses (a mouse click on a card navigates away anyway).
    const focusIn = () => (st.focused = (document.activeElement as HTMLElement | null)?.matches(':focus-visible') ?? false);
    const focusOut = () => (st.focused = false);

    rail.addEventListener('pointerenter', enter);
    rail.addEventListener('pointerleave', leave);
    rail.addEventListener('focusin', focusIn);
    rail.addEventListener('focusout', focusOut);
    rail.addEventListener('pointerdown', userAction, { passive: true });
    rail.addEventListener('touchstart', userAction, { passive: true });
    rail.addEventListener('wheel', userAction, { passive: true });
    rail.addEventListener('keydown', userAction);

    const io = new IntersectionObserver(([e]) => (st.visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(rail);

    return () => {
      window.clearInterval(timer);
      cancelAnim();
      io.disconnect();
      rail.removeEventListener('pointerenter', enter);
      rail.removeEventListener('pointerleave', leave);
      rail.removeEventListener('focusin', focusIn);
      rail.removeEventListener('focusout', focusOut);
      rail.removeEventListener('pointerdown', userAction);
      rail.removeEventListener('touchstart', userAction);
      rail.removeEventListener('wheel', userAction);
      rail.removeEventListener('keydown', userAction);
      manual.current = fallbackRef.current;
    };
  }, [ref, enabled, interval, duration, resumeAfter, setSize]);

  return (dir: 1 | -1) => manual.current(dir);
}

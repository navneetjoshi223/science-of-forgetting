import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

// Shared animation runner. Animates from `startVal` to `endVal` over `ms` ms
// with an ease-out cubic curve. Calls `onUpdate(value)` each frame and
// writes the final settled value to `settledRef.current`.
const runAnimation = (startVal, endVal, ms, onUpdate, settledRef) => {
  const startTime = performance.now();
  const range = endVal - startVal;
  let rafId;

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / ms, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + range * eased);
    onUpdate(current);
    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      settledRef.current = endVal;
    }
  };

  rafId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(rafId);
};

// ─── AnimatedCounter ──────────────────────────────────────────────────────
// Props:
//   from, to, duration — initial animation values
//   suffix             — appended to the number (default '%')
//   style              — inline styles for the <span>
//   live               — when true, re-animates every time `to` changes
//                        (used for interactive toggles); when false, fires
//                        once when the element first scrolls into view.
const AnimatedCounter = ({ from = 100, to = 30, duration = 2200, suffix = '%', style = {}, live = false }) => {
  const [value, setValue] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);
  // Tracks the last settled value so live re-animations start from where
  // the counter actually is, not from the original `from` prop.
  const settled = useRef(from);

  // One-shot scroll-triggered animation (default behaviour)
  useEffect(() => {
    if (live || !isInView || hasAnimated.current) return;
    hasAnimated.current = true;
    return runAnimation(from, to, duration, setValue, settled);
  }, [isInView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live animation — fires whenever `to` changes
  useEffect(() => {
    if (!live) return;
    return runAnimation(settled.current, to, duration, setValue, settled);
  }, [to]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} style={style}>
      {value}{suffix}
    </span>
  );
};

export default AnimatedCounter;

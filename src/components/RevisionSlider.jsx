import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLineColor, FREQ_LABELS } from '../lib/retention';

// Inject range-input styles once into the document head.
// We can't style ::-webkit-slider-thumb inline, so a <style> tag is needed.
function ensureSliderStyles() {
  if (document.getElementById('revision-slider-css')) return;
  const el = document.createElement('style');
  el.id = 'revision-slider-css';
  el.textContent = `
    .revision-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      background: transparent;
      outline: none;
      cursor: pointer;
      position: relative;
      z-index: 1;
      margin: 0;
    }
    .revision-slider::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 3px;
      background: transparent;
    }
    .revision-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid var(--slider-color, #e8c547);
      box-shadow: 0 2px 12px rgba(0,0,0,0.5),
                  0 0 0 5px var(--slider-halo, rgba(232,197,71,0.18));
      cursor: pointer;
      margin-top: -9px;
      transition: border-color 0.2s ease,
                  box-shadow 0.2s ease,
                  transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .revision-slider:hover::-webkit-slider-thumb,
    .revision-slider:focus::-webkit-slider-thumb {
      transform: scale(1.2);
      box-shadow: 0 2px 16px rgba(0,0,0,0.5),
                  0 0 0 7px var(--slider-halo, rgba(232,197,71,0.2));
    }
    .revision-slider:active::-webkit-slider-thumb {
      transform: scale(1.32);
      box-shadow: 0 2px 20px rgba(0,0,0,0.55),
                  0 0 0 11px var(--slider-halo, rgba(232,197,71,0.15));
    }
    .revision-slider::-moz-range-track {
      height: 6px;
      border-radius: 3px;
      background: transparent;
    }
    .revision-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid var(--slider-color, #e8c547);
      cursor: pointer;
    }
  `;
  document.head.appendChild(el);
}

// ─── Tick marks ──────────────────────────────────────────────────────────────
const Ticks = ({ value, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
    padding: '0 2px',
  }}>
    {Array.from({ length: 8 }, (_, i) => {
      const active = i <= value;
      const isCurrent = i === value;
      return (
        <div key={i} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
        }}>
          <motion.div
            animate={{
              background: active ? color : 'var(--border)',
              // Current tick stretches taller — a subtle "selected" indicator.
              height: isCurrent ? '9px' : '5px',
              opacity: isCurrent ? 1 : active ? 0.7 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{ width: '1px', borderRadius: '1px' }}
          />
          {(i === 0 || i === 7) && (
            <motion.span
              animate={{ color: active ? color : 'var(--text-muted)' }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.02em' }}
            >
              {i === 0 ? 'Never' : 'Daily'}
            </motion.span>
          )}
        </div>
      );
    })}
  </div>
);

// ─── RevisionSlider ──────────────────────────────────────────────────────────
const RevisionSlider = ({ value, onChange }) => {
  useEffect(() => { ensureSliderStyles(); }, []);

  const color   = getLineColor(value);
  const fillPct = (value / 7) * 100;

  // Halo colour is the line colour at 15% opacity for the thumb glow.
  // We pass it via CSS custom property so the injected stylesheet can use it.
  const haloColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.18)');

  return (
    <div style={{ width: '100%' }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          How often do you revise?
        </span>

        {/* Animated current-frequency label */}
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.16 }}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color,
              letterSpacing: '0.01em',
              transition: 'color 0.25s',
              minWidth: '100px',
              textAlign: 'right',
            }}
          >
            {FREQ_LABELS[value]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Slider track wrapper */}
      <div style={{ position: 'relative', height: '6px', borderRadius: '3px' }}>
        {/* Dimmed full-range gradient track */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '3px',
          background: 'linear-gradient(to right, #ef5350 0%, #e8c547 43%, #66bb6a 100%)',
          opacity: 0.18,
        }} />

        {/* Filled (active) portion — gradient that ends at current color */}
        <motion.div
          animate={{ width: `${fillPct}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            borderRadius: '3px',
            background: `linear-gradient(to right, #ef5350 0%, #e8c547 43%, ${color} 100%)`,
            backgroundSize: `${(100 / (fillPct || 1)) * 100}% 100%`,
          }}
        />

        {/* Glow orb — blurred halo that follows the thumb, tinted to match current color */}
        <motion.div
          animate={{ left: `calc(${fillPct}% - 16px)` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            top: '-11px',
            width: '32px',
            height: '28px',
            background: color,
            borderRadius: '50%',
            filter: 'blur(12px)',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />

        {/* Native range input sits on top — invisible except for the thumb */}
        <input
          type="range"
          min={0}
          max={7}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="revision-slider"
          style={{
            position: 'absolute',
            inset: '-9px 0',
            '--slider-color': color,
            '--slider-halo': haloColor,
          }}
        />
      </div>

      <Ticks value={value} color={color} />
    </div>
  );
};

export default RevisionSlider;

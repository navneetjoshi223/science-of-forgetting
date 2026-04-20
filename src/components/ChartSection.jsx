import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { computeRetentionData, getLineColor } from '../lib/retention';

// ─── Legacy anchor data (used when `mode` prop is passed without `frequency`) ─
const NO_REVISION_DATA = [
  { day: 0, retention: 100 },
  { day: 1, retention: 58 },
  { day: 2, retention: 40 },
  { day: 3, retention: 30 },
  { day: 4, retention: 24 },
  { day: 5, retention: 20 },
  { day: 6, retention: 17 },
  { day: 7, retention: 15 },
];

const WITH_REVISION_DATA = [
  { day: 0, retention: 100 },
  { day: 1, retention: 92 },
  { day: 2, retention: 87 },
  { day: 3, retention: 83 },
  { day: 4, retention: 80 },
  { day: 5, retention: 78 },
  { day: 6, retention: 76 },
  { day: 7, retention: 74 },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, lineColor }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #242424',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '4px', lineHeight: 1.4 }}>Day {label}</p>
      <p style={{ color: lineColor, fontWeight: 600 }}>
        {payload[0]?.value}% retained
      </p>
    </div>
  );
};

// ─── ChartSection ─────────────────────────────────────────────────────────────
// Props:
//   frequency  — number 0–7 (slider mode). When provided, overrides `mode`.
//   mode       — 'none' | 'revision' (legacy toggle mode, still used in Section 2)
const ChartSection = ({ frequency, mode = 'none' }) => {
  const containerRef   = useRef(null);
  const isInView       = useInView(containerRef, { once: false, margin: '-5% 0px' });
  const hasRevealed    = useRef(false);
  const [revealed,       setRevealed]       = useState(false);
  const [dataTransition, setDataTransition] = useState(false);

  // Determine target data and line colour based on which prop is active.
  const usingFrequency = frequency !== undefined;
  const targetData = usingFrequency
    ? computeRetentionData(frequency)
    : (mode === 'revision' ? WITH_REVISION_DATA : NO_REVISION_DATA);
  const lineColor = usingFrequency
    ? getLineColor(frequency)
    : (mode === 'revision' ? '#66bb6a' : '#e8c547');

  useEffect(() => {
    if (!isInView) {
      // Reset so the reveal replays on re-entry.
      hasRevealed.current = false;
      setRevealed(false);
      setDataTransition(false);
      return;
    }

    // Only run the reveal once per entry into view.
    if (hasRevealed.current) return;
    hasRevealed.current = true;

    // Small leading delay so the chart renders fully before the wipe starts.
    const t1 = setTimeout(() => setRevealed(true), 80);
    // Enable Recharts transitions only after the clip-path wipe finishes (80ms
    // delay + 950ms sweep + 120ms buffer = 1150ms), so they don't fight each
    // other on the first render.
    const t2 = setTimeout(() => setDataTransition(true), 1150);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isInView]);

  return (
    <motion.div
      ref={containerRef}
      initial={false}
      animate={{ clipPath: revealed ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
      transition={
        revealed
          ? { duration: 0.95, ease: [0.65, 0, 0.35, 1] }
          : { duration: 0 }
      }
      style={{ width: '100%', height: 300 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={targetData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${usingFrequency ? 'freq' : mode}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={lineColor} stopOpacity={0.18} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

          <XAxis
            dataKey="day"
            tickFormatter={(v) => `Day ${v}`}
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#242424' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip lineColor={lineColor} />} />

          <ReferenceLine
            y={50}
            stroke="rgba(255,255,255,0.07)"
            strokeDasharray="4 4"
            label={{ value: '50%', fill: '#444', fontSize: 11, position: 'right' }}
          />

          <Area
            type="monotone"
            dataKey="retention"
            stroke={lineColor}
            strokeWidth={2.5}
            fill={`url(#grad-${usingFrequency ? 'freq' : mode})`}
            dot={false}
            activeDot={{ r: 5, fill: lineColor, stroke: '#0a0a0a', strokeWidth: 2 }}
            isAnimationActive={dataTransition}
            animationDuration={380}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default ChartSection;

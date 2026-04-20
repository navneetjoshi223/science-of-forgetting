import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence, useAnimate } from 'framer-motion';
import SectionWrapper from './components/SectionWrapper';
import AnimatedCounter from './components/AnimatedCounter';
import ChartSection from './components/ChartSection';
import RevisionSlider from './components/RevisionSlider';
import ProgressBar from './components/ProgressBar';
import { getLineColor, getDay7Retention, MESSAGES } from './lib/retention';
import './App.css';

// ─── Shared fade variant ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ─── Reusable inline style fragments ────────────────────────────────────────
// Centralising repeated patterns prevents drift.
const TAG_STYLE = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: '4px 14px',
  borderRadius: '100px',
  marginBottom: '20px',   // ← unified: was 24 or 32 px
};

const SECTION_HEADING = {
  fontSize: 'clamp(30px, 5vw, 52px)',   // ← was clamp(28px,4.5vw,48px)
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: '-0.03em',
  marginBottom: '20px',   // ← was 16px — more breathing room
};

const LEAD_BODY = {
  fontSize: '17px',
  lineHeight: 1.85,       // ← was 1.8
  maxWidth: '54ch',       // ← unified: was 52 or 55 ch
  color: 'var(--text-secondary)',
};

const CARD = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '28px',        // ← unified: was 20–32 px
};

// ─── Section label (pill tag) ────────────────────────────────────────────────
const SectionTag = ({ children, color, bg, border }) => (
  <span style={{ ...TAG_STYLE, color, background: bg, border: `1px solid ${border}` }}>
    {children}
  </span>
);

// ─── Memory Block component ─────────────────────────────────────────────────
const MemoryBlock = ({ strength, label, delay }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      custom={delay}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
    >
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={isInView ? { opacity: strength / 100, scale: 0.85 + (strength / 100) * 0.15 } : {}}
        transition={{ duration: 0.9, delay: delay * 0.12 + 0.4, ease: 'easeOut' }}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '10px',
          background: `rgba(232, 197, 71, ${strength / 100})`,
          border: `1px solid rgba(232, 197, 71, ${Math.min(strength / 60, 1) * 0.5})`,
          boxShadow: `0 0 ${strength / 5}px rgba(232,197,71,${strength / 200})`,
        }}
      />
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
        {label}
      </span>
    </motion.div>
  );
};

// ─── Section divider ────────────────────────────────────────────────────────
// Gradient fade instead of a hard line — softer transition between sections.
const Divider = () => (
  <div style={{
    width: '100%',
    height: '1px',
    background: 'linear-gradient(to right, transparent, var(--border) 25%, var(--border) 75%, transparent)',
  }} />
);

// ─── useCountUp ─────────────────────────────────────────────────────────────
const useCountUp = (to, duration, isInView, delay = 0) => {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;

    const timeoutId = setTimeout(() => {
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(to * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timeoutId);
  }, [isInView]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
};

// ─── ComparisonBar ───────────────────────────────────────────────────────────
const BAR_MAX_H = 176;

const ComparisonBar = ({ value, color, dimBg, label, sublabel, isInView, delay }) => {
  const count = useCountUp(value, 950, isInView, delay + 0.4);
  const barH = Math.round((value / 100) * BAR_MAX_H);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        flex: 1,
        minWidth: '150px',
        borderRadius: '16px',
        padding: '32px 20px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: dimBg,
        border: `1px solid ${color}40`,
      }}
    >
      {/* Bar area */}
      <div style={{
        width: '100%',
        height: `${BAR_MAX_H}px`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: '28px',
      }}>
        {/* Track */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          width: '52px',
          height: '100%',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '6px 6px 0 0',
        }} />
        {/* Animated fill */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 1.1, delay: delay + 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'absolute',
            bottom: 0,
            width: '52px',
            height: `${barH}px`,
            background: `linear-gradient(to top, ${color}, ${color}88)`,
            borderRadius: '6px 6px 0 0',
            transformOrigin: 'bottom',
          }}
        />
        {/* % label above bar */}
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, delay: delay + 1.15 }}
          style={{
            position: 'absolute',
            bottom: `${barH + 10}px`,
            fontSize: '11px',
            fontWeight: 700,
            color,
            letterSpacing: '0.06em',
          }}
        >
          {value}%
        </motion.span>
      </div>

      {/* Counted number */}
      <span style={{
        fontSize: 'clamp(52px, 10vw, 76px)',
        fontWeight: 800,
        color,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {count}%
      </span>

      <p style={{
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginTop: '14px',
        marginBottom: '4px',
        lineHeight: 1.3,
      }}>
        {label}
      </p>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {sublabel}
      </p>
    </motion.div>
  );
};

// ─── ComparisonSection ───────────────────────────────────────────────────────
const ComparisonSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <div ref={ref} style={{
      display: 'flex',
      alignItems: 'stretch',
      gap: 'clamp(10px, 3vw, 24px)',
      margin: '60px 0 52px',
    }}>
      <ComparisonBar
        value={21}
        color="#ef5350"
        dimBg="rgba(239,83,80,0.07)"
        label="No revision"
        sublabel="retained after 7 days"
        isInView={isInView}
        delay={0.1}
      />

      {/* VS badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.55, ease: 'backOut' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: '36px',
          paddingBottom: '60px',
        }}
      >
        <span style={{
          fontSize: '11px',
          fontWeight: 800,
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
        }}>
          VS
        </span>
      </motion.div>

      <ComparisonBar
        value={73}
        color="#66bb6a"
        dimBg="rgba(102,187,106,0.07)"
        label="Daily revision"
        sublabel="retained after 7 days"
        isInView={isInView}
        delay={0.3}
      />
    </div>
  );
};

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [revisionFreq, setRevisionFreq] = useState(0);

  // ─── Counter pulse ───────────────────────────────────────────────────────
  // Imperatively scale the retention number on each slider change without
  // remounting the AnimatedCounter (which would reset its live animation).
  const [counterScope, animateCounter] = useAnimate();
  const firstCounterRender = useRef(true);
  useEffect(() => {
    if (firstCounterRender.current) { firstCounterRender.current = false; return; }
    if (!counterScope.current) return;
    animateCounter(counterScope.current, { scale: [1, 1.1, 1] }, { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] });
  }, [revisionFreq]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ProgressBar />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99,
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Memory Science
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          5 min read
        </span>
      </nav>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — HOOK                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="hook" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '128px 0 96px',
        // Subtle red glow from bottom-left — sets the danger/forgetting mood.
        backgroundColor: 'var(--bg)',
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 0% 100%, rgba(239,83,80,0.05) 0%, transparent 65%)',
      }}>
        <div className="container">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            {/* Tag */}
            <motion.div variants={fadeUp}>
              <SectionTag
                color="var(--accent)"
                bg="var(--accent-dim)"
                border="var(--accent-border)"
              >
                The Forgetting Curve
              </SectionTag>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              style={{
                fontSize: 'clamp(44px, 7.5vw, 82px)',
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                marginBottom: '24px',
                maxWidth: '14ch',
              }}
            >
              You forget most of{' '}
              <span style={{ color: 'var(--accent)' }}>what you learn</span>
            </motion.h1>

            {/* Lead */}
            <motion.p
              variants={fadeUp}
              style={{
                ...LEAD_BODY,
                fontSize: 'clamp(16px, 2vw, 18px)',
                marginBottom: '52px',
              }}
            >
              Within a week of learning something new, your brain discards most of it.
              This isn't a personal failure — it's how memory works.
              Hermann Ebbinghaus discovered why over a century ago, and science has confirmed it ever since.
            </motion.p>

            {/* Counter card */}
            <motion.div variants={fadeUp}>
              <div style={{
                display: 'inline-block',
                ...CARD,
                borderRadius: '20px',
                padding: 'clamp(28px, 5vw, 40px) clamp(36px, 6vw, 60px)',
                textAlign: 'center',
              }}>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  lineHeight: 1.5,
                }}>
                  After 7 days, average retention is
                </p>
                <AnimatedCounter
                  from={100}
                  to={21}
                  duration={2400}
                  suffix="%"
                  style={{
                    fontSize: 'clamp(68px, 11vw, 104px)',
                    fontWeight: 800,
                    color: 'var(--danger)',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    display: 'block',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginTop: '10px',
                  letterSpacing: '0.01em',
                }}>
                  without any review
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            style={{
              marginTop: '72px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              style={{ width: '1px', height: '40px', background: 'var(--border)' }}
            />
          </motion.div>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — THE FORGETTING CURVE                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <SectionWrapper
        id="curve"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 0',
          // Step up to a slightly lighter surface — creates visible rhythm.
          backgroundColor: '#0d0d0d',
          // Subtle blue glow from the right — scientific/cool data tone.
          backgroundImage: 'radial-gradient(ellipse 55% 65% at 105% 50%, rgba(79,195,247,0.035) 0%, transparent 65%)',
        }}
      >
        <div className="container">
          <SectionTag
            color="var(--blue)"
            bg="var(--blue-dim)"
            border="rgba(79,195,247,0.22)"
          >
            Ebbinghaus, 1885
          </SectionTag>

          <h2 style={SECTION_HEADING}>The Forgetting Curve</h2>

          <p style={{ ...LEAD_BODY, marginBottom: '52px' }}>
            Hermann Ebbinghaus memorized nonsense syllables and tested his recall at intervals.
            The result was a stark exponential curve: memory decays fastest in the first 24 hours,
            then gradually levels off to a low baseline.
          </p>

          {/* Chart card */}
          <motion.div
            style={{ ...CARD, borderRadius: '16px', padding: '28px 28px 24px', marginBottom: '24px' }}
            whileHover={{ scale: 1.025, y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), 0 0 24px 4px rgba(232,197,71,0.05)', transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.01em',
              }}>
                Memory Retention Over Time
              </span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--accent)',
              }}>
                <span style={{
                  width: '20px',
                  height: '2px',
                  background: 'var(--accent)',
                  display: 'inline-block',
                  borderRadius: '1px',
                }} />
                No revision
              </span>
            </div>
            <ChartSection mode="none" />
          </motion.div>

          {/* Stat callouts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            {[
              { time: 'Day 1', stat: '58%', desc: 'after 24 hours' },
              { time: 'Day 3', stat: '30%', desc: 'after 3 days' },
              { time: 'Day 7', stat: '15%', desc: 'after one week' },
            ].map(({ time, stat, desc }) => (
              <motion.div
                key={time}
                style={{ ...CARD, borderRadius: '12px', textAlign: 'center' }}
                whileHover={{ scale: 1.04, y: -5, boxShadow: '0 24px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12), 0 0 28px 6px rgba(232,197,71,0.07)', transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
              >
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  lineHeight: 1,
                }}>
                  {time}
                </p>
                <motion.p
                  initial={{ scale: 1 }}
                  whileInView={{ scale: [1, 1.12, 1] }}
                  viewport={{ once: true, margin: '-5% 0px' }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: 'var(--danger)',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stat}
                </motion.p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                  lineHeight: 1.4,
                }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <Divider />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — WHY THIS HAPPENS                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <SectionWrapper
        id="why"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 0',
          // Drop back to base — the dark break emphasises the "fading" theme.
          backgroundColor: 'var(--bg)',
          // Very faint amber glow at bottom-right echoes the memory-block visuals.
          backgroundImage: 'radial-gradient(ellipse 60% 45% at 95% 100%, rgba(232,197,71,0.04) 0%, transparent 60%)',
        }}
      >
        <div className="container">
          <SectionTag
            color="var(--accent)"
            bg="var(--accent-dim)"
            border="var(--accent-border)"
          >
            Neuroscience
          </SectionTag>

          <h2 style={SECTION_HEADING}>Why memories fade</h2>

          <p style={{ ...LEAD_BODY, marginBottom: '52px' }}>
            Memory isn't a recording. It's a pattern of neural connections that must be actively
            maintained. Without reinforcement, synaptic connections weaken over time —
            the signal-to-noise ratio drops until the memory becomes irretrievable.
          </p>

          {/* Memory block visualizer */}
          <motion.div
            style={{ ...CARD, borderRadius: '16px', padding: '44px 32px', marginBottom: '44px' }}
            whileHover={{ scale: 1.025, y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), 0 0 24px 4px rgba(232,197,71,0.05)', transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
          >
            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginBottom: '40px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              Memory strength without revision
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 'clamp(16px, 3vw, 36px)',
              flexWrap: 'wrap',
            }}>
              <MemoryBlock strength={100} label="Day 0" delay={0} />
              <MemoryBlock strength={58}  label="Day 1" delay={1} />
              <MemoryBlock strength={40}  label="Day 2" delay={2} />
              <MemoryBlock strength={28}  label="Day 3" delay={3} />
              <MemoryBlock strength={17}  label="Day 5" delay={4} />
              <MemoryBlock strength={10}  label="Day 7" delay={5} />
            </div>
          </motion.div>

          {/* Mechanism cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {[
              {
                icon: '⚡',
                title: 'Synaptic Decay',
                body: 'Neural pathways weaken when not used. The brain prunes connections it considers redundant.',
              },
              {
                icon: '🔀',
                title: 'Interference',
                body: 'New learning overwrites old memories. Similar information competes for the same neural space.',
              },
              {
                icon: '💤',
                title: 'Consolidation',
                body: 'Sleep transfers memories from short-term to long-term storage. Poor sleep accelerates forgetting.',
              },
            ].map(({ icon, title, body }) => (
              <motion.div
                key={title}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px 24px' }}
                whileHover={{ scale: 1.04, y: -5, boxShadow: '0 24px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12), 0 0 28px 6px rgba(232,197,71,0.07)', transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
              >
                <span style={{
                  fontSize: '26px',
                  display: 'block',
                  marginBottom: '16px',
                  lineHeight: 1,
                }}>
                  {icon}
                </span>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  letterSpacing: '-0.01em',
                }}>
                  {title}
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.75 }}>{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <Divider />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — INTERACTIVE                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <SectionWrapper
        id="interact"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 0',
          // Step back up — distinguishes the interactive section from the dark Why section.
          backgroundColor: '#0d0d0d',
          // Green glow from above: signals agency and a positive outcome.
          backgroundImage: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(102,187,106,0.06) 0%, transparent 65%)',
        }}
      >
        <div className="container">
          <SectionTag
            color="#66bb6a"
            bg="rgba(102,187,106,0.1)"
            border="rgba(102,187,106,0.22)"
          >
            Try it yourself
          </SectionTag>

          <h2 style={SECTION_HEADING}>You control the curve</h2>

          <p style={{ ...LEAD_BODY, marginBottom: '44px' }}>
            Revision frequency is the single biggest lever you have over the forgetting curve.
            Drag the slider and watch what happens to your Day 7 retention.
          </p>

          {/* ── Slider card ── */}
          <motion.div
            style={{ ...CARD, borderRadius: '16px', padding: '32px 28px', marginBottom: '20px' }}
            whileHover={{ scale: 1.025, y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), 0 0 24px 4px rgba(232,197,71,0.05)', transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
          >
            <RevisionSlider value={revisionFreq} onChange={setRevisionFreq} />
          </motion.div>

          {/* ── Live stat + message card ── */}
          {(() => {
            const color      = getLineColor(revisionFreq);
            const retention  = getDay7Retention(revisionFreq);
            const msg        = MESSAGES[revisionFreq];
            // Derive tinted bg/border from the live colour
            const rgb        = color.replace('rgb(', '').replace(')', '').split(',').map(Number);
            const bg         = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.07)`;
            const border     = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.22)`;

            return (
              <div style={{
                borderRadius: '16px',
                padding: 'clamp(28px, 5vw, 44px) clamp(24px, 5vw, 40px)',
                textAlign: 'center',
                marginBottom: '20px',
                background: bg,
                border: `1px solid ${border}`,
                transition: 'background 0.4s ease, border-color 0.4s ease',
              }}>
                {/* Label */}
                <p style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}>
                  Day 7 retention
                </p>

                {/* Big animated number — wrapper ref used for the scale pulse on change */}
                <div ref={counterScope} style={{ display: 'inline-block' }}>
                  <AnimatedCounter
                    live
                    from={15}
                    to={retention}
                    duration={500}
                    suffix="%"
                    style={{
                      fontSize: 'clamp(72px, 16vw, 116px)',
                      fontWeight: 800,
                      color,
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                      display: 'block',
                      transition: 'color 0.35s ease',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>

                {/* Thin rule */}
                <div style={{
                  width: '32px',
                  height: '1px',
                  background: 'var(--border)',
                  margin: '20px auto',
                }} />

                {/* Dynamic headline */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`headline-${revisionFreq}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      fontSize: 'clamp(15px, 2.2vw, 17px)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '10px',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.35,
                    }}
                  >
                    {msg.headline}
                  </motion.p>
                </AnimatePresence>

                {/* Dynamic body */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`body-${revisionFreq}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, delay: 0.05 }}
                    style={{
                      fontSize: 'clamp(13px, 1.8vw, 15px)',
                      lineHeight: 1.8,
                      color: 'var(--text-secondary)',
                      maxWidth: '46ch',
                      margin: '0 auto',
                    }}
                  >
                    {msg.body}
                  </motion.p>
                </AnimatePresence>
              </div>
            );
          })()}

          {/* ── Chart ── */}
          <motion.div
            style={{ ...CARD, borderRadius: '16px', padding: '28px 28px 24px' }}
            whileHover={{ scale: 1.025, y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), 0 0 24px 4px rgba(232,197,71,0.05)', transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.01em',
              }}>
                Memory Retention Over 7 Days
              </span>
              <motion.span
                animate={{ color: getLineColor(revisionFreq) }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <motion.span
                  animate={{ background: getLineColor(revisionFreq) }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '20px',
                    height: '2px',
                    display: 'inline-block',
                    borderRadius: '1px',
                  }}
                />
                {MESSAGES[revisionFreq].headline}
              </motion.span>
            </div>
            <ChartSection frequency={revisionFreq} />
          </motion.div>
        </div>
      </SectionWrapper>

      <Divider />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 5 — CONCLUSION                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <SectionWrapper
        id="conclusion"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 0 160px',
          // Return to deep base — the final beat lands heavier against pure dark.
          backgroundColor: 'var(--bg)',
          // Accent gold glow at top-center: the payoff, reward energy.
          backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(232,197,71,0.07) 0%, transparent 65%)',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>

          {/* Accent rule */}
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '40px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              height: '2px',
              background: 'var(--accent)',
              margin: '0 auto 52px',
              borderRadius: '1px',
            }}
          />

          {/* Setup line */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontSize: 'clamp(18px, 3vw, 28px)',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              letterSpacing: '-0.015em',
              lineHeight: 1.3,
              marginBottom: '16px',
            }}
          >
            The difference is not small.
          </motion.p>

          {/* Punch line */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.93 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontSize: 'clamp(44px, 9vw, 88px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              color: 'var(--accent)',
            }}
          >
            It's everything.
          </motion.h2>

          {/* Side-by-side comparison */}
          <ComparisonSection />

          {/* Multiplier pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.07, boxShadow: '0 12px 36px rgba(102,187,106,0.4), 0 0 0 1px rgba(102,187,106,0.3)', transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(102,187,106,0.08)',
              border: '1px solid rgba(102,187,106,0.2)',
              borderRadius: '100px',
              padding: '12px 24px',
              marginBottom: '52px',
            }}
          >
            <span style={{
              fontSize: '19px',
              fontWeight: 800,
              color: '#66bb6a',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              3.5×
            </span>
            <span style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}>
              more retained with daily revision over 7 days
            </span>
          </motion.div>

          {/* Body copy */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              lineHeight: 1.85,
              maxWidth: '48ch',
              margin: '0 auto 64px',
            }}
          >
            Your brain is not broken — it's efficient. Memories that aren't used get
            pruned. The fix isn't studying harder.{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              It's reviewing smarter.
            </span>
          </motion.p>

          {/* Takeaway rules */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '16px',
            marginBottom: '72px',
            textAlign: 'left',
          }}>
            {[
              {
                n: '01',
                rule: 'Review within 24 hours',
                detail: 'Catch the steepest part of the curve before it drops.',
              },
              {
                n: '02',
                rule: 'Space repetitions out',
                detail: 'Day 1 → Day 3 → Day 7 → Day 14. Each gap can widen.',
              },
              {
                n: '03',
                rule: 'Use active recall',
                detail: 'Testing beats re-reading. Retrieval rebuilds the trace.',
              },
            ].map(({ n, rule, detail }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.04, y: -5, boxShadow: '0 24px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12), 0 0 28px 6px rgba(232,197,71,0.07)', transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  ...CARD,
                  borderRadius: '14px',
                  padding: '26px 22px',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: 'var(--accent)',
                  marginBottom: '14px',
                  textTransform: 'uppercase',
                }}>
                  {n}
                </span>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}>
                  {rule}
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.7 }}>{detail}</p>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: 1.7,
              letterSpacing: '0.01em',
            }}
          >
            Based on research by Hermann Ebbinghaus (1885) and subsequent spaced repetition studies.
          </motion.p>

        </div>
      </SectionWrapper>
    </>
  );
}

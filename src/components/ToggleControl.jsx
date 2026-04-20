import { motion } from 'framer-motion';

const ToggleControl = ({ mode, onChange }) => {
  const options = [
    { value: 'none', label: 'No revision', icon: '📉' },
    { value: 'revision', label: 'Daily revision', icon: '📈' },
  ];

  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--surface-2, #1a1a1a)',
      border: '1px solid var(--border, #242424)',
      borderRadius: '12px',
      padding: '4px',
      gap: '4px',
      position: 'relative',
    }}>
      {options.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              position: 'relative',
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              color: active ? (opt.value === 'revision' ? '#66bb6a' : '#e8c547') : 'var(--text-secondary, #999)',
              transition: 'color 0.25s ease',
              zIndex: 1,
            }}
          >
            {active && (
              <motion.div
                layoutId="toggle-bg"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '8px',
                  background: opt.value === 'revision'
                    ? 'rgba(102,187,106,0.12)'
                    : 'rgba(232,197,71,0.12)',
                  border: `1px solid ${opt.value === 'revision' ? 'rgba(102,187,106,0.25)' : 'rgba(232,197,71,0.25)'}`,
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ToggleControl;

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const SectionWrapper = ({ children, id, style = {} }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <section id={id} ref={ref} style={style}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </section>
  );
};

export default SectionWrapper;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const sans = "'Plus Jakarta Sans', sans-serif";

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Light sweep effect */}
      <motion.div 
        className="absolute top-0 bottom-0 w-[20vw] bg-white opacity-5 blur-[100px] -skew-x-12"
        initial={{ left: '-50%' }}
        animate={{ left: '150%' }}
        transition={{ duration: 2, ease: 'easeInOut', delay: 0.5 }}
      />

      <div className="relative z-10 text-center flex flex-col items-center gap-[4vh] px-[8vw]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: 'clamp(36px, 8vw, 110px)',
            color: '#FAFAF7',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            GH2 EDGE
          </h1>
          <div className="w-[10vw] h-[2px] bg-[#C43A1E] mx-auto mt-[2vh]" style={{ minWidth: 48 }} />
        </motion.div>

        <motion.div
          className="flex flex-col gap-3 items-center"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <p style={{
            fontFamily: sans,
            fontSize: 'clamp(12px, 2.2vw, 24px)',
            color: '#FAFAF7',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontWeight: 600,
            margin: 0,
          }}>
            Patent Pending <span style={{ color: '#C43A1E', margin: '0 0.6em' }}>&middot;</span> Trade Secret
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <p style={{
            fontFamily: sans,
            fontSize: 'clamp(12px, 1.6vw, 18px)',
            color: '#8F8F8A',
            maxWidth: '80vw',
            margin: 0,
            lineHeight: 1.6,
          }}>
            A retirement intelligence platform by Jae W. Oh, MBA, CFP®<br />of GH2 Benefits LLC.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

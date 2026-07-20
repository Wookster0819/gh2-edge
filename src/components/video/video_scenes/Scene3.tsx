import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const display = "'Playfair Display', serif";
const sans = "'Plus Jakarta Sans', sans-serif";

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const statNum: React.CSSProperties = {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 'clamp(56px, 14vw, 200px)',
    color: '#FAFAF7',
    lineHeight: 1,
    margin: 0,
  };

  const statLabel: React.CSSProperties = {
    fontFamily: sans,
    fontSize: 'clamp(13px, 2.5vw, 28px)',
    color: '#8F8F8A',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    marginTop: '1vh',
  };

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col justify-center items-center text-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <motion.div 
          className="w-[150vw] h-[150vw] border-[1px] border-[#C43A1E] rounded-full"
          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative z-10 w-full px-[5vw]">
        {/* Stat 1 */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={
            phase === 1 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } :
            phase > 1 ? { opacity: 0, y: -50, filter: 'blur(10px)', scale: 1.1 } :
            { opacity: 0, y: 50, filter: 'blur(10px)' }
          }
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p style={statNum}>97M</p>
          <p style={statLabel}>Household Profiles</p>
        </motion.div>

        {/* Stat 2 */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={
            phase === 2 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } :
            phase > 2 ? { opacity: 0, y: -50, filter: 'blur(10px)', scale: 1.1 } :
            { opacity: 0, y: 50, filter: 'blur(10px)' }
          }
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p style={statNum}>7.8B</p>
          <p style={statLabel}>Strategy Combinations</p>
        </motion.div>

        {/* Stat 3 */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={
            phase >= 3 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } :
            { opacity: 0, y: 50, filter: 'blur(10px)' }
          }
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p style={{ ...statNum, color: '#C43A1E' }}>6.4T</p>
          <p style={{ ...statLabel, color: '#FAFAF7' }}>Retirement Outcomes Evaluated</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

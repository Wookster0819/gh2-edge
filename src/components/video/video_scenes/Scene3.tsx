import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 5500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col justify-center items-center text-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <motion.div 
          className="w-[150vw] h-[150vw] border-[1px] border-[#C43A1E] rounded-full"
          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 w-full px-[10vw]">
        {/* Stat 1 */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={
            phase === 1 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } :
            phase > 1 ? { opacity: 0, y: -50, filter: 'blur(10px)', scale: 1.1 } :
            { opacity: 0, y: 50, filter: 'blur(10px)' }
          }
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="text-[12vw] font-display text-[#FAFAF7] leading-none mb-4">97M</h3>
          <p className="text-[2vw] text-[#8F8F8A] uppercase tracking-[0.2em]">Household Profiles</p>
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
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="text-[12vw] font-display text-[#FAFAF7] leading-none mb-4">7.8B</h3>
          <p className="text-[2vw] text-[#8F8F8A] uppercase tracking-[0.2em]">Strategy Combinations</p>
        </motion.div>

        {/* Stat 3 */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={
            phase >= 3 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } :
            { opacity: 0, y: 50, filter: 'blur(10px)' }
          }
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="text-[12vw] font-display text-[#C43A1E] leading-none mb-4">6.4T</h3>
          <p className="text-[2vw] text-[#FAFAF7] uppercase tracking-[0.2em]">Retirement Outcomes Evaluated</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
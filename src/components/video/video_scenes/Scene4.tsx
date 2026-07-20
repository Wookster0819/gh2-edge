import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Light sweep effect */}
      <motion.div 
        className="absolute top-0 bottom-0 w-[20vw] bg-white opacity-5 blur-[100px] -skew-x-12"
        initial={{ left: '-50%' }}
        animate={{ left: '150%' }}
        transition={{ duration: 3, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 text-center flex flex-col items-center gap-[4vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[6vw] font-display font-bold text-[#FAFAF7] tracking-tight">
            GH2 EDGE
          </h1>
          <div className="w-[10vw] h-[2px] bg-[#C43A1E] mx-auto mt-[2vh]" />
        </motion.div>

        <motion.div
          className="flex flex-col gap-3 items-center"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <p className="text-[1.8vw] font-sans text-[#FAFAF7] uppercase tracking-[0.2em] font-medium">
            Patent Pending <span className="text-[#C43A1E] mx-3">&middot;</span> Trade Secret
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <p className="text-[1.2vw] font-sans text-[#8F8F8A] max-w-[60vw]">
            A retirement intelligence platform by Jae W. Oh, MBA, CFP®<br />of GH2 Benefits LLC.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
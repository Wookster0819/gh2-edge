import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const display = "'Playfair Display', serif";

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center px-[15vw]"
      initial={{ opacity: 0, x: '5vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-5vw' }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <img
        src={`${import.meta.env.BASE_URL}images/texture-dark.png`}
        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
        alt=""
      />
      <div className="absolute inset-0 bg-[#0A0A09]/80" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="flex flex-col gap-[3vh]">
          <motion.h2 
            style={{ fontSize: '4.5vw', fontFamily: display, color: '#FAFAF7', opacity: 0.55, margin: 0 }}
            initial={{ opacity: 0, x: 40 }}
            animate={phase >= 1 ? { opacity: 0.55, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Every household.
          </motion.h2>

          <motion.h2 
            style={{ fontSize: '4.5vw', fontFamily: display, color: '#FAFAF7', opacity: 0.55, margin: 0 }}
            initial={{ opacity: 0, x: 40 }}
            animate={phase >= 2 ? { opacity: 0.55, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Every strategy.
          </motion.h2>

          <motion.h2 
            style={{ fontSize: '5.5vw', fontFamily: display, color: '#FAFAF7', marginTop: '2vh', marginBottom: 0, textShadow: '0 2px 40px rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
            animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(10px)', y: 20 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Already solved.
          </motion.h2>
        </div>
        
        <motion.div 
          className="absolute -left-[5vw] top-0 bottom-0 w-[2px] bg-[#C43A1E]"
          style={{ transformOrigin: 'top' }}
          initial={{ scaleY: 0 }}
          animate={phase >= 1 ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

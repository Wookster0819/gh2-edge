import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <video
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        src={`${import.meta.env.BASE_URL}videos/bg-intro.mp4`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A09]/40 to-[#0A0A09]/90" />

      <div className="relative z-10 text-center px-[10vw]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 style={{fontSize:'6vw', lineHeight:1.05, letterSpacing:'-0.03em', fontWeight:700, fontFamily:"'Playfair Display', serif", color:'#FAFAF7', textShadow:'0 4px 60px rgba(0,0,0,1)'}}>
            There is a <motion.span 
              style={{color:'#C43A1E', display:'inline-block'}}
              initial={{ filter: "blur(10px)", opacity: 0 }}
              animate={phase >= 2 ? { filter: "blur(0px)", opacity: 1 } : { filter: "blur(10px)", opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              right
            </motion.span>
            <br />retirement answer.
          </h1>
        </motion.div>
      </div>
    </motion.div>
  );
}
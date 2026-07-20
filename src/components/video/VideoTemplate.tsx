import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';

const SCENE_DURATIONS = { 
  intro: 5500, 
  context: 6000, 
  stats: 10000, 
  outro: 8500 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A0A09] text-[#FAFAF7]">
      <div className="noise-bg" />
      
      {/* Persistent cinematic gradient layer */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at center, #C43A1E 0%, transparent 60%)',
        }}
        animate={{
          scale: [1, 1.2, 0.9, 1.1, 1],
          opacity: [0.1, 0.2, 0.15, 0.25, 0.1],
          x: ['-5vw', '5vw', '-2vw', '8vw', '0vw'],
          y: ['-5vh', '10vh', '-5vh', '5vh', '0vh']
        }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      />

      {/* Main Content inside AnimatePresence */}
      <AnimatePresence mode="sync">
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="context" />}
        {currentScene === 2 && <Scene3 key="stats" />}
        {currentScene === 3 && <Scene4 key="outro" />}
      </AnimatePresence>
    </div>
  );
}
import { useState, useEffect } from 'react';

interface UseVideoPlayerOptions {
  durations: Record<string, number>;
}

export function useVideoPlayer({ durations }: UseVideoPlayerOptions) {
  const [currentScene, setCurrentScene] = useState(0);
  const sceneKeys = Object.keys(durations);
  const durationValues = Object.values(durations);

  useEffect(() => {
    // Start recording if global function exists
    if (typeof window !== 'undefined' && (window as any).startRecording && currentScene === 0) {
      (window as any).startRecording();
    }

    let timeout: NodeJS.Timeout;
    if (sceneKeys.length > 0) {
      const duration = durationValues[currentScene];
      timeout = setTimeout(() => {
        if (currentScene < sceneKeys.length - 1) {
          setCurrentScene((prev) => prev + 1);
        } else {
          // Stop recording on loop
          if (typeof window !== 'undefined' && (window as any).stopRecording) {
            (window as any).stopRecording();
          }
          // Loop back
          setCurrentScene(0);
        }
      }, duration);
    }

    return () => clearTimeout(timeout);
  }, [currentScene, sceneKeys.length, durationValues]);

  return { currentScene };
}
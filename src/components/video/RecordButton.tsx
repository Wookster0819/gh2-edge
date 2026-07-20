import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOTAL_MS = 30000;

type State = 'idle' | 'waiting' | 'recording' | 'done';

export function RecordButton() {
  const [state, setState] = useState<State>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    setState('waiting');
    let stream: MediaStream;
    try {
      stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      });
    } catch {
      setState('idle');
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gh2-edge-video.webm';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setState('done');
      setTimeout(() => setState('idle'), 4000);
    };

    recorder.start(200);
    setState('recording');
    setSecondsLeft(Math.round(TOTAL_MS / 1000));

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          recorder.stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function cancel() {
    recorderRef.current?.stop();
    setState('idle');
  }

  const labels: Record<State, string> = {
    idle: 'Record & Download',
    waiting: 'Select this tab…',
    recording: `Recording ${secondsLeft}s`,
    done: 'Saved to Downloads',
  };

  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999 }}>
      <AnimatePresence mode="wait">
        {state !== 'recording' ? (
          <motion.button
            key="btn"
            onClick={state === 'idle' ? start : undefined}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              background: state === 'done' ? '#1a5c35' : '#C43A1E',
              color: '#FAFAF7',
              border: 'none',
              padding: '12px 22px',
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: state === 'idle' ? 'pointer' : 'default',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {state === 'idle' && (
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FAFAF7', display: 'inline-block' }} />
            )}
            {labels[state]}
          </motion.button>
        ) : (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{ display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <div style={{
              background: '#111',
              color: '#FAFAF7',
              padding: '12px 18px',
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <motion.span
                style={{ width: 10, height: 10, borderRadius: '50%', background: '#C43A1E', display: 'inline-block' }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {labels.recording}
            </div>
            <button
              onClick={cancel}
              style={{
                background: '#333',
                color: '#FAFAF7',
                border: 'none',
                padding: '12px 16px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {state === 'waiting' && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: 10,
          background: '#111',
          color: '#FAFAF7',
          padding: '10px 14px',
          fontSize: 12,
          maxWidth: 220,
          lineHeight: 1.5,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Choose <strong>this tab</strong> in the Share dialog, then click Share.
        </div>
      )}
    </div>
  );
}

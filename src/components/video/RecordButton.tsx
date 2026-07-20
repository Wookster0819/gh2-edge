import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOTAL_MS = 21000;

type State = 'idle' | 'waiting' | 'recording' | 'done' | 'error';

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
        video: { frameRate: 30, width: 1920, height: 1080 },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
        monitorTypeSurfaces: 'exclude',
      });
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
      return;
    }

    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
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
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setState('done');
      setTimeout(() => setState('idle'), 4000);
    };

    recorder.start(200);
    setState('recording');
    const total = Math.round(TOTAL_MS / 1000);
    setSecondsLeft(total);

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
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    setState('idle');
  }

  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>

      <AnimatePresence>
        {state === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: '#111',
              color: '#FAFAF7',
              padding: '10px 16px',
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              maxWidth: 230,
              textAlign: 'right',
            }}
          >
            In the dialog, click <strong>"Share"</strong> — your tab is already selected.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.button key="idle"
            onClick={start}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            style={btnStyle('#C43A1E', true)}
          >
            <Dot color="#FAFAF7" /> RECORD &amp; DOWNLOAD
          </motion.button>
        )}

        {state === 'waiting' && (
          <motion.button key="waiting"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            style={btnStyle('#555', false)}
          >
            WAITING…
          </motion.button>
        )}

        {state === 'recording' && (
          <motion.div key="recording"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            style={{ display: 'flex', gap: 8 }}
          >
            <div style={btnStyle('#111', false)}>
              <PulsingDot /> RECORDING {secondsLeft}s
            </div>
            <button onClick={cancel} style={btnStyle('#333', true)}>CANCEL</button>
          </motion.div>
        )}

        {state === 'done' && (
          <motion.div key="done"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            style={btnStyle('#1a5c35', false)}
          >
            ✓ SAVED TO DOWNLOADS
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div key="error"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            style={btnStyle('#6B2020', false)}
          >
            CANCELLED
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function btnStyle(bg: string, pointer: boolean): React.CSSProperties {
  return {
    background: bg,
    color: '#FAFAF7',
    border: 'none',
    padding: '12px 20px',
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: pointer ? 'pointer' : 'default',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    whiteSpace: 'nowrap',
  };
}

function Dot({ color }: { color: string }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}

function PulsingDot() {
  return (
    <motion.span
      style={{ width: 8, height: 8, borderRadius: '50%', background: '#C43A1E', display: 'inline-block', flexShrink: 0 }}
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 0.9, repeat: Infinity }}
    />
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SceneInfo {
  id: string;
  start: number;
  end: number;
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  camera: { scale: number; x: number; y: number; rotateX?: number; rotateY?: number };
}

const SCENES: SceneInfo[] = [
  {
    id: 'scene1_intro',
    start: 0,
    end: 24.2,
    title: 'Read Aloud Planner',
    subtitle: 'A Schedule You Hear, Not Just See',
    badge: 'ACCESSIBILITY INNOVATION',
    accent: '#38bdf8',
    camera: { scale: 0.95, x: -160, y: -20, rotateX: 4, rotateY: 2 }
  },
  {
    id: 'scene2_zerologin',
    start: 24.2,
    end: 43.2,
    title: '100% Zero-Login Barrier-Free',
    subtitle: 'No Login Walls • Instantly Usable • High Contrast Mode',
    badge: 'BARRIER-FREE ACCESS',
    accent: '#10b981',
    camera: { scale: 1.12, x: -200, y: 60, rotateX: 0, rotateY: 0 }
  },
  {
    id: 'scene3_doubletap',
    start: 43.2,
    end: 59.4,
    title: 'Two-Tap Blind Assist Mode',
    subtitle: '1st Tap: Read Function Aloud • 2nd Tap: Execute Feature',
    badge: 'TALKBACK & VOICEOVER STYLE',
    accent: '#f59e0b',
    camera: { scale: 1.2, x: -100, y: 60, rotateX: 0, rotateY: 0 }
  },
  {
    id: 'scene4_voiceinput',
    start: 59.4,
    end: 77.2,
    title: 'Natural Voice Schedule Input',
    subtitle: 'Speech-to-Text • Automated NLP Extraction of Title, Time, Duration & Room',
    badge: 'NATURAL VOICE AI',
    accent: '#ef4444',
    camera: { scale: 1.15, x: -160, y: 50, rotateX: 0, rotateY: 0 }
  },
  {
    id: 'scene5_linearfocus',
    start: 77.2,
    end: 93.2,
    title: 'Linear Sentences & Focus Mode',
    subtitle: 'One Task Per Screen • Eliminates Cognitive Overload • True Audio',
    badge: 'DYSLEXIA-FRIENDLY DESIGN',
    accent: '#a855f7',
    camera: { scale: 1.12, x: -140, y: -20, rotateX: 0, rotateY: 0 }
  },
  {
    id: 'scene6_outro',
    start: 93.2,
    end: 112.5,
    title: 'WCAG 2.2 AA Audit & Android APK',
    subtitle: '0 Critical Violations • iOS PWA & 33MB Standalone Native APK Ready',
    badge: 'PRODUCTION READY',
    accent: '#38bdf8',
    camera: { scale: 0.95, x: -160, y: -10, rotateX: 2, rotateY: 0 }
  }
];

export const DemoApp: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulated internal state of the planner during demo
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [captionText, setCaptionText] = useState<string>('Ready to read schedule.');
  const [tapEffect, setTapEffect] = useState<{ type: 'first' | 'second'; text: string; x: number; y: number } | null>(null);
  const [voiceTypingText, setVoiceTypingText] = useState<string>('');
  const [addedVoiceItem, setAddedVoiceItem] = useState<boolean>(false);

  useEffect(() => {
    // Autoplay trigger from query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoplay') === '1' && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    // High frequency time sync interval for buttery animations
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        syncTime(audioRef.current.currentTime);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const syncTime = (t: number) => {
    setCurrentTime(t);

    // Scene 2 automation: trigger high contrast at t ~ 30s to 43.2s
    if (t >= 30 && t < 43.2) {
      setIsHighContrast(true);
    } else {
      setIsHighContrast(false);
    }

    // Scene 3 automation: Double-Tap demo at t ~ 48s and t ~ 53s
    if (t >= 48 && t < 53) {
      setTapEffect({
        type: 'first',
        text: '1st Tap: "Voice Add Button. Double tap to speak."',
        x: 160,
        y: 230
      });
      setCaptionText('Voice Add Button. Double tap to start speaking your schedule.');
    } else if (t >= 53 && t < 58) {
      setTapEffect({
        type: 'second',
        text: '2nd Tap: [EXECUTE] Activating Microphone!',
        x: 160,
        y: 230
      });
      setCaptionText('Listening for speech... Please say your task.');
    } else {
      if (t < 59.4) setTapEffect(null);
    }

    // Scene 4 automation: Voice typing simulation at t ~ 64s to 76s
    if (t >= 64 && t < 70) {
      const fullPrompt = "Database Lecture tomorrow at 9 AM for 2 hours in room 301";
      const progress = Math.min(1, (t - 64) / 5);
      const chars = Math.floor(progress * fullPrompt.length);
      setVoiceTypingText(fullPrompt.substring(0, chars));
    } else if (t >= 70 && t < 77.2) {
      setVoiceTypingText("Database Lecture tomorrow at 9 AM for 2 hours in room 301");
      setAddedVoiceItem(true);
      setCaptionText('Task added successfully: Tuesday, 09:00, Database Lecture, 2 hours, room 301.');
    } else {
      setVoiceTypingText(''); // Cleanly dismiss modal in scene 5 and 6
    }

    // Scene 5 automation: Focus mode at t >= 82s to 93.2s
    if (t >= 82 && t < 93.2) {
      setIsFocusMode(true);
      setCaptionText('Focus mode. Task 1 of 4: Monday, 08:00, Database Architecture Lecture, 2 hours, Room 301.');
    } else {
      setIsFocusMode(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      syncTime(audioRef.current.currentTime);
    }
  };

  const currentScene = SCENES.find((s) => currentTime >= s.start && currentTime < s.end) || SCENES[0];
  const progressPercent = Math.min(100, (currentTime / 111.7) * 100);

  return (
    <div style={{
      width: 1920,
      height: 1080,
      background: 'radial-gradient(circle at 50% 25%, #0f172a 0%, #020617 80%)',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      {/* Background Audio */}
      <audio
        ref={audioRef}
        src="/full_narration_en.mp3"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Futuristic Background Grid & Ambient Glows */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.6
      }} />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.28, 0.15],
          x: [-50, 50, -50]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: -200,
          left: '25%',
          width: 900,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentScene.accent} 0%, transparent 70%)`,
          filter: 'blur(120px)',
          pointerEvents: 'none'
        }}
      />

      {/* TOP HUD BAR */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 70,
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 50px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '6px 14px',
            borderRadius: 20
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: '#fca5a5' }}>REC • OFFICIAL DEMO</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Read Aloud Planner <span style={{ color: currentScene.accent, fontWeight: 400 }}>v1.0</span>
          </span>
        </div>

        {/* Scene Badge Indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${currentScene.accent}55`,
              borderRadius: 30,
              padding: '6px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: currentScene.accent }}>{currentScene.badge}</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{currentScene.title}</span>
          </motion.div>
        </AnimatePresence>

        {/* Play / Pause Toggle Button */}
        <button
          onClick={() => {
            if (audioRef.current) {
              if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
              } else {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
              }
            }
          }}
          style={{
            background: isPlaying ? 'rgba(255,255,255,0.1)' : currentScene.accent,
            color: isPlaying ? '#ffffff' : '#000000',
            border: 'none',
            padding: '8px 24px',
            borderRadius: 25,
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isPlaying ? '⏸ PAUSE DEMO' : '▶ START DEMO'}
        </button>
      </header>

      {/* Progress Timeline Header Bar */}
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.1)', zIndex: 101 }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', background: `linear-gradient(90deg, #38bdf8, ${currentScene.accent})`, transition: 'width 0.2s linear' }} />
      </div>

      {/* MAIN STAGE (Camera Zoom & Pan via Framer Motion) */}
      <main style={{
        position: 'absolute',
        top: 90,
        left: 0,
        right: 0,
        bottom: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <motion.div
          animate={{
            scale: currentScene.camera.scale,
            x: currentScene.camera.x,
            y: currentScene.camera.y,
            rotateX: currentScene.camera.rotateX || 0,
            rotateY: currentScene.camera.rotateY || 0
          }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            perspective: 1200,
            transformStyle: 'preserve-3d',
            position: 'relative'
          }}
        >
          {/* Realistic High-Tech Device Browser Window */}
          <div style={{
            width: 1050,
            minHeight: 730,
            background: isHighContrast ? '#000000' : '#ffffff',
            color: isHighContrast ? '#ffffff' : '#0f172a',
            borderRadius: 20,
            boxShadow: `0 40px 100px -20px rgba(0, 0, 0, 0.9), 0 0 50px -10px ${currentScene.accent}33`,
            border: isHighContrast ? '4px solid #ffff00' : '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'background 0.4s, color 0.4s, border 0.4s'
          }}>
            {/* Window Title Bar */}
            <div style={{
              height: 48,
              background: isHighContrast ? '#121212' : '#f1f5f9',
              borderBottom: isHighContrast ? '2px solid #ffff00' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              gap: 16
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{
                flex: 1,
                maxWidth: 440,
                margin: '0 auto',
                background: isHighContrast ? '#000000' : '#ffffff',
                border: isHighContrast ? '1px solid #ffff00' : '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '4px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: isHighContrast ? '#ffff00' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>🔒</span>
                <span>https://readaloud-planner.app</span>
              </div>
            </div>

            {/* Application Mockup Content */}
            <div style={{ padding: '24px 30px', flex: 1 }}>
              {/* App Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: isHighContrast ? '2px solid #ffff00' : '2px solid #e2e8f0',
                paddingBottom: 16,
                marginBottom: 20
              }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: isHighContrast ? '#ffff00' : '#0f172a' }}>
                    Read Aloud Planner
                  </h1>
                  <p style={{ fontSize: 13, margin: '4px 0 0', opacity: 0.85 }}>A schedule you hear, not just see</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    background: isHighContrast ? '#ffff00' : '#0f172a',
                    color: isHighContrast ? '#000000' : '#ffffff',
                    border: 'none'
                  }}>
                    {isHighContrast ? '✓ High Contrast' : 'Standard Contrast'}
                  </button>
                  <button style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none'
                  }}>
                    Double Tap: Active
                  </button>
                  <button style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none'
                  }}>
                    Test Audio
                  </button>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <motion.button
                  animate={currentTime >= 53 && currentTime < 58 ? { scale: [1, 1.05, 1], boxShadow: '0 0 25px #ef4444' } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 14,
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span>🎤</span> Voice Add (V)
                </motion.button>
                <button style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 14,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none'
                }}>
                  Read Schedule (S)
                </button>
                <button style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  background: isFocusMode ? '#9333ea' : '#e2e8f0',
                  color: isFocusMode ? '#ffffff' : '#0f172a',
                  border: 'none'
                }}>
                  {isFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}
                </button>
                <button style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  background: '#e2e8f0',
                  color: '#0f172a',
                  border: 'none'
                }}>
                  Manual Input (N)
                </button>
              </div>

              {/* Subtitle Caption Status Bar */}
              <div style={{
                background: isHighContrast ? '#1e293b' : '#e0f2fe',
                color: isHighContrast ? '#ffff00' : '#0369a1',
                border: isHighContrast ? '2px solid #ffff00' : '1px solid #bae6fd',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 20
              }}>
                💬 Voice Status: {captionText}
              </div>

              {/* Focus Mode Overlay OR Activities List */}
              {isFocusMode ? (
                <div style={{
                  background: isHighContrast ? '#0f172a' : '#f8fafc',
                  border: isHighContrast ? '3px solid #ffff00' : '2px solid #cbd5e1',
                  borderRadius: 16,
                  padding: '36px 24px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: 26, fontWeight: 900, marginBottom: 14, color: '#9333ea' }}>
                    🎯 Focus Mode: One Task
                  </h3>
                  <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5, marginBottom: 26 }}>
                    "Monday, 08:00, Database Architecture Lecture, 2 hours, Room 301."
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
                    <button style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Previous</button>
                    <button style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 800, background: '#10b981', color: '#fff', border: 'none' }}>Mark Done (D)</button>
                    <button style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Next</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Item 1 */}
                  <div style={{
                    background: isHighContrast ? '#000000' : '#f8fafc',
                    border: isHighContrast ? '2px solid #ffff00' : '2px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                      Monday, 08:00, Database Architecture Lecture, 2 hours, Room 301.
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: '#e2e8f0', border: 'none' }}>Mark Done</button>
                      <button style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: '#e2e8f0', border: 'none' }}>Speak</button>
                      <button style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: '#ef4444', color: '#fff', border: 'none' }}>Delete</button>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div style={{
                    background: isHighContrast ? '#000000' : '#f8fafc',
                    border: isHighContrast ? '2px solid #ffff00' : '2px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                      Monday, 13:00, Faculty Advisor Consultation, 30 minutes, Room 204.
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: '#e2e8f0', border: 'none' }}>Mark Done</button>
                      <button style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: '#e2e8f0', border: 'none' }}>Speak</button>
                      <button style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: '#ef4444', color: '#fff', border: 'none' }}>Delete</button>
                    </div>
                  </div>

                  {/* Newly added voice activity dynamically appears */}
                  {addedVoiceItem && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      style={{
                        background: isHighContrast ? '#052e16' : '#ecfdf5',
                        border: '2px solid #10b981',
                        borderRadius: 12,
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#047857', margin: 0 }}>
                        ✨ Tuesday, 09:00, Database Lecture, 2 hours, room 301. (Added via Voice)
                      </p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: '#10b981', color: '#fff', border: 'none' }}>Mark Done</button>
                        <button style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: '#e2e8f0', border: 'none' }}>Speak</button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SIMULATED TAP RIPPLES & TOOLTIPS (After Effects Callout Effect) */}
          {tapEffect && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                position: 'absolute',
                top: tapEffect.y,
                left: tapEffect.x,
                pointerEvents: 'none',
                zIndex: 200
              }}
            >
              {/* Expanding Ripple Wave */}
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: -25,
                  left: -25,
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  border: tapEffect.type === 'first' ? '4px solid #f59e0b' : '4px solid #10b981'
                }}
              />
              {/* Floating Tooltip Callout */}
              <div style={{
                position: 'absolute',
                top: -65,
                left: -60,
                width: 320,
                background: 'rgba(15, 23, 42, 0.95)',
                border: tapEffect.type === 'first' ? '2px solid #f59e0b' : '2px solid #10b981',
                borderRadius: 12,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
              }}>
                {tapEffect.text}
              </div>
            </motion.div>
          )}

          {/* VOICE INPUT SPEECH BUBBLE (Scene 4) */}
          {voiceTypingText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{
                position: 'absolute',
                top: 250,
                left: 60,
                right: 60,
                background: 'rgba(15, 23, 42, 0.96)',
                border: '2px solid #ef4444',
                borderRadius: 20,
                padding: '20px 24px',
                boxShadow: '0 20px 60px rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                zIndex: 300
              }}
            >
              <div style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                boxShadow: '0 0 20px #ef4444'
              }}>
                🎤
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  LISTENING TO USER SPEECH...
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: '4px 0 0' }}>
                  "{voiceTypingText}"<span style={{ color: '#ef4444', animation: 'blink 0.8s infinite' }}>|</span>
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* AFTER EFFECTS FLOATING CALLOUT CARDS (Right Column) */}
        <div style={{
          position: 'absolute',
          right: 50,
          top: 110,
          width: 440,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          zIndex: 50
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${currentScene.accent}`,
                borderRadius: 24,
                padding: '24px 26px',
                boxShadow: `0 20px 50px -10px ${currentScene.accent}33`
              }}
            >
              <div style={{
                display: 'inline-block',
                background: `${currentScene.accent}22`,
                color: currentScene.accent,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.15em',
                padding: '4px 12px',
                borderRadius: 20,
                marginBottom: 10
              }}>
                {currentScene.badge}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', lineHeight: 1.3, marginBottom: 8 }}>
                {currentScene.title}
              </h2>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                {currentScene.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Verified Badges Stack */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>♿</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', margin: 0 }}>WCAG 2.2 Level AA</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>0 Critical axe-core Violations</p>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#10b981', margin: 0 }}>Native Android APK & PWA</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>33 MB Standalone Offline-First</p>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>⌨️</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', margin: 0 }}>100% Mouse-Free</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Shortcuts V, S, D, N, Esc, Tab</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM FOOTER: Kinetic Subtitle Bar & Audio Spectrum Visualizer */}
      <footer style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 110,
        background: 'rgba(2, 6, 23, 0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 60px',
        zIndex: 100
      }}>
        {/* Kinetic Subtitles in English */}
        <div style={{ flex: 1, maxWidth: 1400, paddingRight: 40 }}>
          <p style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.5,
            margin: 0
          }}>
            <span style={{ color: currentScene.accent, fontWeight: 900 }}>🎙️ Narrator: </span>
            {currentScene.id === 'scene1_intro' && 'For millions of blind and severely dyslexic individuals, conventional visual grid calendars are disorienting labyrinths. Introducing Read Aloud Planner: an accessible daily planner you can hear, speak to, and explore with safe touch interactions.'}
            {currentScene.id === 'scene2_zerologin' && 'Designed without barriers, Read Aloud Planner completely eliminates login walls and registration forms. The application opens directly to your schedule and is immediately usable offline, featuring high contrast themes and disability-friendly focus indicators.'}
            {currentScene.id === 'scene3_doubletap' && 'A revolutionary feature for visually impaired users: Two-Tap Blind Assist Mode. A single tap reads out the button\'s name and purpose aloud without accidental clicks. A quick second tap executes the action instantly.'}
            {currentScene.id === 'scene4_voiceinput' && 'Adding tasks is now as effortless as speaking. Simply tap the voice button and speak your schedule naturally. Our smart natural language parser automatically extracts the title, time, duration, and room in seconds without typing a single character.'}
            {currentScene.id === 'scene5_linearfocus' && 'Every schedule entry is structured as a complete linear sentence optimized for screen readers. Focus Mode presents one task at a time on screen for maximum comfort for individuals with dyslexia and ADHD.'}
            {currentScene.id === 'scene6_outro' && 'Read Aloud Planner has passed automated WCAG 2.2 Level AA audits with zero critical violations, and is available for free as an installable Progressive Web App and standalone Android APK. A schedule you hear, not just see.'}
          </p>
        </div>

        {/* Audio Spectrum Waveform Visualizer (20 Dancing Bars) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40, width: 140 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={isPlaying ? {
                height: [
                  10 + ((i * 7) % 25),
                  35 - ((i * 3) % 20),
                  15 + ((i * 5) % 25),
                  10 + ((i * 7) % 25)
                ]
              } : { height: 6 }}
              transition={{
                duration: 0.6 + (i % 5) * 0.1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                width: 4,
                borderRadius: 2,
                background: currentScene.accent,
                boxShadow: isPlaying ? `0 0 8px ${currentScene.accent}` : 'none'
              }}
            />
          ))}
        </div>
      </footer>
    </div>
  );
};

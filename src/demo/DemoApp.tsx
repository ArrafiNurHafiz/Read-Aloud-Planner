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
    end: 28.2,
    title: 'Read Aloud Planner',
    subtitle: 'Jadwal yang Bisa Didengar, Bukan Hanya Dilihat',
    badge: 'INOVASI AKSESIBILITAS',
    accent: '#38bdf8',
    camera: { scale: 0.92, x: 0, y: -20, rotateX: 6, rotateY: 0 }
  },
  {
    id: 'scene2_zerologin',
    start: 28.2,
    end: 50.5,
    title: '100% Zero-Login Barrier-Free',
    subtitle: 'Tanpa Login Wall • Langsung Siap Pakai • Mode Kontras Tinggi',
    badge: 'BEBAS HAMBATAN',
    accent: '#10b981',
    camera: { scale: 1.22, x: -100, y: 80, rotateX: 0, rotateY: 0 }
  },
  {
    id: 'scene3_doubletap',
    start: 50.5,
    end: 68.5,
    title: 'Mode Bantuan Ketuk Ganda',
    subtitle: '1x Ketuk: Baca Fungsi Suara • 2x Ketuk: Eksekusi Fitur',
    badge: 'TALKBACK & VOICEOVER STYLE',
    accent: '#f59e0b',
    camera: { scale: 1.35, x: 120, y: 110, rotateX: 0, rotateY: 0 }
  },
  {
    id: 'scene4_voiceinput',
    start: 68.5,
    end: 88.8,
    title: 'Input Jadwal Cerdas Berbasis Suara',
    subtitle: 'Speech-to-Text • Ekstraksi NLP Otomatis Judul, Waktu, Durasi & Lokasi',
    badge: 'NATURAL VOICE AI',
    accent: '#ef4444',
    camera: { scale: 1.28, x: -60, y: 70, rotateX: 0, rotateY: 0 }
  },
  {
    id: 'scene5_linearfocus',
    start: 88.8,
    end: 105.9,
    title: 'Kalimat Linear & Mode Fokus',
    subtitle: 'Satu Layar Satu Kegiatan • Eliminasi Cognitive Overload • Audio Sejati',
    badge: 'DESAIN RAMAH DISLEKSIA',
    accent: '#a855f7',
    camera: { scale: 1.24, x: 40, y: -40, rotateX: 0, rotateY: 0 }
  },
  {
    id: 'scene6_outro',
    start: 105.9,
    end: 127.0,
    title: 'Audit WCAG 2.2 AA & Android APK',
    subtitle: '0 Pelanggaran Kritis • PWA iPhone & APK Native 12MB Siap Pasang',
    badge: 'SIAP PRODUKSI',
    accent: '#38bdf8',
    camera: { scale: 0.95, x: 0, y: -10, rotateX: 4, rotateY: -2 }
  }
];

export const DemoApp: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulated internal state of the planner during demo
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [captionText, setCaptionText] = useState<string>('Siap membacakan jadwal.');
  const [tapEffect, setTapEffect] = useState<{ type: 'first' | 'second'; text: string; x: number; y: number } | null>(null);
  const [voiceTypingText, setVoiceTypingText] = useState<string>('');
  const [addedVoiceItem, setAddedVoiceItem] = useState<boolean>(false);

  useEffect(() => {
    // Autoplay trigger from query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoplay') === '1' && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const t = audioRef.current.currentTime;
      setCurrentTime(t);

      // Scene 2 automation: trigger high contrast at t ~ 38s
      if (t >= 38 && t < 50) {
        setIsHighContrast(true);
      } else {
        setIsHighContrast(false);
      }

      // Scene 3 automation: Double-Tap demo at t ~ 56s and t ~ 61s
      if (t >= 56 && t < 59) {
        setTapEffect({
          type: 'first',
          text: '1x Ketuk: "Tombol Tambah via Suara. Ketuk dua kali untuk bicara."',
          x: 480,
          y: 280
        });
        setCaptionText('Tombol Tambah via Suara. Ketuk dua kali untuk mulai berbicara menambahkan jadwal.');
      } else if (t >= 59 && t < 64) {
        setTapEffect({
          type: 'second',
          text: '2x Ketuk: [EKSEKUSI] Menyalakan Mikrofon!',
          x: 480,
          y: 280
        });
        setCaptionText('Mendengarkan suara... Silakan sebutkan jadwal kegiatan.');
      } else {
        if (t < 68) setTapEffect(null);
      }

      // Scene 4 automation: Voice typing simulation at t ~ 73s to 82s
      if (t >= 73 && t < 80) {
        const fullPrompt = "Kuliah Pemrograman besok jam 9 pagi 2 jam di lab 1";
        const progress = Math.min(1, (t - 73) / 5);
        const chars = Math.floor(progress * fullPrompt.length);
        setVoiceTypingText(fullPrompt.substring(0, chars));
      } else if (t >= 80 && t < 88.8) {
        setVoiceTypingText("Kuliah Pemrograman besok jam 9 pagi 2 jam di lab 1");
        setAddedVoiceItem(true);
        setCaptionText('Kegiatan berhasil ditambahkan: Selasa, 09.00, Kuliah Pemrograman, 2 jam, lab 1.');
      } else {
        setVoiceTypingText(''); // Cleanly dismiss modal in scene 5 and 6
      }

      // Scene 5 automation: Focus mode at t >= 93s
      if (t >= 93 && t < 105.9) {
        setIsFocusMode(true);
        setCaptionText('Mode fokus. Kegiatan 1 dari 4: Senin, 08.00, Kuliah Basis Data, 2 jam, ruang 301.');
      } else {
        setIsFocusMode(false);
      }
    }
  };

  const currentScene = SCENES.find((s) => currentTime >= s.start && currentTime < s.end) || SCENES[0];
  const progressPercent = Math.min(100, (currentTime / 126.5) * 100);

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
        src="/full_narration.mp3"
        onTimeUpdate={handleTimeUpdate}
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
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: '#fca5a5' }}>REC • DEMO RESMI</span>
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
              if (isPlaying) audioRef.current.pause();
              else audioRef.current.play();
              setIsPlaying(!isPlaying);
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
          {isPlaying ? '⏸ JEDA DEMO' : '▶ MULAI DEMO'}
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
            width: 1200,
            minHeight: 740,
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
                maxWidth: 480,
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
            <div style={{ padding: '24px 32px', flex: 1 }}>
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
                  <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: isHighContrast ? '#ffff00' : '#0f172a' }}>
                    Read Aloud Planner
                  </h1>
                  <p style={{ fontSize: 14, margin: '4px 0 0', opacity: 0.85 }}>Jadwal yang bisa didengar, bukan hanya dilihat</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    background: isHighContrast ? '#ffff00' : '#0f172a',
                    color: isHighContrast ? '#000000' : '#ffffff',
                    border: 'none'
                  }}>
                    {isHighContrast ? '✓ Kontras Tinggi' : 'Kontras Normal'}
                  </button>
                  <button style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none'
                  }}>
                    Ketuk Ganda: Aktif
                  </button>
                  <button style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none'
                  }}>
                    Tes Suara
                  </button>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <motion.button
                  animate={currentTime >= 59 && currentTime < 64 ? { scale: [1, 1.05, 1], boxShadow: '0 0 25px #ef4444' } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 15,
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span>🎤</span> Tambah via Suara (V)
                </motion.button>
                <button style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 15,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none'
                }}>
                  Bacakan Jadwal (S)
                </button>
                <button style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  background: isFocusMode ? '#9333ea' : '#e2e8f0',
                  color: isFocusMode ? '#ffffff' : '#0f172a',
                  border: 'none'
                }}>
                  {isFocusMode ? 'Keluar Mode Fokus' : 'Mode Fokus'}
                </button>
                <button style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  background: '#e2e8f0',
                  color: '#0f172a',
                  border: 'none'
                }}>
                  Ketik Manual (N)
                </button>
              </div>

              {/* Subtitle Caption Status Bar */}
              <div style={{
                background: isHighContrast ? '#1e293b' : '#e0f2fe',
                color: isHighContrast ? '#ffff00' : '#0369a1',
                border: isHighContrast ? '2px solid #ffff00' : '1px solid #bae6fd',
                borderRadius: 10,
                padding: '12px 20px',
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 20
              }}>
                💬 Status Suara: {captionText}
              </div>

              {/* Focus Mode Overlay OR Activities List */}
              {isFocusMode ? (
                <div style={{
                  background: isHighContrast ? '#0f172a' : '#f8fafc',
                  border: isHighContrast ? '3px solid #ffff00' : '2px solid #cbd5e1',
                  borderRadius: 16,
                  padding: '40px 30px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16, color: '#9333ea' }}>
                    🎯 Mode Fokus: Satu Kegiatan
                  </h3>
                  <p style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.5, marginBottom: 30 }}>
                    "Senin, 08.00, Kuliah Basis Data, 2 jam, ruang 301."
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                    <button style={{ padding: '12px 24px', borderRadius: 10, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Sebelumnya</button>
                    <button style={{ padding: '12px 24px', borderRadius: 10, fontWeight: 800, background: '#10b981', color: '#fff', border: 'none' }}>Tandai Selesai (D)</button>
                    <button style={{ padding: '12px 24px', borderRadius: 10, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Berikutnya</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Item 1 */}
                  <div style={{
                    background: isHighContrast ? '#000000' : '#f8fafc',
                    border: isHighContrast ? '2px solid #ffff00' : '2px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                      Senin, 08.00, Kuliah Basis Data, 2 jam, ruang 301.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Tandai Selesai</button>
                      <button style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Bacakan</button>
                      <button style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, background: '#ef4444', color: '#fff', border: 'none' }}>Hapus</button>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div style={{
                    background: isHighContrast ? '#000000' : '#f8fafc',
                    border: isHighContrast ? '2px solid #ffff00' : '2px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                      Senin, 13.00, Konsultasi Dosen Pembimbing, 30 menit, ruang 204.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Tandai Selesai</button>
                      <button style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Bacakan</button>
                      <button style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, background: '#ef4444', color: '#fff', border: 'none' }}>Hapus</button>
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
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#047857', margin: 0 }}>
                        ✨ Selasa, 09.00, Kuliah Pemrograman, 2 jam, lab 1. (Ditambahkan via Suara)
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, background: '#10b981', color: '#fff', border: 'none' }}>Tandai Selesai</button>
                        <button style={{ padding: '6px 14px', borderRadius: 6, fontWeight: 700, background: '#e2e8f0', border: 'none' }}>Bacakan</button>
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
                left: -120,
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
                top: 260,
                left: 100,
                right: 100,
                background: 'rgba(15, 23, 42, 0.96)',
                border: '2px solid #ef4444',
                borderRadius: 20,
                padding: '24px 30px',
                boxShadow: '0 20px 60px rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                zIndex: 300
              }}
            >
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                boxShadow: '0 0 20px #ef4444'
              }}>
                🎤
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  MENDENGARKAN SUARA PENGGUNA...
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', margin: '6px 0 0' }}>
                  "{voiceTypingText}"<span style={{ color: '#ef4444', animation: 'blink 0.8s infinite' }}>|</span>
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* AFTER EFFECTS FLOATING CALLOUT CARDS (Right Column) */}
        <div style={{
          position: 'absolute',
          right: 60,
          top: 120,
          width: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
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
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${currentScene.accent}`,
                borderRadius: 24,
                padding: '28px',
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
                marginBottom: 12
              }}>
                {currentScene.badge}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', lineHeight: 1.3, marginBottom: 10 }}>
                {currentScene.title}
              </h2>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
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
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>♿</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', margin: 0 }}>WCAG 2.2 Level AA</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>0 Pelanggaran Kritis axe-core</p>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#10b981', margin: 0 }}>APK Native Android & PWA</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>12 MB Standalone Offline-First</p>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>⌨️</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', margin: 0 }}>100% Bebas Mouse</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Pintasan V, S, D, N, Esc, Tab</p>
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
        {/* Kinetic Subtitles */}
        <div style={{ flex: 1, maxWidth: 1400, paddingRight: 40 }}>
          <p style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.5,
            margin: 0
          }}>
            <span style={{ color: currentScene.accent, fontWeight: 900 }}>🎙️ Narator: </span>
            {currentScene.id === 'scene1_intro' && 'Bagi jutaan penyandang disabilitas netra dan disleksia berat, kalender konvensional berbentuk kisi visual adalah labirin yang membingungkan. Inilah Read Aloud Planner: perencana harian cerdas yang bisa didengar, diajak bicara, dan dijelajahi dengan sentuhan aman.'}
            {currentScene.id === 'scene2_zerologin' && 'Didesain tanpa hambatan, Read Aloud Planner menghapus total dinding login dan registrasi. Aplikasi langsung terbuka ke jadwal dan dapat digunakan luring seketika sejak detik pertama dibuka, lengkap dengan tema kontras tinggi.'}
            {currentScene.id === 'scene3_doubletap' && 'Fitur revolusioner untuk tunanetra: Mode Bantuan Ketuk Ganda. Satu ketukan membacakan fungsi tombol tanpa salah pencet. Ketukan kedua secara cepat langsung menjalankan fiturnya.'}
            {currentScene.id === 'scene4_voiceinput' && 'Menambah kegiatan kini semudah berbicara. Cukup tekan tombol suara dan ucapkan jadwal Anda secara alami. Sistem pengurai cerdas kami otomatis mengekstrak judul, jam, durasi, dan lokasi dalam sekejap.'}
            {currentScene.id === 'scene5_linearfocus' && 'Setiap jadwal disusun dalam struktur kalimat linear utuh yang ramah screen reader. Tersedia pula Mode Fokus yang menampilkan satu kegiatan per layar untuk kenyamanan maksimal penyandang disleksia dan ADHD.'}
            {currentScene.id === 'scene6_outro' && 'Read Aloud Planner telah lolos audit kepatuhan WCAG 2.2 Level AA dengan nol pelanggaran kritis, dan kini tersedia gratis sebagai Progressive Web App serta paket APK Android mandiri. Jadwal yang bisa didengar, bukan hanya dilihat.'}
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

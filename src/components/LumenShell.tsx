/**
 * LUMEN Shell — Ambient Mesh + Cursor Spotlight + Splash Screen
 */
import React, { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';

function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.setProperty('--cx', `${e.clientX}px`);
      el.style.setProperty('--cy', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return <div ref={ref} className="cursor-spotlight" aria-hidden />;
}

function AmbientMesh() {
  return (
    <div className="lumen-mesh" aria-hidden>
      <div className="lumen-mesh__a" />
      <div className="lumen-mesh__b" />
      <div className="lumen-mesh__c" />
    </div>
  );
}

const SPLASH_KEY = 'lumen_splash_shown_v1';

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 600); }, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`lumen-splash ${exiting ? 'splash-exit' : ''}`}>
      <div className="lumen-splash__logo">
        <Layers size={34} color="#10b981" strokeWidth={1.5} />
      </div>
      <div>
        <div className="lumen-splash__title" style={{ textAlign: 'center' }}>Panel Bazaar BD</div>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-mute)', marginTop: '0.25rem' }}>
          LUMEN Edition
        </p>
      </div>
      <div className="lumen-splash__loader" />
    </div>
  );
}

export default function LumenShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem(SPLASH_KEY); } catch { return true; }
  });
  const handleSplashDone = () => {
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch {}
    setShowSplash(false);
  };
  return (
    <>
      <AmbientMesh />
      <CursorSpotlight />
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </>
  );
}

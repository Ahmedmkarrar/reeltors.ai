'use client';
import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!ref.current) return;
      ref.current.style.transform = `translate(${e.clientX - 350}px, ${e.clientY - 350}px)`;
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed top-0 left-0 w-[700px] h-[700px] pointer-events-none z-[1] rounded-full hidden md:block"
      style={{
        background: 'radial-gradient(circle at center, rgba(240,180,41,0.055) 0%, rgba(240,180,41,0.018) 35%, transparent 65%)',
        transition: 'transform 0.12s ease',
        willChange: 'transform',
      }}
    />
  );
}

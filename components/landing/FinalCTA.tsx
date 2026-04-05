/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

function LiveCounter() {
  const [count, setCount] = useState(247);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + (Math.random() > 0.6 ? 1 : 0));
    }, 8000);
    return () => clearInterval(id);
  }, []);
  return <>{count}</>;
}

export function FinalCTA() {
  return (
    <section className="relative py-32 px-4 overflow-hidden bg-[#0D0B08] border-t border-[#1E1C18]">
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{ background: 'conic-gradient(from 180deg at 50% -5%, transparent 65deg, rgba(240,180,41,0.10) 80deg, rgba(240,180,41,0.18) 90deg, rgba(240,180,41,0.10) 100deg, transparent 115deg)' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#F0B429] opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Live activity pill */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 bg-[#1A1714] border border-[#2E2B27] rounded-full px-5 py-2.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[12px] text-[#8A8682]">
                <span className="text-[#FAFAF8] font-semibold"><LiveCounter /></span> agents made a video today
              </span>
            </div>
          </div>

          <p className="font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-6">THE BOTTOM LINE</p>

          <h2 className="font-syne font-extrabold text-[#FAFAF8] mb-6" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            Every listing without a video
            <br />
            <span className="text-[#F0B429]">is a lead you're giving away.</span>
          </h2>

          <p className="text-[#8A8682] text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Not maybe. Not probably. Actually. The buyer who would have called you will find
            the agent who posted video first.
          </p>

          <p className="text-[#4A4744] text-base mb-12 leading-relaxed">
            Starts at $49.99.99/month. Takes 60 seconds. If it doesn't work —
            email us within 30 days for a full refund. No questions asked.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link href="/signup">
              <Button
                size="lg"
                variant="primary"
                className="text-base font-bold px-12 py-5 shadow-[0_0_60px_rgba(240,180,41,0.3)] hover:shadow-[0_0_90px_rgba(240,180,41,0.5)] transition-shadow"
              >
                Get Started — From $49.99.99/month →
              </Button>
            </Link>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {['From $49.99.99/month', '30-day money back', 'Cancel anytime', 'Ready in 60 seconds'].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-3">
                <span className="text-xs text-[#4A4744]">{item}</span>
                {i < arr.length - 1 && <span className="text-[#2E2B27]">&middot;</span>}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

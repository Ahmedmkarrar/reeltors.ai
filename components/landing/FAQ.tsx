/* eslint-disable react/no-unescaped-entities */
'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { FadeIn } from '@/components/ui/FadeIn';

const faqs = [
  {
    q: "I'm not tech-savvy. Is this actually easy?",
    a: "We watched a 64-year-old realtor open Reeltors.ai for the first time. No tutorial. No demo. She uploaded photos from her phone, typed the address and her name, hit generate. 58 seconds later: professional listing video. If you can attach a photo to an email, you're qualified.",
  },
  {
    q: 'Do I really not need to film anything?',
    a: "Zero filming. Zero editing. Zero new equipment. We take the photos you already have — MLS photos, iPhone shots, whatever you got at the property — and turn them into a cinematic video. Every listing you've ever shot? You already have everything you need.",
  },
  {
    q: 'Will my videos actually get views?',
    a: "Short-form video on TikTok and Reels is distributed by algorithm, not by follower count. It reaches people actively searching for homes in your area regardless of whether you have 0 or 100k followers. The algorithm doesn't care about your audience size. It cares about the content.",
  },
  {
    q: 'Is this MLS compliant?',
    a: "Yes. We present your photos cinematically — we don't edit, enhance, or alter them in any way. Every image in your video is exactly as you submitted it to MLS. It's the equivalent of a well-produced slideshow of your listing photos.",
  },
  {
    q: "What's the catch? Why is it so cheap?",
    a: "We built the software once. It does the work of a videographer, editor, and motion designer automatically, every time, in 60 seconds. We have zero per-video labor costs. That's why we can charge $47/month instead of $500/video.",
  },
  {
    q: "What if I try it and it doesn't work for me?",
    a: "Email us within 30 days. We refund everything. No forms. No retention calls. No waiting. You get every dollar back within 48 hours, no questions asked.",
  },
];

export function FAQ() {
  return (
    <section className="py-24 px-4 bg-[#0D0B08] border-t border-[#1E1C18]">
      <div className="max-w-3xl mx-auto">
        <FadeIn>
          <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-5">
            FAQ
          </p>
          <h2 className="font-syne font-extrabold text-center mb-5 text-[#FAFAF8]" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            Every reason you're hesitating.<br />
            <span className="text-[#F0B429]">Answered.</span>
          </h2>
          <p className="text-center text-[#8A8682] text-sm max-w-lg mx-auto mb-14">
            We've heard every objection. Here's the straight answer to each one.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <Accordion.Root type="single" defaultValue="0" collapsible className="flex flex-col divide-y divide-[#1E1C18]">
            {faqs.map((faq, i) => (
              <Accordion.Item key={i} value={String(i)}>
                <Accordion.Trigger className="w-full flex items-start justify-between py-5 text-left group gap-4 cursor-pointer">
                  <span className="font-medium text-sm md:text-base leading-snug transition-colors text-[#C8C4BC] group-hover:text-[#FAFAF8] group-data-[state=open]:text-[#F0B429]">
                    {faq.q}
                  </span>
                  <span className="text-xl transition-transform duration-300 shrink-0 mt-0.5 text-[#4A4744] group-data-[state=open]:rotate-45 group-data-[state=open]:text-[#F0B429]">
                    +
                  </span>
                </Accordion.Trigger>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <p className="pb-6 text-[#8A8682] text-sm leading-relaxed">{faq.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </FadeIn>
      </div>
    </section>
  );
}

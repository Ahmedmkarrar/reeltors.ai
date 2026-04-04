'use client';
import { useInView } from '@/hooks/useInView';
import { ReactNode, ElementType } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
  as?: ElementType;
  threshold?: number;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 650,
  direction = 'up',
  distance = 32,
  className = '',
  as: Tag = 'div',
  threshold = 0.08,
}: Props) {
  const { ref, inView } = useInView(threshold);

  const initialTransform = {
    up: `translateY(${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    none: 'none',
  }[direction];

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) translateX(0)' : initialTransform,
        transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}

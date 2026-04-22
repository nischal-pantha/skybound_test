import { useEffect, useState, ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  const [phase, setPhase] = useState<'enter' | 'visible'>('enter');

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase('visible'));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`transition-all duration-400 ease-out will-change-[opacity,transform] ${
        phase === 'visible'
          ? 'opacity-100 translate-y-0 blur-0'
          : 'opacity-0 translate-y-3 blur-[2px]'
      } ${className}`}
      style={{ transitionDuration: '400ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {children}
    </div>
  );
};

interface StaggerChildrenProps {
  children: ReactNode[];
  staggerMs?: number;
  className?: string;
}

export const StaggerChildren = ({ children, staggerMs = 60, className = '' }: StaggerChildrenProps) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-fade-in"
          style={{
            animationDelay: `${index * staggerMs}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

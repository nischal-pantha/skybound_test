
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface UTCClockProps {
  embedded?: boolean;
  className?: string;
}

export const UTCClock = ({ embedded = false, className = '' }: UTCClockProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatUTCTime = (date: Date) => {
    return date.toUTCString().slice(17, 25); // Extract HH:MM:SS
  };

  const formatUTCDate = (date: Date) => {
    return date.toISOString().slice(0, 10); // Extract YYYY-MM-DD
  };

  if (embedded) {
    return (
      <div className={`flex items-center gap-1 lg:gap-2 ${className}`}>
        <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
        <div className="text-xs lg:text-sm font-mono">
          <div className="text-primary font-semibold">{formatUTCTime(time)} UTC</div>
          <div className="text-muted-foreground text-[10px] lg:text-xs">{formatUTCDate(time)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-2 right-2 lg:top-4 lg:right-4 z-[50] bg-background/95 backdrop-blur-sm border border-border rounded-lg px-2 py-1 lg:px-3 lg:py-2 shadow-lg pointer-events-none select-none">
      <div className="flex items-center gap-1 lg:gap-2">
        <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
        <div className="text-xs lg:text-sm font-mono">
          <div className="text-primary font-semibold">{formatUTCTime(time)} UTC</div>
          <div className="text-muted-foreground text-[10px] lg:text-xs">{formatUTCDate(time)}</div>
        </div>
      </div>
    </div>
  );
};

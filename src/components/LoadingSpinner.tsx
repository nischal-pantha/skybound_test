
import React from 'react';
import { Plane } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
      <div className="relative animate-bounce-in">
        <Plane className={`${sizeClasses[size]} text-primary animate-float`} />
        <div className="absolute inset-0 animate-spin">
          <div className={`${sizeClasses[size]} border-2 border-primary/20 border-t-primary rounded-full animate-pulse`}></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
          <div className={`${sizeClasses[size]} border border-primary/10 border-b-primary/30 rounded-full`}></div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm animate-fade-in hover:text-foreground transition-colors duration-200" style={{ animationDelay: '0.2s' }}>
        {message}
      </p>
    </div>
  );
};

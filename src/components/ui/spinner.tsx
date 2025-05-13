
import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('animate-spin rounded-full border-t-transparent', sizeClasses[size], className)}>
      <div className="h-full w-full rounded-full border-4 border-t-blue-500 border-b-blue-700 border-l-blue-600 border-r-blue-600"></div>
    </div>
  );
};

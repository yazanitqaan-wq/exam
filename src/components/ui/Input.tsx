import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pr-11',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

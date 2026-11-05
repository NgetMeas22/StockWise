import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={twMerge(
          clsx(
            'flex h-9 w-full rounded-[6px] border border-border bg-surface px-3 py-1 text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-danger focus:ring-danger',
            className
          )
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

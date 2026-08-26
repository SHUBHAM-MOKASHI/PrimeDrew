'use client';

import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(
  ({ label, error, helperText, leftIcon: LeftIcon, rightIcon: RightIcon, className, containerClassName, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-slate-950/70 text-slate-100 text-sm rounded-xl border border-slate-800 px-4 py-2.5 outline-none transition-all duration-200 placeholder:text-slate-500 shadow-sm',
              'focus:bg-slate-900 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15',
              LeftIcon && 'pl-10',
              RightIcon && 'pr-10',
              error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />
          {RightIcon && (
            <div className="absolute right-3.5 text-slate-400 flex items-center justify-center">
              <RightIcon className="w-4 h-4" />
            </div>
          )}
        </div>
        {error ? (
          <span className="text-xs font-medium text-rose-400">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

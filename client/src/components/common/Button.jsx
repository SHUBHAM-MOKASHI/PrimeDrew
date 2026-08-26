'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none cursor-pointer';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-600/30 border border-cyan-400/30 focus:ring-cyan-400',
    secondary: 'bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-slate-700 shadow-sm backdrop-blur-md focus:ring-slate-400',
    outline: 'border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-cyan-500 text-slate-200 shadow-sm backdrop-blur-md focus:ring-cyan-500',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-600/25 border border-rose-500/30 focus:ring-rose-500',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/80 focus:ring-slate-700'
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3.5 rounded-2xl gap-2.5 font-semibold'
  };

  return (
    <button
      disabled={isDisabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4" />
      ) : null}
      <span>{children}</span>
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4" />}
    </button>
  );
};

export default Button;

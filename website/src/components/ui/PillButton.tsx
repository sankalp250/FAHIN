import React from 'react';
import { cn } from '@/lib/utils';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neutral';
}

const PillButton: React.FC<PillButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}) => {
  const variants = {
    primary: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30",
    secondary: "bg-surface text-ink-soft neu hover:text-ink",
    neutral: "bg-ink text-white",
  };

  return (
    <button 
      className={cn(
        "rounded-full px-6 py-2.5 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default PillButton;

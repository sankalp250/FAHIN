import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hasNeuShadow?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, hasNeuShadow = true, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "glass rounded-[32px] p-6 transition-all duration-300",
        hasNeuShadow && "neu",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;

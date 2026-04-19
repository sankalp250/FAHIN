import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatWidgetProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

const StatWidget: React.FC<StatWidgetProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  color = "text-accent", 
  trend,
  className 
}) => {
  return (
    <div className={cn(
      "neu bg-surface rounded-[32px] p-6 flex flex-col items-center justify-center min-w-[200px] animate-fade-in",
      className
    )}>
      {Icon && (
        <div className="mb-3 p-2 rounded-full bg-white/50 text-ink-soft">
          <Icon size={20} />
        </div>
      )}
      <span className="text-sm font-medium text-ink-soft mb-1">{label}</span>
      <span className={cn("text-3xl font-bold font-display", color)}>{value}</span>
      {trend && (
        <span className={cn(
          "text-xs font-bold mt-2",
          trend.isUp ? "text-danger" : "text-safe"
        )}>
          {trend.isUp ? "↑" : "↓"} {trend.value}% vs last week
        </span>
      )}
    </div>
  );
};

export default StatWidget;

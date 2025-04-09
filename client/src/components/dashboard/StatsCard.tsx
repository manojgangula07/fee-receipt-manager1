import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName
}: StatsCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", iconClassName || "bg-primary-100 text-primary-600")}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="mt-4">
          <div className={cn(
            "flex items-center text-sm",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={trend.isPositive 
                  ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                  : "M19 14l-7 7m0 0l-7-7m7 7V3"
                } 
              />
            </svg>
            <span className="ml-1">{trend.value}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

export default StatsCard;

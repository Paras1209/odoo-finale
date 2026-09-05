// ===========================================
// DealFlow360 - Badge Component
// ===========================================
// PHASE 0: Reusable badge/status indicator.
// ===========================================

import { cn } from '@/lib/utils';
import { statusColors } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  status?: string; // Use status to auto-pick color from statusColors
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function Badge({ children, variant = 'default', status, className }: BadgeProps) {
  // If status is provided, try to get color from statusColors
  const colorClass = status 
    ? statusColors[status] || variantClasses.default
    : variantClasses[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}

import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const variantClasses = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20',
  outline: 'bg-transparent border border-slate-300 text-slate-600',
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

const dotColors = {
  default: 'bg-slate-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
  outline: 'bg-slate-400',
};

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  dot = false,
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

// Status badge with predefined mappings
export interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  // Quotation statuses
  DRAFT: { label: 'Draft', variant: 'default' },
  PENDING_MANAGER_APPROVAL: { label: 'Pending Manager', variant: 'warning' },
  PENDING_FINANCE_APPROVAL: { label: 'Pending Finance', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'info' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
  
  // Fulfillment statuses
  PENDING: { label: 'Pending', variant: 'warning' },
  PROCESSING: { label: 'Processing', variant: 'info' },
  SHIPPED: { label: 'Shipped', variant: 'purple' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  
  // Invoice statuses
  UNPAID: { label: 'Unpaid', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'danger' },
  PARTIALLY_PAID: { label: 'Partial', variant: 'info' },
  
  // Counter offer statuses
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  COUNTERED: { label: 'Countered', variant: 'purple' },
  
  // Customer tiers
  GOLD: { label: 'Gold', variant: 'warning' },
  SILVER: { label: 'Silver', variant: 'default' },
  BRONZE: { label: 'Bronze', variant: 'default' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status.replace(/_/g, ' '), variant: 'default' as const };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Tier badge
export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  const tierColors: Record<string, string> = {
    GOLD: 'bg-amber-100 text-amber-800',
    SILVER: 'bg-slate-200 text-slate-700',
    BRONZE: 'bg-orange-100 text-orange-800',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
      tierColors[tier] || 'bg-slate-100 text-slate-700',
      className
    )}>
      {tier}
    </span>
  );
}

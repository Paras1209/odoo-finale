import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function Card({ 
  children, 
  className, 
  padding = 'md', 
  hover = false,
  interactive = false,
  onClick 
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/60 shadow-sm',
        paddingClasses[padding],
        hover && 'transition-all duration-200 hover:shadow-md hover:border-slate-300/60',
        interactive && 'cursor-pointer active:scale-[0.99]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  children, 
  className,
  action
}: { 
  children: React.ReactNode; 
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 pb-4', className)}>
      <div className="flex-1 min-w-0">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ 
  children, 
  className,
  as: Component = 'h3'
}: { 
  children: React.ReactNode; 
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}) {
  return (
    <Component className={cn('text-lg font-semibold text-slate-900', className)}>
      {children}
    </Component>
  );
}

export function CardDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <p className={cn('text-sm text-slate-500 mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({ 
  children, 
  className,
  border = true
}: { 
  children: React.ReactNode; 
  className?: string;
  border?: boolean;
}) {
  return (
    <div className={cn(
      'pt-4 mt-4 flex items-center gap-3',
      border && 'border-t border-slate-100',
      className
    )}>
      {children}
    </div>
  );
}

// Stat Card variant
export function StatCard({
  label,
  value,
  change,
  changeType,
  icon,
  className
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 truncate">
            {value}
          </p>
          {change && (
            <p className={cn(
              'text-sm mt-1',
              changeType === 'up' && 'text-emerald-600',
              changeType === 'down' && 'text-red-600',
              changeType === 'neutral' && 'text-slate-500'
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-2 bg-slate-100 rounded-lg text-slate-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

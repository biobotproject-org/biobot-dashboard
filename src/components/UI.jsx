import { cn } from '../utils/utils';

export const Button = ({ className, variant = 'default', ...props }) => {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        className
      )}
      {...props}
    />
  );
};

export const Card = ({ className, title, action, children, ...props }) => {
  return (
    <div className={cn('card', className)} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <span className="text-[13px] font-semibold text-text2 uppercase tracking-wider">{title}</span>}
          {action && <div className="text-xs text-accent cursor-pointer hover:underline">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export const Badge = ({ children, status, className }) => {
  const getColors = (s) => {
    switch (s) {
      case 'active': return 'bg-green-500/10 text-green-300';
      case 'inactive':
      case 'hibernation':
      case 'resolved': return 'bg-gray-500/15 text-gray-400';
      case 'maintenance':
      case 'acknowledged': return 'bg-amber-500/12 text-amber-300';
      case 'critical': return 'bg-red-500/15 text-red-300';
      case 'high': return 'bg-amber-500/15 text-amber-300';
      case 'medium': return 'bg-blue-500/15 text-blue-300';
      case 'low': return 'bg-green-500/15 text-green-300';
      default: return 'bg-gray-500/15 text-gray-400';
    }
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-tight',
      getColors(status),
      className
    )}>
      {['active', 'inactive', 'maintenance', 'hibernation'].includes(status) && (
        <span className="w-1.25 h-1.25 rounded-full bg-current" />
      )}
      {children || status}
    </span>
  );
};

export const Input = ({ className, label, ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-xs font-semibold text-text2 mb-1.5 uppercase tracking-wide">{label}</label>}
      <input className={cn('input', className)} {...props} />
    </div>
  );
};

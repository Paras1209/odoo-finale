import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Base Input
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const inputSizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helper,
    inputSize = 'md',
    leftIcon,
    rightIcon,
    id, 
    ...props 
  }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-white border border-slate-200 rounded-lg',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              inputSizeClasses[inputSize],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-300 focus:ring-red-500/10 focus:border-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId} 
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg',
            'placeholder:text-slate-400 min-h-[80px] resize-y',
            'focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            error && 'border-red-300 focus:ring-red-500/10 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options?: { value: string; label: string; disabled?: boolean }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helper, id, options, children, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId} 
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg',
            'appearance-none bg-no-repeat bg-right pr-10 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            error && 'border-red-300 focus:ring-red-500/10 focus:border-red-500',
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundSize: '1.5rem 1.5rem',
            backgroundPosition: 'right 0.5rem center',
          }}
          {...props}
        >
          {options ? (
            options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Search Input
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : undefined
        }
        className={cn(className)}
        value={value}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { Input, Textarea, Select, SearchInput };

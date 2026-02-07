import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}
interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {}
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, ...props }, ref) => {
    return (
      <select
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={className} {...props} />;
  }
);

export const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <option ref={ref} className={className} {...props}>
        {children}
      </option>
    );
  }
);

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button ref={ref} className={className} {...props}>
        {children}
      </button>
    );
  }
);

export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, ...props }, ref) => {
    return (
      <span ref={ref} className={className} {...props}>
        {placeholder}
      </span>
    );
  }
);

Select.displayName = 'Select';
SelectContent.displayName = 'SelectContent';
SelectItem.displayName = 'SelectItem';
SelectTrigger.displayName = 'SelectTrigger';
SelectValue.displayName = 'SelectValue';
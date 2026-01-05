// Artifact Form Primitives
// Reusable form components for action panels

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// ============================================
// FORM GROUP
// ============================================

export interface FormGroupProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const FormGroup = ({
  label,
  hint,
  error,
  required,
  children,
  className = '',
}: FormGroupProps) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-[13px] font-medium text-slate-700">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && (
      <p className="text-xs text-slate-400">{hint}</p>
    )}
    {error && (
      <p className="text-xs text-rose-500">{error}</p>
    )}
  </div>
);

// ============================================
// TEXT INPUT
// ============================================

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: boolean;
}

export const TextInput = ({
  icon,
  error,
  className = '',
  ...props
}: TextInputProps) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
    )}
    <input
      {...props}
      className={`
        w-full px-3 py-2.5 text-sm text-slate-900 bg-white
        border rounded-xl transition-all outline-none
        placeholder:text-slate-400
        ${icon ? 'pl-10' : ''}
        ${error
          ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
          : 'border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100'
        }
        ${className}
      `}
    />
  </div>
);

// ============================================
// SELECT
// ============================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export const SelectInput = ({
  options,
  placeholder,
  error,
  className = '',
  ...props
}: SelectInputProps) => (
  <div className="relative">
    <select
      {...props}
      className={`
        w-full px-3 py-2.5 text-sm text-slate-900 bg-white appearance-none
        border rounded-xl transition-all outline-none cursor-pointer
        ${error
          ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
          : 'border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100'
        }
        ${className}
      `}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
      <ChevronDown size={16} strokeWidth={1.5} />
    </div>
  </div>
);

// ============================================
// CHECKBOX
// ============================================

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const Checkbox = ({
  checked,
  onChange,
  label,
  description,
  disabled,
}: CheckboxProps) => (
  <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div className="relative mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`
          w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
          ${checked
            ? 'bg-violet-600 border-violet-600'
            : 'bg-white border-slate-300 hover:border-slate-400'
          }
        `}
      >
        {checked && <Check size={14} className="text-white" strokeWidth={2.5} />}
      </div>
    </div>
    <div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {description && (
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      )}
    </div>
  </label>
);

// ============================================
// TOGGLE
// ============================================

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const Toggle = ({
  checked,
  onChange,
  label,
  description,
  disabled,
}: ToggleProps) => (
  <label className={`flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {description && (
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative w-11 h-6 rounded-full transition-colors
        ${checked ? 'bg-violet-600' : 'bg-slate-200'}
      `}
    >
      <span
        className={`
          absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  </label>
);

// ============================================
// RADIO GROUP
// ============================================

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'cards';
}

export const RadioGroup = ({
  name,
  options,
  value,
  onChange,
  variant = 'default',
}: RadioGroupProps) => {
  if (variant === 'cards') {
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
              ${value === option.value
                ? 'border-violet-500 bg-violet-50/50'
                : 'border-slate-200 hover:border-slate-300'
              }
              ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
              className="sr-only"
            />
            <div
              className={`
                w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0
                ${value === option.value ? 'border-violet-600' : 'border-slate-300'}
              `}
            >
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-violet-600" />
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700">{option.label}</span>
              {option.description && (
                <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-center gap-3 cursor-pointer ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => !option.disabled && onChange(option.value)}
            disabled={option.disabled}
            className="sr-only"
          />
          <div
            className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${value === option.value ? 'border-violet-600' : 'border-slate-300'}
            `}
          >
            {value === option.value && (
              <div className="w-2 h-2 rounded-full bg-violet-600" />
            )}
          </div>
          <span className="text-sm text-slate-700">{option.label}</span>
        </label>
      ))}
    </div>
  );
};

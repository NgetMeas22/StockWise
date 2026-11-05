import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, hint, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-text flex items-center justify-between">
        <span>
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal text-text-muted">{hint}</span>}
      </label>
      {children}
      {error && <span className="text-xs text-danger mt-0.5">{error}</span>}
    </div>
  );
}


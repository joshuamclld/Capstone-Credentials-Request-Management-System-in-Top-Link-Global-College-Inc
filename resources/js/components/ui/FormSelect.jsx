import React from 'react';

const DEFAULT_CLASS = 'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed';

export default function FormSelect({
  label,
  name,
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  error,
  className = '',
}) {
  const selectId = id || name;

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="block font-label-md text-label-md text-on-surface-variant mb-2">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${DEFAULT_CLASS} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const label = typeof opt === 'object' ? opt.label : opt;
          return <option key={val} value={val}>{label}</option>;
        })}
      </select>
      {error && (
        <p className="mt-1.5 text-body-sm text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

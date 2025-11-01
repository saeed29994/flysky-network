import React from 'react';

interface CustomDateTimePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = '',
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
          {label}
        </label>
      )}

      <div
        className="
          relative group rounded-xl border border-white/20 bg-white/5
          transition-all duration-300
          hover:border-purple-500/70 hover:shadow-[0_0_10px_rgba(168,85,247,0.5)]
          focus-within:border-purple-500/70 focus-within:shadow-[0_0_12px_rgba(168,85,247,0.6)]
        "
      >
        <input
          type="datetime-local"
          disabled={disabled}
          value={value ? value.toISOString().slice(0, 16) : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : null;
            onChange(date);
          }}
          placeholder={placeholder}
          className="
            w-full bg-transparent rounded-xl px-4 py-2.5 text-sm text-white
            placeholder-gray-400 focus:outline-none cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
      </div>
    </div>
  );
};

export default CustomDateTimePicker;

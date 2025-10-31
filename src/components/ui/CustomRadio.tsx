import React from "react";

interface CustomRadioProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const CustomRadio: React.FC<CustomRadioProps> = ({
  label,
  value,
  checked,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <label
      className={`group flex items-center gap-2 text-sm text-white/90 select-none transition-opacity ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <span
        className={`relative flex items-center justify-center h-5 w-5 rounded-full border transition-all duration-200 ${
          checked
            ? "border-[#c084fc]"
            : "border-white/40"
        } ${!disabled ? "group-hover:border-[#c084fc] group-hover:shadow-[0_0_8px_#c084fc]" : ""}`}
      >
        {checked && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#c084fc] transition-all" />
        )}
        <input
          type="radio"
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          disabled={disabled}
          className="absolute opacity-0 w-full h-full cursor-pointer"
        />
      </span>
      <span>{label}</span>
    </label>
  );
};

export default CustomRadio;

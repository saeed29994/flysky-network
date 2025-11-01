import React from "react";
import { Check } from "lucide-react";

interface CustomCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
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
        className={`relative flex items-center justify-center h-5 w-5 rounded-md border transition-all duration-200 ${
          checked
            ? "border-[#c084fc]"
            : "border-white/40"
        } ${!disabled ? "group-hover:border-[#c084fc] group-hover:shadow-[0_0_8px_#c084fc]" : ""}`}
      >
        {checked && (
          <Check
            className="w-3.5 h-3.5 text-[#c084fc] transition-all"
            strokeWidth={3}
          />
        )}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="absolute opacity-0 w-full h-full cursor-pointer"
        />
      </span>
      <span>{label}</span>
    </label>
  );
};

export default CustomCheckbox;

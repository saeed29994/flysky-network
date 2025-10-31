import React from 'react';

interface CustomTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const CustomTextArea: React.FC<CustomTextAreaProps> = ({ label, ...props }) => {
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
        <textarea
          {...props}
          onPaste={props.onPaste || (() => {})}
          className="
            w-full bg-transparent rounded-xl px-4 py-2.5 text-sm text-white resize-none 
            placeholder-gray-400 focus:outline-none
          "
        />
      </div>
    </div>
  );
};

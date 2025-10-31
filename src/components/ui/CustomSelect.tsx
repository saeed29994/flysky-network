import React, { useEffect, useMemo, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  height?: number;
}

const ARROW_SVG_DATA_URL = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>`
);

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  height = 38, // ✅ الارتفاع الافتراضي 38px
}) => {
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

  // 🔁 تحديد اتجاه الصفحة تلقائيًا ومراقبته عند التغيير
  useEffect(() => {
    if (typeof window === "undefined") return;

    const getDir = () =>
      (document.documentElement.getAttribute("dir") ||
        document.body.getAttribute("dir") ||
        "ltr") as "ltr" | "rtl";

    setDir(getDir());

    const observer = new MutationObserver(() => setDir(getDir()));
    if (document.documentElement)
      observer.observe(document.documentElement, { attributes: true });
    if (document.body) observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // 🎨 موضع السهم مع العكس الصحيح
  const backgroundStyle = useMemo(() => {
    // ✅ لاحظ: هنا عكسنا الاتجاه بحيث يظهر السهم في الجهة الصحيحة
    const pos = dir === "rtl" ? "left 10px center" : "right 10px center";

    return {
      backgroundImage: `url("data:image/svg+xml,${ARROW_SVG_DATA_URL}")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: pos,
      height: `${height}px`,
      lineHeight: `${height}px`,
    } as React.CSSProperties;
  }, [dir, height]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        appearance-none block w-full px-4 text-sm sm:text-base text-white
        bg-white/5 border border-white/20 rounded-xl cursor-pointer
        transition-all duration-300
        hover:border-purple-500/70 hover:shadow-[0_0_10px_rgba(168,85,247,0.5)]
        focus:outline-none focus:border-purple-500/70 focus:shadow-[0_0_12px_rgba(168,85,247,0.6)]
        ${className}
      `}
      style={backgroundStyle}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-white bg-[#663390]"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default CustomSelect;

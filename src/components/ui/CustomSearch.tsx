import React, { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface CustomSearchProps {
  placeholder?: string;
  onSearch?: (value: string) => Promise<void> | void;
  onCancel?: () => void; // السماح للمكونات الأخرى بالتفاعل عند الإلغاء
  className?: string;
}

const CustomSearch: React.FC<CustomSearchProps> = ({
  placeholder = "البحث...",
  onSearch,
  onCancel,
  className = "",
}) => {
  const [value, setValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

  // 🔁 مراقبة اتجاه الصفحة (LTR/RTL)
  useEffect(() => {
    const getDir = () =>
      (document.documentElement.getAttribute("dir") ||
        document.body.getAttribute("dir") ||
        "ltr") as "ltr" | "rtl";

    setDir(getDir());

    const observer = new MutationObserver(() => setDir(getDir()));
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // 🟣 تنفيذ البحث
  const handleSearch = async () => {
    if (!value.trim() || !onSearch || isLoading) return;

    try {
      setIsLoading(true);
      setIsSearching(true);
      await onSearch(value.trim());
    } finally {
      setIsLoading(false);
    }
  };

  // 🟣 إلغاء البحث
  const handleCancel = () => {
    setValue("");
    setIsSearching(false);
    if (onCancel) onCancel();
  };

  // 🟣 عند الضغط على الزر
  const handleButtonClick = () => {
    if (isSearching) {
      handleCancel();
    } else {
      handleSearch();
    }
  };

  return (
    <div
      dir={dir}
      className={`
        flex w-full items-center rounded-xl border border-white/20 bg-white/5
        transition-all duration-300 overflow-hidden
        hover:border-purple-500/70 hover:shadow-[0_0_10px_rgba(168,85,247,0.5)]
        focus-within:border-purple-500/70 focus-within:shadow-[0_0_12px_rgba(168,85,247,0.6)]
        ${className}
      `}
      style={{
        height: "38px",
        flexDirection: dir === "rtl" ? "row-reverse" : "row",
      }}
    >
      {/* 🟣 حاوية الإدخال */}
      <div className="flex-1 h-full">
        <style>
          {`
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
              transition: background-color 9999s ease-in-out 0s;
              -webkit-text-fill-color: white !important;
              box-shadow: 0 0 0px 1000px transparent inset !important;
            }
          `}
        </style>
        <input
          type="text"
          value={value}
          dir="auto"
          onChange={(e) => {
            const newValue = e.target.value;
            setValue(newValue);

            if (newValue.trim() === "") {
              // ✅ النص فارغ => إعادة الزر إلى البحث وإطلاق onCancel
              if (isSearching) setIsSearching(false);
              if (onCancel) onCancel();
            } else {
              // ✅ نص جديد بعد البحث => إعادة الزر إلى البحث
              if (isSearching) setIsSearching(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
            if (e.key === "Escape") handleCancel();
          }}
          placeholder={placeholder}
          className={`w-full h-full bg-transparent text-white placeholder-gray-300
            px-4 text-sm sm:text-base focus:outline-none
            ${dir === "rtl" ? "text-right" : "text-left"}
          `}
        />
      </div>

      {/* 🟣 حاوية الزر */}
      <div
        className="flex items-center justify-center"
        style={{
          width: "40px",
          order: dir === "rtl" ? -1 : 1,
        }}
      >
        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          title={isSearching ? "إلغاء البحث" : "بدء البحث"}
          className={`
            flex items-center justify-center w-full h-full
            transition-all duration-300
            ${isSearching ? "text-red-400" : "text-gray-300"}
            ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:text-purple-400 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"}
          `}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-purple-400" />
          ) : isSearching ? (
            <X size={18} />
          ) : (
            <Search size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomSearch;

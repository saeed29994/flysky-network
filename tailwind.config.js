/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",            // لو يوجد HTML في مجلد public
    "./components/**/*.{js,ts,jsx,tsx}", // لو تستخدم مجلد components
    "./pages/**/*.{js,ts,jsx,tsx}",      // لو عندك صفحات داخل pages
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // الكلاسات التي يجب الحفاظ عليها دائمًا
    "text-yellow-400",
    "text-yellow-300",
    "text-sky-400",
    "bg-gray-900",
    "bg-opacity-80",
    "backdrop-blur-md",
    "text-xm", // احتمال أنها مخصصة أو خطأ إملائي (يفترض text-sm أو text-xs)
    "hover:text-yellow-300",
    "hover:text-red-300",
    "text-red-400",
    "rounded-full",
    "w-6",
    "h-6",
    "shadow-md",
    "px-8",
    "py-4",
    "fixed",
    "top-0",
    "left-0",
    "right-0",
    "z-50",
    "items-center",
    "justify-between",
    "mr-1",
    "space-x-6",
    "object-cover"
  ]
}

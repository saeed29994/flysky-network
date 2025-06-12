/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // تأكد أن هذا يشمل جميع المسارات
  ],
  safelist: [
    "text-yellow-400",
    "hover:text-yellow-300",
    "text-red-400",
    "hover:text-red-300",
    "text-sky-400",
    "bg-gray-900",
    "bg-opacity-80",
    "backdrop-blur-md",
    "rounded-full",
    "fixed",
    "top-0",
    "left-0",
    "right-0",
    "z-50",
    "px-4",
    "px-8",
    "py-3",
    "py-4",
    "shadow-md",
    "text-xs",
    "text-xm",
    "font-semibold",
    "w-2",
    "h-2",
    "w-4",
    "h-4",
    "w-5",
    "h-5",
    "w-6",
    "h-6",
    "mb-1",
    "mr-1",
    "mr-2",
    "object-cover",
    "space-x-6",
    "flex",
    "items-center",
    "justify-between",
    "relative",
    "hover:text-yellow-300",
    "hover:text-red-300",
    "text-center",
    "text-gray-500"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}

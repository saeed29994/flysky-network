/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
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
      screens: {
        'xs': '375px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      backgroundImage: {
        'landing-gradient': 'linear-gradient(to bottom, #1e1353, #2a1668, #331a7e, #3d1d94, #4620ab)',
        'dark-landing-gradient': 'radial-gradient(ellipse at top, #1a1242 0%, #110D24 50%, #0c0918 100%)',
        'header-gradient': 'radial-gradient(73.68% 73.68% at 50% 26.32%, rgba(7, 16, 104, 0.67) 0%, rgba(33, 28, 65, 0) 100%)',
        'button-gradient': 'linear-gradient(90deg, #FABA33 27.38%, #4F46E5 73.83%)',
        'button-gradient-hover': 'linear-gradient(90deg, #FABA33 27.38%, #4F46E5 73.83%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
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
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 8s linear infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DealFlow360 brand colors
        primary: {
          DEFAULT: '#3525cd',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          container: '#4f46e5',
        },
        secondary: '#00668a',
        surface: '#ffffff',
        'surface-canvas': '#FAFCFF',
        'surface-card': '#FFFFFF',
        'text-primary': '#090D1A',
        'text-secondary': '#5E697D',
        'text-tertiary': '#94A3B8',
        'border-subtle': '#E8ECF2',
        // Status colors for quotation states
        status: {
          draft: '#6b7280',       // gray-500
          pending: '#f59e0b',     // amber-500
          approved: '#10b981',    // emerald-500
          rejected: '#ef4444',    // red-500
          confirmed: '#3b82f6',   // blue-500
          fulfilling: '#8b5cf6',  // violet-500
          billed: '#06b6d4',      // cyan-500
          cancelled: '#9ca3af',   // gray-400
        },
        // Customer tier colors
        tier: {
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

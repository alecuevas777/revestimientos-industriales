/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F3F5F7',
        ink: '#111827',
        muted: '#6B7280',
        line: '#E5E7EB',
        brand: {
          DEFAULT: '#1D4ED8',
          dark: '#1E3A8A',
          light: '#DBEAFE',
        },
        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F5F5',
        ink: '#121212',
        muted: '#6B7280',
        line: '#E5E5E5',
        brand: {
          DEFAULT: '#F96706',
          dark: '#121212',
          light: '#FFE8D6',
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

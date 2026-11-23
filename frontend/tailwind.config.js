/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F5C842',
          hover: '#E5B832',
          light: '#FFF4CC',
        },
        'soft-yellow': '#FFF4CC',
        warm: '#FFF9EC',
        'primary-text': '#252525',
        secondary: '#777777',
        border: '#EEEEEE',
        stock: {
          green: '#22C55E',
          orange: '#F97316',
          red: '#EF4444',
        },
      },
      boxShadow: {
        card: '0 2px 8px -1px rgba(0, 0, 0, 0.06), 0 1px 3px -1px rgba(0, 0, 0, 0.04)',
        hover: '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

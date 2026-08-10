/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'surface-1': 'rgb(var(--surface-1) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
      },
      keyframes: {
        'scan-line': {
          '0%': { top: '4px', opacity: '1' },
          '50%': { opacity: '0.8' },
          '100%': { top: 'calc(100% - 4px)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'toast-in': {
          '0%': { transform: 'translateY(8px) scale(0.95)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'scan-line': 'scan-line 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.3s ease-out',
        'toast-in': 'toast-in 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'glow-indigo': '0 0 8px rgba(99, 102, 241, 0.6)',
      },
    },
  },
  plugins: [],
}

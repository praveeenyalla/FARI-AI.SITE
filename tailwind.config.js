/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'aurora-1': 'aurora 20s linear infinite',
        'aurora-2': 'aurora 25s linear infinite reverse',
        'aurora-3': 'aurora 30s linear infinite',
         'sphere-spin-1': 'sphere-spin 15s linear infinite',
         'sphere-spin-2': 'sphere-spin 25s linear infinite reverse',
         'scaleIn': 'scaleIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
         aurora: {
          '0%': { transform: 'translate(var(--tw-translate-x-start), var(--tw-translate-y-start)) rotate(0deg) scale(1)' },
          '50%': { transform: 'translate(var(--tw-translate-x-end), var(--tw-translate-y-end)) rotate(1.5)' },
          '100%': { transform: 'translate(var(--tw-translate-x-start), var(--tw-translate-y-start)) rotate(360deg) scale(1)' },
        },
         'sphere-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
         },
         scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

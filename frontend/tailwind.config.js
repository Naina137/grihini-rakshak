/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060a14',
          900: '#0a0f1d',
          850: '#0e1628',
          800: '#141f36',
          700: '#1e2e4f',
          600: '#2c426e',
        },
        sentinel: {
          cyan: '#06b6d4',
          cyanGlow: '#22d3ee',
          blue: '#3b82f6',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444',
          crimson: '#dc2626',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 3s linear infinite',
        'flicker': 'flicker 0.4s ease-in-out infinite alternate',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        flicker: {
          '0%': { opacity: '0.85' },
          '100%': { opacity: '1.0' },
        }
      }
    },
  },
  plugins: [],
}

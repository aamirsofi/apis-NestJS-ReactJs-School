/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
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
        },
        // Refined gradient colors
        gradient: {
          start: '#6366f1', // indigo-500
          middle: '#8b5cf6', // purple-500
          end: '#ec4899', // pink-500
        },
      },
      // Refined spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Better shadows
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      // Better border radius
      borderRadius: {
        '4xl': '2rem',
      },
      // Typography improvements
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      lineHeight: {
        'extra-tight': '1.1',
        'super-tight': '1.05',
      },
    },
  },
  plugins: [],
}

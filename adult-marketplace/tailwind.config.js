/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      colors: {
        // Dark theme (default)
        dark: {
          bg: '#000000',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          text: '#ffffff',
          muted: '#9ca3af',
        },
        // Light theme
        light: {
          bg: '#ffffff',
          surface: '#f8f8f8',
          border: '#e5e5e5',
          text: '#000000',
          muted: '#6b7280',
        },
        // Brand colors (work in both themes)
        primary: '#facc15', // yellow-400
        secondary: '#f59e0b', // amber-500
      },
      animation: {
        'like-bounce': 'like-bounce 0.6s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-in',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'like-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.3)' },
          '50%': { transform: 'scale(0.9)' },
          '75%': { transform: 'scale(1.1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
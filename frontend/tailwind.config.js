/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e0f7ff',
          100: '#b3ecff',
          200: '#80e0ff',
          300: '#4dd9ff',
          400: '#26d0ff',
          500: '#00c8ff',
          600: '#00a8d8',
          700: '#0088b0',
          800: '#006888',
          900: '#004860',
        },
        dark: {
          bg: '#0f1419',
          card: '#1a2b36',
          inner: '#0d1117',
        },
        accent: {
          success: '#00d084',
          danger: '#ff4444',
          warning: '#ffb84d',
        }
      },
    },
  },
  plugins: [],
}


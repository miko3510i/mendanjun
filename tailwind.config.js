/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f9ff',
          100: '#e3edff',
          200: '#cbdcff',
          300: '#a0c2ff',
          400: '#6096ff',
          500: '#2f6deb',
          600: '#1c52c7',
          700: '#1a44a0',
          800: '#193c7f',
          900: '#182e58',
        },
      },
    },
  },
  plugins: [],
}

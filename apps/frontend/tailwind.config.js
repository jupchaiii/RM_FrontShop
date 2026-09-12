/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#007aff',
          dark: '#0066d6',
          light: '#5ac8fa',
        },
      },
    },
  },
  plugins: [],
};

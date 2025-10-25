/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-gray-500',
    'bg-red-500',
    'bg-green-500',
    'border-gray-400',
    'border-red-500',
    'border-green-500',
    'border-r-gray-400',
    'border-r-red-500',
    'border-r-green-500',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


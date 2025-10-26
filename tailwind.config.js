/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Note: safelist is not supported in Tailwind v4
  // Use @source inline() in index.css instead for dynamic classes
  theme: {
    extend: {},
  },
  plugins: [],
}


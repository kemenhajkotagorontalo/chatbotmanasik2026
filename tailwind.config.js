/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{App,types}.{ts,tsx}",
    "./{index,vite.config}.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
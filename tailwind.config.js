/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          light: '#1e293b',
          accent: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}

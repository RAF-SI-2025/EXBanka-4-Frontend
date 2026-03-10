/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Montserrat', 'system-ui', 'sans-serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 4px 24px 0 rgba(15,23,42,0.08)',
        'card-hover': '0 8px 40px 0 rgba(15,23,42,0.14)',
      },
    },
  },
  plugins: [],
}

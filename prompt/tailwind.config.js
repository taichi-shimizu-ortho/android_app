/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'prompter-bg': '#0f172a',
        'prompter-text': '#f8fafc',
        'prompter-accent': '#22c55e',
      }
    },
  },
  plugins: [],
}

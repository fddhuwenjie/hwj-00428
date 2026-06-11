/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: '#1E3A5F',
        accent: '#D4A843',
        success: '#2ECC71',
        danger: '#E74C3C',
        bg: '#F8F9FA',
      },
    },
  },
  plugins: [],
};

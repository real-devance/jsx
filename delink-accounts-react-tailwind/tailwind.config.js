/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          500: "#4f2ee8",
          600: "#4525d7",
          700: "#3920b5"
        }
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.02)"
      }
    }
  },
  plugins: []
};
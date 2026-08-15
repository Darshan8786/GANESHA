/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#14532d",
          greenlight: "#166534",
          gold: "#d97706",
          goldlight: "#f59e0b",
          cream: "#fefce8",
          sand: "#faf7ed",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        lift: "0 6px 20px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: "#FFF7ED",
        ink: "#0F172A",
        violet: { 500: "#8B5CF6", 600: "#7C3AED" },
        brand: { green: "#10B981", blue: "#0EA5E9", purple: "#8B5CF6", orange: "#F59E0B", red: "#EF4444", yellow: "#FACC15" }
      },
      borderRadius: { "4xl": "2rem" },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,0.06)", card: "0 12px 40px rgba(0,0,0,0.08)" },
      fontFamily: { display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"] }
    }
  },
  plugins: []
};

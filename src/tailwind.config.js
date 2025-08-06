/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colores personalizados de Son-IA
        "sonia-purple": "#8B5CF6",
        "sonia-blue": "#3B82F6",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "loading-bar": "loading-bar 2s ease-in-out infinite",
        "float-delayed": "float 3s ease-in-out 1.5s infinite",
        enter: "enter 0.2s ease-out",
        leave: "leave 0.15s ease-in forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          from: { boxShadow: "0 0 10px -2px rgba(139, 92, 246, 0.4)" },
          to: { boxShadow: "0 0 20px -2px rgba(139, 92, 246, 0.8)" },
        },
        "loading-bar": {
          "0%": { width: "0%" },
          "50%": { width: "60%" },
          "100%": { width: "100%" },
        },
        enter: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        leave: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.9)" },
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Open Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        ai: "0 4px 20px -2px rgba(139, 92, 246, 0.25)",
        "ai-lg": "0 10px 40px -5px rgba(139, 92, 246, 0.3)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

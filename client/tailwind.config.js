/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in-out": "fadeInOut 3s ease-in-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slideIn 0.2s ease-out",
        "slide-out": "slideOut 0.2s ease-in",
      },
      keyframes: {
        fadeInOut: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "10%": { opacity: "1", transform: "translateY(0)" },
          "90%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideOut: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

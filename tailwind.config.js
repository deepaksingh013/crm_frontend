module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Poppins everywhere (font-sans is the default font for the whole app)
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Compact type scale: headings are smaller than Tailwind defaults
      fontSize: {
        xs: ["0.8rem", "1.15rem"],
        lg: ["1.0625rem", "1.5rem"],
        xl: ["1.125rem", "1.625rem"],
        "2xl": ["1.25rem", "1.75rem"],
        "3xl": ["1.5rem", "2rem"],
        "4xl": ["1.75rem", "2.25rem"],
        "5xl": ["2rem", "2.5rem"],
      },
      // Tighter large spacing (padding / margin / gap) for a compact layout
      spacing: {
        5: "1.125rem",
        6: "1.25rem",
        7: "1.5rem",
        8: "1.75rem",
        10: "2.25rem",
      },
    },
  },
  plugins: [],
};

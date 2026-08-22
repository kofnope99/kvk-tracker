/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1613",
        panel: "#241F1A",
        panel2: "#2E2721",
        panel3: "#3A3128",
        hairline: "#4A3F33",
        brass: "#B8862E",
        brassBright: "#D4A542",
        drab: "#6B7F45",
        drabBright: "#84995A",
        flare: "#8C2F2A",
        flareBright: "#A63F39",
        paper: "#E8DCC0",
        steel: "#A79A87",
        steelDim: "#6B6152",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        data: ["var(--font-data)"],
      },
    },
  },
  plugins: [],
};

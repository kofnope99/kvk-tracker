/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16191C",
        panel: "#202327",
        panel2: "#282C30",
        panel3: "#33383D",
        hairline: "#454B52",
        brass: "#B8862E",
        brassBright: "#D4A542",
        drab: "#6B7F45",
        drabBright: "#84995A",
        flare: "#8C2F2A",
        flareBright: "#A63F39",
        paper: "#E8DCC0",
        steel: "#9A9488",
        steelDim: "#635D53",
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

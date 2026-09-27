/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14171A",
        panel: "#1B1F23",
        panel2: "#20252A",
        panel3: "#262B31",
        hairline: "#3A3F45",
        brass: "#C9A24B",
        brassBright: "#E6C36B",
        drab: "#6B8F5A",
        drabBright: "#8FBB78",
        flare: "#9C3B3B",
        flareBright: "#C24E4E",
        paper: "#EDE3CE",
        steel: "#A9AFB6",
        steelDim: "#7A8087",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-garamond)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

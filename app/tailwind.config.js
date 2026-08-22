/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10141A",
        panel: "#1A2029",
        panel2: "#212934",
        panel3: "#2A333F",
        hairline: "#333F4C",
        brass: "#C79A46",
        brassBright: "#DFB767",
        drab: "#7C9B5E",
        drabBright: "#93B679",
        flare: "#C1473C",
        flareBright: "#D66358",
        paper: "#EDE7D9",
        steel: "#93A0AD",
        steelDim: "#5E6975",
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

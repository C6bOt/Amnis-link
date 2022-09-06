module.exports = {
  purge: ["./src/**/*.ts", "./src/**/*.tsx", "./src/**/*.js", "./src/**/*.jsx"],
  darkMode: false, // or 'media' or 'class'
  variants: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"), // import tailwind forms
  ],
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
      },
      screens: {
        "sm-inv": { max: "585px" },
      },
    },
  },
};

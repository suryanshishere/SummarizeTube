/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx,html}",
      {
        //for dynamic rendering
        raw: `
        border-custom-green
        border-custom-pale-orange
        border-custom-gray
        border-custom-red
        border-custom-black
      `,
      },
    ],
    theme: {
      extend: {
        colors: {
          "custom-red": "rgb(165, 42, 42)",
          "custom-less-red": "rgba(165, 42, 42, 0.85)",
          "custom-white": "rgba(255, 255, 255, 1)",
          "custom-less-white": "rgba(255, 255, 255, 0.75)",
          "custom-black": "#000000",
          "custom-gray": "rgba(104, 109, 118)",
          "custom-less-gray": "rgb(238, 238, 238)",
          "custom-super-less-gray": "rgba(104, 109, 118, 0.25)",
          // "custom-backdrop": "#2C3333",
          "custom-green": "#7F9F80",
          "custom-dark-blue": "#131921",
          "custom-blue": "#1679AB",
          "custom-yellow": "#EEEBDD",
          "custom-pale-yellow": "#EBE4D1",
          "custom-pale-orange": "#E8B86D",
        },
        borderWidth: {
          1: "1px",
        },
        spacing: {
          "main-nav": "2.5rem",
          "main-nav-sm": "3.5rem",
          "auth-nav": "5rem",
          "sub-nav": "2rem",
          "sub-nav-sm": "2.5rem",
          "auth-sub-nav": "8rem",
          "nav-overall": "8rem",
          "footer": "5.5rem",
        },
        padding: {
          page: "13vw",
          "page-small": "4vw",
          "page-medium":"8vw",
          button: ".35rem .5rem", //y,x
        },
        animation: {
          marquee: "marquee 30s linear infinite",
        },
        keyframes: {
          marquee: {
            "0%": { transform: "translateX(100%)" },
            "100%": { transform: "translateX(-100%)" },
          },
        },
      },
    },
    plugins: [
      function ({ addUtilities }) {
        addUtilities({
          ".cursor-default-important": {
            cursor: "default",
          },
        });
      },
    ],
    corePlugins: {
      preflight: true,
    },
    variants: {
      extend: {
        textDecorationColor: ["visited"], // Enable visited variants
        decoration: ["visited"], // Enable decoration color for visited
      },
    },
  };
  
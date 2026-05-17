/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        clinic: {
          ink: "#14213d",
          mist: "#eef6f5",
          line: "#d7e4e2",
          teal: "#217c7e",
          blue: "#315b9d",
          green: "#2f855a",
          amber: "#b7791f"
        }
      },
      boxShadow: {
        panel: "0 12px 30px rgba(20, 33, 61, 0.08)"
      }
    }
  },
  plugins: []
};

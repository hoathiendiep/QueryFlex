/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./querypage/templates/*.html", // Querypage templates
    // "./queryflex/templates/**/*.html", // Global templates
    "./querypage/static/**/*.js",   // Optional: For any JS files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores Principais - Laranja
        orange: {
          primary: "#ff7a00",
          light: "#ffa94d",
          dark: "#cc5e00",
          50: "#fff5eb",
          100: "#ffe8cc",
          200: "#ffd199",
          300: "#ffb866",
          400: "#ffa94d",
          500: "#ff7a00",
          600: "#e66d00",
          700: "#cc5e00",
          800: "#b34f00",
          900: "#994000",
        },
        // Tons de Cinza
        gray: {
          light: "#f5f5f5",
          dark: "#2e2e2e",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#eeeeee",
          300: "#e0e0e0",
          400: "#bdbdbd",
          500: "#9e9e9e",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#2e2e2e",
        },
        // Cores de Status
        success: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
          dark: "#059669",
        },
        error: {
          DEFAULT: "#ef4444",
          light: "#fee2e2",
          dark: "#dc2626",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
          dark: "#d97706",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "#dbeafe",
          dark: "#2563eb",
        },
      },
      backgroundColor: {
        primary: "#ffffff",
        secondary: "#f5f5f5",
        tertiary: "#fafafa",
      },
      textColor: {
        primary: "#2e2e2e",
        secondary: "#616161",
        tertiary: "#757575",
        inverse: "#ffffff",
      },
      borderColor: {
        light: "#eeeeee",
        medium: "#e0e0e0",
        dark: "#bdbdbd",
      },
    },
  },
  plugins: [],
};

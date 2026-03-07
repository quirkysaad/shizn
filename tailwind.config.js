const theme = require("./utils/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: theme.colors.background,
        card: theme.colors.card,
        primary: theme.colors.primary,
        primaryLight: theme.colors.primaryLight,
        textPrimary: theme.colors.textPrimary,
        textSecondary: theme.colors.textSecondary,
        border: theme.colors.border,
        danger: theme.colors.danger,
        success: theme.colors.success,
        message: theme.colors.message,
        white: theme.colors.white,
      },
    },
  },
  plugins: [],
};

const lightColors = {
  primary: "#000000",
  primaryLight: "#F5F5F5",
  background: "#F5F5F5",
  card: "#FFFFFF",
  textPrimary: "#111111",
  textSecondary: "#888888",
  border: "#EAEAEA",

  // Dialer specific semantic colors
  danger: "#FF3B30",
  dangerLight: "#FFD8D6",
  dangerDark: "#D70015",

  success: "#34C759",
  successLight: "#D3F5DD",
  successDark: "#248A3D",

  message: "#D9A000",
  messageLight: "#F8DF8B",
  messageDark: "#A67A00",

  warning: "#FF9500",
  warningLight: "#FFECC2",
  warningDark: "#B36800",

  white: "#FFFFFF",
};

const darkColors = {
  primary: "#FFFFFF",
  primaryLight: "#1C1C1E",
  background: "#000000",
  card: "#1C1C1E",
  textPrimary: "#F5F5F5",
  textSecondary: "#8E8E93",
  border: "#2C2C2E",

  // Dialer specific semantic colors
  danger: "#FF453A",
  dangerLight: "#3A1C1B",
  dangerDark: "#FF6961",

  success: "#30D158",
  successLight: "#1A3A25",
  successDark: "#48E06E",

  message: "#FFD60A",
  messageLight: "#3A3520",
  messageDark: "#FFE04D",

  warning: "#FF9F0A",
  warningLight: "#3A2E15",
  warningDark: "#FFB340",

  white: "#FFFFFF",
};

// Default export (light theme) for backward compatibility with tailwind.config.js
const theme = {
  colors: lightColors,
};

module.exports = theme;
module.exports.default = theme;
module.exports.lightColors = lightColors;
module.exports.darkColors = darkColors;

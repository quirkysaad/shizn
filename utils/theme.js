const theme = {
  colors: {
    primary: "#000000", // Deep black for active states and primary icons
    primaryLight: "#F5F5F5", // Very light gray for active tabs/secondary backgrounds
    background: "#FFFFFF", // Pure white background for a clean look
    card: "#FFFFFF", // Pure white for cards
    textPrimary: "#111111", // Near black for high contrast readability
    textSecondary: "#888888", // Medium gray for timestamps and subtitles
    border: "#EAEAEA", // Subtle soft border

    // Dialer specific semantic colors
    danger: "#FF3B30", // Main red for end call/decline
    dangerLight: "#FFD8D6", // Light red for backgrounds/disabled states
    dangerDark: "#D70015", // Dark red for pressed states

    success: "#34C759", // Main green for dial/accept
    successLight: "#D3F5DD", // Light green for backgrounds/disabled states
    successDark: "#248A3D", // Dark green for pressed states

    message: "#D9A000", // Darkish yellow for messages
    messageLight: "#F8DF8B", // Light dark-yellow
    messageDark: "#A67A00", // Even darker yellow

    warning: "#FF9500", // Yellow-orange for missed calls
    warningLight: "#FFECC2",
    warningDark: "#B36800",

    white: "#FFFFFF",
  },
};

module.exports = theme;
module.exports.default = theme;

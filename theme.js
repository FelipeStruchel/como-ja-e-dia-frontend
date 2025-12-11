import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#0F766E", // teal profundo
            contrastText: "#F0FDF4",
        },
        secondary: {
            main: "#EA580C", // laranja queimado
            contrastText: "#FFFBEB",
        },
        background: {
            default: "#F6F8F7",
            paper: "#FFFFFF",
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 700,
                },
            },
        },
    },
});

export default theme;

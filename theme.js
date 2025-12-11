import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#5B21B6",
        },
        secondary: {
            main: "#0EA5E9",
        },
        background: {
            default: "#F8FAFC",
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
                },
            },
        },
    },
});

export default theme;

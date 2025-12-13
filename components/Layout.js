import { useState } from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../lib/auth";

const publicLinks = [
    { href: "/", label: "Mensagem do Dia" },
    { href: "/events", label: "Eventos" },
    { href: "/confessions", label: "Confissões" },
];

const protectedLinks = [
    { href: "/triggers", label: "Triggers" },
    { href: "/logs", label: "Logs" },
    { href: "/admin", label: "Admin" },
    { href: "/persona", label: "Persona" },
    { href: "/schedules", label: "Agendamentos" },
];

export default function Layout({ children, title }) {
    const { user, loading, logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const navLinks = user ? [...publicLinks, ...protectedLinks] : publicLinks;

    function toggleDrawer(open) {
        setDrawerOpen(open);
    }

    function renderAuthActions({ orientation = "row", fullWidth = false } = {}) {
        if (loading) {
            return <CircularProgress size={20} color="inherit" />;
        }
        if (user) {
            return (
                <Stack
                    direction={orientation === "row" ? "row" : "column"}
                    spacing={1}
                    alignItems={orientation === "row" ? "center" : "flex-start"}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user.email}
                    </Typography>
                    <Button
                        color="inherit"
                        onClick={logout}
                        sx={{ fontWeight: 700 }}
                        fullWidth={fullWidth}
                    >
                        Sair
                    </Button>
                </Stack>
            );
        }
        return (
            <Button
                color="inherit"
                component={Link}
                href="/login"
                sx={{ fontWeight: 700 }}
                fullWidth={fullWidth}
            >
                Login
            </Button>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <AppBar position="static" color="primary" elevation={1}>
                <Toolbar
                    sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        py: { xs: 1, md: 1.5 },
                    }}
                >
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: "-0.01em" }}
                    >
                        Como Já é dia
                    </Typography>
                    {isMobile ? (
                        <IconButton
                            color="inherit"
                            onClick={() => toggleDrawer(true)}
                            aria-label="Abrir menu"
                            edge="end"
                        >
                            <MenuIcon />
                        </IconButton>
                    ) : (
                        <>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                                {navLinks.map((link) => (
                                    <Button
                                        key={link.href}
                                        color="inherit"
                                        component={Link}
                                        href={link.href}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                            </Stack>
                            {renderAuthActions()}
                        </>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => toggleDrawer(false)}
                ModalProps={{ keepMounted: true }}
            >
                <Box
                    sx={{
                        width: 320,
                        maxWidth: "90vw",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        height: "100%",
                    }}
                    role="presentation"
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={700}>
                            Navegação
                        </Typography>
                        <IconButton onClick={() => toggleDrawer(false)} aria-label="Fechar menu">
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <List sx={{ p: 0 }}>
                        {navLinks.map((link) => (
                            <ListItemButton
                                key={link.href}
                                component={Link}
                                href={link.href}
                                onClick={() => toggleDrawer(false)}
                            >
                                <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600 }} />
                            </ListItemButton>
                        ))}
                    </List>
                    <Divider />
                    {renderAuthActions({ orientation: "column", fullWidth: true })}
                </Box>
            </Drawer>
            <Container
                maxWidth="lg"
                sx={{
                    py: { xs: 3, md: 4 },
                    px: { xs: 1.5, md: 0 },
                }}
            >
                {title && (
                    <Typography
                        variant="h4"
                        sx={{
                            mb: 3,
                            fontWeight: 700,
                            fontSize: { xs: "1.7rem", md: "2.125rem" },
                        }}
                    >
                        {title}
                    </Typography>
                )}
                {children}
            </Container>
        </Box>
    );
}

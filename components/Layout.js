import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
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
];

export default function Layout({ children, title }) {
    const { user, loading, logout } = useAuth();

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <AppBar position="static" color="primary" elevation={1}>
                <Toolbar sx={{ display: "flex", gap: 2 }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, fontWeight: 700 }}
                    >
                        Como Já É Dia
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {publicLinks.map((link) => (
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
                        {!loading && user
                            ? protectedLinks.map((link) => (
                                  <Button
                                      key={link.href}
                                      color="inherit"
                                      component={Link}
                                      href={link.href}
                                      sx={{ fontWeight: 600 }}
                                  >
                                      {link.label}
                                  </Button>
                              ))
                            : null}
                    </Stack>
                    {loading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : user ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {user.email}
                            </Typography>
                            <Button color="inherit" onClick={logout} sx={{ fontWeight: 700 }}>
                                Sair
                            </Button>
                        </Stack>
                    ) : (
                        <Button
                            color="inherit"
                            component={Link}
                            href="/login"
                            sx={{ fontWeight: 700 }}
                        >
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {title && (
                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                        {title}
                    </Typography>
                )}
                {children}
            </Container>
        </Box>
    );
}

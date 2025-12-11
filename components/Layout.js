import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";

const links = [
    { href: "/", label: "Mensagem do Dia" },
    { href: "/events", label: "Eventos" },
    { href: "/confessions", label: "Confissões" },
    { href: "/triggers", label: "Triggers" },
    { href: "/logs", label: "Logs" },
    { href: "/admin", label: "Admin" },
];

export default function Layout({ children, title }) {
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <AppBar position="static" color="primary" elevation={1}>
                <Toolbar sx={{ display: "flex", gap: 2 }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, fontWeight: 700 }}
                    >
                        Como Já é Dia
                    </Typography>
                    {links.map((link) => (
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

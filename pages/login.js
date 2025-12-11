import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    Stack,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState({ type: "idle", message: "" });

    const loading = status.type === "loading";

    async function handleLogin(e) {
        e.preventDefault();
        try {
            setStatus({ type: "loading", message: "Entrando..." });
            await api.login({ email, password });
            setStatus({ type: "success", message: "Login realizado" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao fazer login",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
        }
    }

    return (
        <Layout title="Login">
            <Card sx={{ maxWidth: 480, mx: "auto" }}>
                <CardContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        A autenticação ainda não está exigida em nenhuma página, mas já
                        temos login disponível.
                    </Typography>
                    <Box component="form" onSubmit={handleLogin}>
                        <Stack spacing={2}>
                            <TextField
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <TextField
                                label="Senha"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button type="submit" variant="contained" disabled={loading}>
                                Entrar
                            </Button>
                        </Stack>
                    </Box>
                    {status.type !== "idle" && status.message && (
                        <Alert
                            severity={status.type === "error" ? "error" : "success"}
                            sx={{ mt: 2 }}
                        >
                            {status.message}
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </Layout>
    );
}

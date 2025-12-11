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
    FormControl,
    FormLabel,
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
                    <Box component="form" onSubmit={handleLogin}>
                        <Stack spacing={2}>
                            <FormControl>
                                <FormLabel htmlFor="login-email">Email</FormLabel>
                                <TextField
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel htmlFor="login-password">Senha</FormLabel>
                                <TextField
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </FormControl>
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

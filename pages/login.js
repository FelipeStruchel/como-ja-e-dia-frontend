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
    const [mode, setMode] = useState("login"); // login | register
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
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

    async function handleRegister(e) {
        e.preventDefault();
        try {
            setStatus({ type: "loading", message: "Enviando cadastro..." });
            await api.register({ email, password, name });
            setStatus({
                type: "success",
                message: "Cadastro enviado. Aguarde aprovação.",
            });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao cadastrar",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 4000);
        }
    }

    return (
        <Layout title="Login">
            <Card sx={{ maxWidth: 520, mx: "auto" }}>
                <CardContent>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Button
                            variant={mode === "login" ? "contained" : "text"}
                            onClick={() => setMode("login")}
                        >
                            Login
                        </Button>
                        <Button
                            variant={mode === "register" ? "contained" : "text"}
                            onClick={() => setMode("register")}
                        >
                            Cadastro
                        </Button>
                    </Stack>
                    {mode === "login" ? (
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
                    ) : (
                        <Box component="form" onSubmit={handleRegister}>
                            <Stack spacing={2}>
                                <FormControl>
                                    <FormLabel htmlFor="reg-name">Nome</FormLabel>
                                    <TextField
                                        id="reg-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel htmlFor="reg-email">Email</FormLabel>
                                    <TextField
                                        id="reg-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel htmlFor="reg-password">Senha</FormLabel>
                                    <TextField
                                        id="reg-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </FormControl>
                                <Button type="submit" variant="contained" disabled={loading}>
                                    Cadastrar
                                </Button>
                                <Typography variant="body2" color="text.secondary">
                                    Após o cadastro, seu acesso precisa ser aprovado. Você pode
                                    aguardar a aprovação por email ou pedir para um admin aprovar
                                    no painel.
                                </Typography>
                            </Stack>
                        </Box>
                    )}
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

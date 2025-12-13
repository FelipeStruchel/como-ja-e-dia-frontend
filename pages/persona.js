import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

export default function PersonaPage() {
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState("");
    const [defaultPrompt, setDefaultPrompt] = useState("");
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [sessionOk, setSessionOk] = useState(true);

    useEffect(() => {
        api.me()
            .then(() => setSessionOk(true))
            .catch(() => setSessionOk(false));
    }, []);

    useEffect(() => {
        if (!sessionOk) return;
        setLoading(true);
        api.getPersona()
            .then((res) => {
                setPrompt(res?.prompt || "");
                setDefaultPrompt(res?.default || "");
            })
            .catch((err) => {
                setStatus({ type: "error", message: err?.message || "Erro ao carregar persona" });
            })
            .finally(() => setLoading(false));
    }, [sessionOk]);

    async function handleSave() {
        try {
            setStatus({ type: "loading", message: "Validando e salvando..." });
            const res = await api.updatePersona(prompt);
            setPrompt(res?.prompt || prompt);
            setStatus({ type: "success", message: "Persona salva" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao salvar persona",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
        }
    }

    if (!sessionOk) {
        return (
            <Layout title="Persona">
                <Alert severity="warning">É preciso estar logado. Vá para /login e faça o login.</Alert>
            </Layout>
        );
    }

    return (
        <Layout title="Persona da IA">
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Typography variant="h6">Persona (tom da IA)</Typography>
                        {loading ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={20} /> <Typography>Carregando...</Typography>
                            </Box>
                        ) : (
                            <>
                                <TextField
                                    label="Prompt da persona"
                                    multiline
                                    minRows={8}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    helperText="Altere o tom. Guardrails de formato/segurança permanecem fixos no backend."
                                />
                                <Button variant="outlined" onClick={() => setPrompt(defaultPrompt)}>
                                    Restaurar padrão
                                </Button>
                                <Stack direction="row" spacing={2}>
                                    <Button variant="contained" onClick={handleSave}>
                                        Salvar
                                    </Button>
                                </Stack>
                            </>
                        )}
                        {status.type !== "idle" && (
                            <Alert severity={status.type === "error" ? "error" : "success"}>
                                {status.message}
                            </Alert>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Layout>
    );
}

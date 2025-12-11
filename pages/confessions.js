import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    Stack,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

const MAX_LENGTH = 1000;

export default function ConfessionsPage() {
    const [text, setText] = useState("");
    const [status, setStatus] = useState({ type: "idle", message: "" });

    const isSending = status.type === "loading";

    async function handleSend(e) {
        e.preventDefault();
        if (!text.trim()) {
            setStatus({ type: "error", message: "Digite a confissão" });
            return;
        }
        if (text.length > MAX_LENGTH) {
            setStatus({
                type: "error",
                message: `Limite de ${MAX_LENGTH} caracteres`,
            });
            return;
        }
        try {
            setStatus({ type: "loading", message: "Enviando..." });
            await api.sendConfession(text.trim());
            setText("");
            setStatus({ type: "success", message: "Confissão enviada" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao enviar confissão",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
        }
    }

    return (
        <Layout title="Confissões Anônimas">
            <Card>
                <CardContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Envie uma confissão anônima. Respeite o limite e aguarde o
                        cooldown configurado no backend.
                    </Typography>
                    <Box component="form" onSubmit={handleSend}>
                        <Stack spacing={2}>
                            <TextField
                                label="Confissão"
                                multiline
                                minRows={5}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                helperText={`${text.length}/${MAX_LENGTH}`}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSending}
                            >
                                Enviar confissão
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

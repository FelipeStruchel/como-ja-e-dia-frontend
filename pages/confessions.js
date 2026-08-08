import { useEffect, useState } from "react";
import {
    Box, Card, CardContent, Typography, TextField, Button, Alert, Stack,
    Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

const MAX_LENGTH = 1000;

export default function ConfessionsPage() {
    const [text, setText] = useState("");
    const [groups, setGroups] = useState([]);
    const [groupId, setGroupId] = useState("");
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [status, setStatus] = useState({ type: "idle", message: "" });

    const isSending = status.type === "loading";

    useEffect(() => {
        api.getConfessionGroups()
            .then((data) => setGroups(data || []))
            .catch(() => setGroups([]))
            .finally(() => setLoadingGroups(false));
    }, []);

    async function handleSend(e) {
        e.preventDefault();
        if (!groupId) {
            setStatus({ type: "error", message: "Escolha um grupo" });
            return;
        }
        if (!text.trim()) {
            setStatus({ type: "error", message: "Digite a confissão" });
            return;
        }
        if (text.length > MAX_LENGTH) {
            setStatus({ type: "error", message: `Limite de ${MAX_LENGTH} caracteres` });
            return;
        }
        try {
            setStatus({ type: "loading", message: "Enviando..." });
            await api.sendConfession(groupId, text.trim());
            setText("");
            setStatus({ type: "success", message: "Confissão enviada" });
        } catch (err) {
            setStatus({ type: "error", message: err?.message || "Erro ao enviar confissão" });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
        }
    }

    return (
        <Layout title="Confissões Anônimas">
            <Card>
                <CardContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Envie uma confissão anônima, é realmente anonima!
                    </Typography>
                    {!loadingGroups && groups.length === 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Nenhum grupo está aceitando confissões no momento.
                        </Alert>
                    )}
                    <Box component="form" onSubmit={handleSend}>
                        <Stack spacing={2}>
                            <FormControl size="small" disabled={loadingGroups || groups.length === 0}>
                                <InputLabel id="confession-group-label">Grupo</InputLabel>
                                <Select
                                    labelId="confession-group-label"
                                    label="Grupo"
                                    value={groupId}
                                    onChange={(e) => setGroupId(e.target.value)}
                                >
                                    {groups.map((g) => (
                                        <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Confissão"
                                multiline
                                minRows={5}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                helperText={`${text.length}/${MAX_LENGTH}`}
                            />
                            <Button type="submit" variant="contained" disabled={isSending || groups.length === 0}>
                                Enviar confissão
                            </Button>
                        </Stack>
                    </Box>
                    {status.type !== "idle" && status.message && (
                        <Alert severity={status.type === "error" ? "error" : "success"} sx={{ mt: 2 }}>
                            {status.message}
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </Layout>
    );
}

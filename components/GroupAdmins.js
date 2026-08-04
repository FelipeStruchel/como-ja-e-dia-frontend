import { useEffect, useState } from "react";
import { Stack, Chip, TextField, Button, Alert, Typography } from "@mui/material";
import { api } from "../lib/apiClient";

export default function GroupAdmins({ groupId }) {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    function refresh() {
        setLoading(true);
        api.getGroupAdmins(groupId)
            .then((data) => {
                setAdmins(data || []);
                setError("");
            })
            .catch((err) => setError(err?.message || "Erro ao carregar admins"))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        refresh();
    }, [groupId]);

    async function handleAdd() {
        if (!email.trim()) return;
        setError("");
        try {
            await api.addGroupAdmin(groupId, email.trim());
            setEmail("");
            refresh();
        } catch (err) {
            setError(err?.message || "Erro ao adicionar admin");
        }
    }

    async function handleRemove(userId) {
        setError("");
        try {
            await api.removeGroupAdmin(groupId, userId);
            setAdmins((prev) => prev.filter((a) => a.userId !== userId));
        } catch (err) {
            setError(err?.message || "Erro ao remover admin");
        }
    }

    return (
        <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={700}>
                Admins
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction="row" flexWrap="wrap" spacing={1}>
                {admins.map((a) => (
                    <Chip
                        key={a.userId}
                        label={a.name || a.email}
                        onDelete={() => handleRemove(a.userId)}
                        size="small"
                    />
                ))}
                {!loading && admins.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        Nenhum admin específico.
                    </Typography>
                )}
            </Stack>
            <Stack direction="row" spacing={1}>
                <TextField
                    label="E-mail do admin"
                    size="small"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Button variant="outlined" size="small" onClick={handleAdd} disabled={!email.trim()}>
                    Adicionar
                </Button>
            </Stack>
        </Stack>
    );
}

import { useEffect, useState } from "react";
import { Stack, Chip, Alert, Typography } from "@mui/material";
import { api } from "../lib/apiClient";

// Read-only: who administers this group. Assigning/removing group admins
// happens on the /admin page (per-user), not here — see that page for why.
export default function GroupAdmins({ groupId }) {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        api.getGroupAdmins(groupId)
            .then((data) => {
                setAdmins(data || []);
                setError("");
            })
            .catch((err) => setError(err?.message || "Erro ao carregar admins"))
            .finally(() => setLoading(false));
    }, [groupId]);

    return (
        <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={700}>
                Admins
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction="row" flexWrap="wrap" spacing={1}>
                {admins.map((a) => (
                    <Chip key={a.userId} label={a.name || a.email} size="small" />
                ))}
                {!loading && admins.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        Nenhum admin específico.
                    </Typography>
                )}
            </Stack>
        </Stack>
    );
}

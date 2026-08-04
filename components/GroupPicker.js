import { useEffect, useRef, useState } from "react";
import { Autocomplete, TextField, Button, Stack, CircularProgress, Alert } from "@mui/material";
import { api } from "../lib/apiClient";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 8; // ~15s

export default function GroupPicker({ value = null, onSelect, label = "Escolher grupo" }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const attemptsRef = useRef(0);

    async function poll() {
        try {
            const res = await api.getGroupDiscovery();
            if (res.status === "ready") {
                setGroups(res.groups || []);
                setLoading(false);
                setError("");
                return;
            }
            attemptsRef.current += 1;
            if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
                setLoading(false);
                setError("Ainda buscando grupos no WhatsApp — tente Sync novamente em instantes.");
                return;
            }
            setTimeout(poll, POLL_INTERVAL_MS);
        } catch (err) {
            setLoading(false);
            setError(err?.message || "Erro ao buscar grupos");
        }
    }

    function fetchGroups() {
        attemptsRef.current = 0;
        setLoading(true);
        setError("");
        poll();
    }

    useEffect(() => {
        fetchGroups();
    }, []);

    async function handleSync() {
        attemptsRef.current = 0;
        setLoading(true);
        setError("");
        try {
            await api.syncGroupDiscovery();
            poll();
        } catch (err) {
            setLoading(false);
            setError(err?.message || "Erro ao sincronizar");
        }
    }

    return (
        <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Autocomplete
                    sx={{ flex: 1 }}
                    options={groups}
                    value={value}
                    isOptionEqualToValue={(option, val) => option.id === val?.id}
                    getOptionLabel={(g) => `${g.subject || "(sem nome)"} — ${g.id}`}
                    loading={loading}
                    onChange={(_, val) => onSelect(val)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={label}
                            size="small"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress size={16} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
                <Button variant="outlined" size="small" onClick={handleSync} disabled={loading}>
                    Sync
                </Button>
            </Stack>
            {error && <Alert severity="warning">{error}</Alert>}
        </Stack>
    );
}

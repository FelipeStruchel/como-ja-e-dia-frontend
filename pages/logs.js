import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";
import { logClient } from "../lib/logClient";

const fetcher = (key, params) => api.getLogs(params);

export default function LogsPage() {
    const [source, setSource] = useState("all");
    const [limit, setLimit] = useState(100);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastCount, setLastCount] = useState(0);

    const params = useMemo(() => {
        const p = {};
        if (source !== "all") p.source = source;
        p.limit = limit;
        return p;
    }, [source, limit]);

    const { data, mutate, error, isValidating } = useSWR(
        ["logs", params],
        ([, p]) => fetcher("logs", p),
        {
            refreshInterval: autoRefresh ? 5 * 1000 : 0,
        }
    );

    useEffect(() => {
        if (data && data.length !== lastCount) {
            setLastCount(data.length);
        }
    }, [data, lastCount]);

    const filteredLabel =
        source === "all"
            ? "Backend + Worker"
            : source === "backend"
            ? "Backend"
            : "Worker";

    const latestTs = data && data.length ? new Date(data[0].createdAt).toLocaleString() : null;

    return (
        <Layout title="Logs">
            <Card>
                <CardContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Consulte logs persistidos (rota protegida). Modo auto refresh refaz a
                        consulta a cada 5 minutos.
                    </Typography>
                    <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ mb: 2 }}>
                        <FormControl sx={{ minWidth: 180 }}>
                            <InputLabel>Fonte</InputLabel>
                            <Select
                                label="Fonte"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                            >
                                <MenuItem value="all">Backend + Worker</MenuItem>
                                <MenuItem value="backend">Backend</MenuItem>
                                <MenuItem value="worker">Worker</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Limite"
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value || "0", 10))}
                            helperText="Máximo 200"
                            inputProps={{ min: 1, max: 200 }}
                        />
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Switch
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                            />
                            <Typography>Auto refresh (5 min)</Typography>
                        </Stack>
                        <Button variant="contained" onClick={() => mutate()}>
                            Atualizar agora
                        </Button>
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Erro ao carregar logs: {error.message}
                        </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Fonte: {filteredLabel} · Mostrando {data?.length || 0} registros
                        {latestTs ? ` · Último: ${latestTs}` : ""}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.5}>
                        {(data || []).map((logItem) => (
                            <Box
                                key={logItem._id || `${logItem.createdAt}-${logItem.message}`}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: "background.paper",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    spacing={2}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {logItem.level?.toUpperCase() || "INFO"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(logItem.createdAt).toLocaleString()}
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {logItem.message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Fonte: {logItem.source || "backend"}
                                </Typography>
                                {logItem.meta && (
                                    <pre
                                        style={{
                                            background: "#f8fafc",
                                            padding: "8px",
                                            borderRadius: "6px",
                                            marginTop: "6px",
                                            fontSize: "12px",
                                            overflowX: "auto",
                                        }}
                                    >
                                        {JSON.stringify(logItem.meta, null, 2)}
                                    </pre>
                                )}
                            </Box>
                        ))}
                        {!data?.length && !isValidating && (
                            <Typography color="text.secondary">
                                Nenhum log encontrado para os filtros atuais.
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Layout>
    );
}

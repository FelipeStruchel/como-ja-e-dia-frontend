import { useState } from "react";
import useSWR from "swr";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stack,
    Grid,
    Chip,
    CardActions,
    LinearProgress,
    Alert,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

const fetcher = () => api.getEvents();

export default function EventsPage() {
    const { data: events, mutate, isValidating } = useSWR("events", fetcher);
    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("00:00");
    const [status, setStatus] = useState({ type: "idle", message: "" });

    const isSubmitting = status.type === "loading";

    async function handleCreate() {
        if (!name.trim() || !date) {
            setStatus({ type: "error", message: "Preencha nome e data" });
            return;
        }
        try {
            setStatus({ type: "loading", message: "Criando evento..." });
            const iso = new Date(`${date}T${time || "00:00"}:00`).toISOString();
            await api.createEvent({ name: name.trim(), date: iso });
            setName("");
            setDate("");
            setTime("00:00");
            await mutate();
            setStatus({ type: "success", message: "Evento criado" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao criar evento",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
        }
    }

    async function handleDelete(id) {
        try {
            await api.deleteEvent(id);
            await mutate();
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao remover evento",
            });
        }
    }

    return (
        <Layout title="Eventos">
            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Novo evento
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="Nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <TextField
                                    label="Data"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Hora (opcional)"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleCreate}
                                disabled={isSubmitting}
                            >
                                Criar evento
                            </Button>
                        </CardActions>
                        {isSubmitting && <LinearProgress />}
                    </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Card>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                                sx={{ mb: 2, gap: 1 }}
                            >
                                <Typography variant="h6">Próximos eventos</Typography>
                                <Chip
                                    label={`${events?.length || 0}`}
                                    color="secondary"
                                    size="small"
                                />
                            </Stack>
                            {isValidating && <LinearProgress sx={{ mb: 2 }} />}
                            <Stack spacing={2}>
                                {(events || []).map((ev) => (
                                    <Card key={ev._id} variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                {ev.name}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {new Date(ev.date).toLocaleString()}
                                            </Typography>
                                        </CardContent>
                                        <CardActions
                                            sx={{
                                                justifyContent: {
                                                    xs: "flex-start",
                                                    sm: "flex-end",
                                                },
                                                gap: 1,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Button
                                                color="error"
                                                size="small"
                                                onClick={() => handleDelete(ev._id)}
                                            >
                                                Remover
                                            </Button>
                                        </CardActions>
                                    </Card>
                                ))}
                                {!isValidating && (events || []).length === 0 && (
                                    <Typography color="text.secondary">
                                        Nenhum evento cadastrado.
                                    </Typography>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            {status.type !== "idle" && status.message && (
                <Alert
                    severity={status.type === "error" ? "error" : "success"}
                    sx={{ mt: 3 }}
                >
                    {status.message}
                </Alert>
            )}
        </Layout>
    );
}

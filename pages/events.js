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
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    MenuItem,
    Checkbox,
    ListItemText,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";
import { useAuth } from "../lib/auth";
import { resolvePickerGroups } from "../lib/groupPicker";

const fetcher = () => api.getEvents();
const BROADCAST_VALUE = "__broadcast__";

export default function EventsPage() {
    const { data: events, mutate, isValidating } = useSWR("events", fetcher);
    const { hasRole } = useAuth();
    const isSuperAdmin = hasRole("super_admin");
    const { data: myGroups, isLoading: myGroupsLoading } = useSWR("my-groups", () =>
        api.getMyGroups()
    );

    const { eligible, needsPicker, singleGroupId, canBroadcastGlobally } =
        resolvePickerGroups(myGroups || [], isSuperAdmin, "eventsEnabled");

    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("00:00");
    const [selectedGroupIds, setSelectedGroupIds] = useState([]);
    const [status, setStatus] = useState({ type: "idle", message: "" });

    const isSubmitting = status.type === "loading";
    const noEligibleGroups = !myGroupsLoading && eligible.length === 0;
    const formDisabled = isSubmitting || myGroupsLoading || noEligibleGroups;

    function handleGroupSelectChange(e) {
        const value = e.target.value;
        const values = typeof value === "string" ? value.split(",") : value;
        if (values.includes(BROADCAST_VALUE)) {
            if (!selectedGroupIds.includes(BROADCAST_VALUE)) {
                // Broadcast was just selected: it's exclusive, drop everything else.
                setSelectedGroupIds([BROADCAST_VALUE]);
            } else {
                // Broadcast was already selected and the user picked something
                // else: drop broadcast, keep the newly picked groups.
                setSelectedGroupIds(values.filter((v) => v !== BROADCAST_VALUE));
            }
        } else {
            setSelectedGroupIds(values);
        }
    }

    function renderGroupSelectValue(selected) {
        if (selected.includes(BROADCAST_VALUE)) {
            return "Todos os grupos (atual e futuros)";
        }
        return selected
            .map((id) => eligible.find((g) => g.id === id)?.name || id)
            .join(", ");
    }

    async function handleCreate() {
        if (!name.trim() || !date) {
            setStatus({ type: "error", message: "Preencha nome e data" });
            return;
        }
        if (noEligibleGroups) {
            setStatus({
                type: "error",
                message: "Você não administra nenhum grupo com eventos habilitados.",
            });
            return;
        }

        let broadcast = false;
        let targetGroupIds = [];
        if (needsPicker) {
            if (selectedGroupIds.includes(BROADCAST_VALUE)) {
                broadcast = true;
            } else if (selectedGroupIds.length === 0) {
                setStatus({ type: "error", message: "Selecione ao menos um grupo" });
                return;
            } else {
                targetGroupIds = selectedGroupIds;
            }
        } else {
            targetGroupIds = [singleGroupId];
        }

        try {
            setStatus({ type: "loading", message: "Criando evento..." });
            const iso = new Date(`${date}T${time || "00:00"}:00`).toISOString();
            const trimmedName = name.trim();

            if (broadcast) {
                await api.createEvent({ name: trimmedName, date: iso, groupId: null });
            } else {
                // One independent createEvent call per selected group — never a
                // single call with an array of ids, there is no bulk-create endpoint.
                const results = await Promise.allSettled(
                    targetGroupIds.map((groupId) =>
                        api.createEvent({ name: trimmedName, date: iso, groupId })
                    )
                );
                const failures = results.filter((r) => r.status === "rejected");
                if (failures.length > 0) {
                    const allFailed = failures.length === results.length;
                    throw new Error(
                        allFailed
                            ? failures[0].reason?.message || "Erro ao criar evento"
                            : `Evento criado em ${results.length - failures.length} de ${results.length} grupos; ${failures.length} falharam`
                    );
                }
            }

            setName("");
            setDate("");
            setTime("00:00");
            setSelectedGroupIds([]);
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
                            {noEligibleGroups && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    Você não administra nenhum grupo com eventos
                                    habilitados.
                                </Alert>
                            )}
                            <Stack spacing={2}>
                                <TextField
                                    label="Nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={formDisabled}
                                />
                                <TextField
                                    label="Data"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={formDisabled}
                                />
                                <TextField
                                    label="Hora (opcional)"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={formDisabled}
                                />
                                {needsPicker && (
                                    <FormControl fullWidth disabled={formDisabled}>
                                        <InputLabel id="event-groups-label">
                                            Grupos
                                        </InputLabel>
                                        <Select
                                            labelId="event-groups-label"
                                            multiple
                                            value={selectedGroupIds}
                                            onChange={handleGroupSelectChange}
                                            input={<OutlinedInput label="Grupos" />}
                                            renderValue={renderGroupSelectValue}
                                        >
                                            {canBroadcastGlobally && (
                                                <MenuItem value={BROADCAST_VALUE}>
                                                    <Checkbox
                                                        checked={selectedGroupIds.includes(
                                                            BROADCAST_VALUE
                                                        )}
                                                    />
                                                    <ListItemText primary="Todos os grupos (atual e futuros)" />
                                                </MenuItem>
                                            )}
                                            {eligible.map((g) => (
                                                <MenuItem key={g.id} value={g.id}>
                                                    <Checkbox
                                                        checked={selectedGroupIds.includes(
                                                            g.id
                                                        )}
                                                    />
                                                    <ListItemText
                                                        primary={g.name || g.id}
                                                    />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                                {!needsPicker && eligible.length === 1 && (
                                    <Typography variant="caption" color="text.secondary">
                                        Grupo: {eligible[0].name || eligible[0].id}
                                    </Typography>
                                )}
                            </Stack>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleCreate}
                                disabled={formDisabled}
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
                                    <Card key={ev.id} variant="outlined">
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
                                                onClick={() => handleDelete(ev.id)}
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

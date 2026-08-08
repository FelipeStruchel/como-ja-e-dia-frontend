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
    const { hasRole, user } = useAuth();
    const isSuperAdmin = hasRole("super_admin");
    // /events is a public page reachable while logged out — key the fetch on
    // `user` (same pattern Layout.js uses) so anonymous visitors never fire
    // this authenticated-only endpoint and hit an infinite 401 retry loop.
    const { data: myGroups, isLoading: myGroupsLoading } = useSWR(
        user ? "my-groups" : null,
        () => api.getMyGroups()
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
    // A super_admin can always fall back to broadcasting globally, even with
    // zero (or one) eligible groups, so `noEligibleGroups` alone must not
    // block/disable the form for them.
    const blockedByNoGroups = noEligibleGroups && !canBroadcastGlobally;
    const showGroupPicker = needsPicker || canBroadcastGlobally;
    const formDisabled = isSubmitting || myGroupsLoading || blockedByNoGroups;

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
        if (blockedByNoGroups) {
            setStatus({
                type: "error",
                message: "Você não administra nenhum grupo com eventos habilitados.",
            });
            return;
        }

        let broadcast = false;
        let targetGroupIds = [];
        if (showGroupPicker) {
            if (selectedGroupIds.includes(BROADCAST_VALUE)) {
                broadcast = true;
            } else if (selectedGroupIds.length === 0) {
                if (!needsPicker && singleGroupId) {
                    // Picker is only showing because the user can broadcast
                    // (0 or 1 real eligible groups) and they didn't tick
                    // anything — fall back to the single eligible group.
                    targetGroupIds = [singleGroupId];
                } else {
                    setStatus({ type: "error", message: "Selecione ao menos um grupo" });
                    return;
                }
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
                await mutate();
                setName("");
                setDate("");
                setTime("00:00");
                setSelectedGroupIds([]);
                setStatus({ type: "success", message: "Evento criado" });
                return;
            }

            // One independent createEvent call per selected group — never a
            // single call with an array of ids, there is no bulk-create endpoint.
            const results = await Promise.allSettled(
                targetGroupIds.map((groupId) =>
                    api.createEvent({ name: trimmedName, date: iso, groupId })
                )
            );
            const failedGroupIds = results
                .map((r, i) => (r.status === "rejected" ? targetGroupIds[i] : null))
                .filter(Boolean);

            if (failedGroupIds.length === results.length) {
                // Total failure: nothing was created, so there's nothing to
                // refresh and nothing to clear from the selection — safe to
                // throw straight to the catch block below.
                const firstFailure = results.find((r) => r.status === "rejected");
                throw new Error(firstFailure?.reason?.message || "Erro ao criar evento");
            }

            // At least one call succeeded: refresh the events list so the
            // successfully-created row(s) show up right away, even though
            // some calls in this batch failed.
            await mutate();

            if (failedGroupIds.length > 0) {
                // Partial failure: keep the form fields and only the
                // still-failed groups selected, so clicking "Criar evento"
                // again retries just the groups that didn't succeed instead
                // of re-creating duplicate events for the ones that did.
                setSelectedGroupIds(failedGroupIds);
                setStatus({
                    type: "warning",
                    message: `Evento criado em ${results.length - failedGroupIds.length} de ${results.length} grupos; ${failedGroupIds.length} falharam`,
                });
            } else {
                setName("");
                setDate("");
                setTime("00:00");
                setSelectedGroupIds([]);
                setStatus({ type: "success", message: "Evento criado" });
            }
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
                {user && (
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Novo evento
                            </Typography>
                            {blockedByNoGroups && (
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
                                {showGroupPicker && (
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
                                {!showGroupPicker && eligible.length === 1 && (
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
                )}

                <Grid item xs={12} md={user ? 7 : 12}>
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
                    severity={
                        status.type === "error"
                            ? "error"
                            : status.type === "warning"
                            ? "warning"
                            : "success"
                    }
                    sx={{ mt: 3 }}
                >
                    {status.message}
                </Alert>
            )}
        </Layout>
    );
}

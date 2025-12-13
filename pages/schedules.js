import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

const fetcher = () => api.getSchedules();

const emptyForm = {
    name: "",
    type: "video",
    mediaUrl: "",
    displayUrl: "",
    textContent: "",
    captionMode: "auto",
    customCaption: "",
    includeIntro: true,
    includeRandomPool: true,
    cleanupAfterSend: false,
    personaPrompt: "",
    time: "06:00",
    useCronOverride: false,
    cron: "",
    startDate: "",
    endDate: "",
    daysOfWeek: [],
    active: true,
};

const dowOptions = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 },
];

export default function SchedulesPage() {
    const { data: schedules, mutate, error } = useSWR("/api/schedules", fetcher);
    const [authChecked, setAuthChecked] = useState(false);
    const [sessionOk, setSessionOk] = useState(true);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        api.me()
            .then(() => setSessionOk(true))
            .catch(() => setSessionOk(false))
            .finally(() => setAuthChecked(true));
    }, []);

    const parsedForm = useMemo(() => {
        return {
            ...form,
            startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
            endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
            daysOfWeek: form.daysOfWeek || [],
        };
    }, [form]);

    async function handleSave(e) {
        e?.preventDefault();
        try {
            setStatus({ type: "loading", message: "Salvando..." });
            if (editingId) {
                await api.updateSchedule(editingId, parsedForm);
            } else {
                await api.createSchedule(parsedForm);
            }
            setForm(emptyForm);
            setEditingId(null);
            await mutate();
            setStatus({ type: "success", message: "Agendamento salvo" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao salvar",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2500);
        }
    }

    function handleEdit(s) {
        setEditingId(s._id);
        setForm({
            name: s.name || "",
            type: s.type || "video",
            mediaUrl: s.mediaUrl || "",
            displayUrl: s.mediaUrl || "",
            textContent: s.textContent || "",
            captionMode: s.captionMode || "auto",
            customCaption: s.customCaption || "",
            includeIntro: s.includeIntro ?? true,
            includeRandomPool: s.includeRandomPool ?? true,
            cleanupAfterSend: s.cleanupAfterSend ?? false,
            personaPrompt: s.personaPrompt || "",
            time: s.time || "06:00",
            useCronOverride: s.useCronOverride || false,
            cron: s.cron || "",
            startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0, 16) : "",
            endDate: s.endDate ? new Date(s.endDate).toISOString().slice(0, 16) : "",
            daysOfWeek: s.daysOfWeek || [],
            active: s.active ?? true,
        });
    }

    async function handleDelete(id) {
        try {
            await api.deleteSchedule(id);
            await mutate();
        } catch (err) {
            setStatus({ type: "error", message: err?.message || "Erro ao remover" });
        }
    }

    async function handleUpload(file) {
        if (!file) return;
        setUploading(true);
        try {
            const resp = await api.uploadMedia(file, "daily");
            const media = resp?.media;
            if (media?.url && media?.type) {
                setForm((prev) => ({
                    ...prev,
                    type: media.type,
                    mediaUrl: media.url,
                    displayUrl: media.urlPublic || media.url,
                }));
                setStatus({ type: "success", message: "Mídia enviada, URL aplicada" });
            }
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao enviar mídia",
            });
        } finally {
            setUploading(false);
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2500);
        }
    }

    if (!authChecked) {
        return (
            <Layout title="Agendamentos">
                <Typography>Verificando sessão...</Typography>
            </Layout>
        );
    }

    if (!sessionOk) {
        return (
            <Layout title="Agendamentos">
                <Alert severity="warning" sx={{ mb: 2 }}>
                    É preciso estar logado. Vá para /login e faça o login.
                </Alert>
            </Layout>
        );
    }

    const loading = !schedules && !error;

    return (
        <Layout title="Agendamentos">
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {editingId ? "Editar agendamento" : "Novo agendamento"}
                            </Typography>
                            <Stack spacing={2} component="form" onSubmit={handleSave}>
                                <TextField
                                    label="Nome"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    required
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Tipo</InputLabel>
                                    <Select
                                        label="Tipo"
                                        value={form.type}
                                        onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                                    >
                                        <MenuItem value="text">Texto</MenuItem>
                                        <MenuItem value="image">Imagem</MenuItem>
                                        <MenuItem value="video">Vídeo</MenuItem>
                                    </Select>
                                </FormControl>
                                {form.type === "text" ? (
                                    <TextField
                                        label="Texto"
                                        multiline
                                        minRows={3}
                                        value={form.textContent}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, textContent: e.target.value }))
                                        }
                                    />
                                ) : (
                                    <Stack spacing={1}>
                                        <TextField
                                            label="URL da mídia diária"
                                        value={form.mediaUrl}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, mediaUrl: e.target.value }))
                                        }
                                    />
                                    {form.displayUrl && (
                                        <Typography variant="body2" color="text.secondary">
                                            Prévia pública: {form.displayUrl}
                                        </Typography>
                                    )}
                                    <Button variant="outlined" component="label" disabled={uploading}>
                                        {uploading ? "Enviando..." : "Enviar mídia (scope daily)"}
                                        <input
                                            type="file"
                                            hidden
                                                onChange={(e) => handleUpload(e.target.files?.[0])}
                                            />
                                        </Button>
                                    </Stack>
                                )}
                                <FormControl fullWidth>
                                    <InputLabel>Legenda</InputLabel>
                                    <Select
                                        label="Legenda"
                                        value={form.captionMode}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, captionMode: e.target.value }))
                                        }
                                    >
                                        <MenuItem value="auto">Auto (OpenAI)</MenuItem>
                                        <MenuItem value="custom">Custom</MenuItem>
                                        <MenuItem value="none">Sem legenda</MenuItem>
                                    </Select>
                                </FormControl>
                                {form.captionMode === "custom" && (
                                    <TextField
                                        label="Legenda custom"
                                        multiline
                                        minRows={2}
                                        value={form.customCaption}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, customCaption: e.target.value }))
                                        }
                                    />
                                )}
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.includeIntro}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, includeIntro: e.target.checked }))
                                            }
                                        />
                                    }
                                    label="Enviar intro (Foto/Vídeo do dia)"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.includeRandomPool}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    includeRandomPool: e.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Enviar item aleatório da Mensagem do Dia"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.cleanupAfterSend}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    cleanupAfterSend: e.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Limpar mídia principal ao finalizar (apenas se última data)"
                                />
                                <TextField
                                    label="Persona (opcional, substitui a global)"
                                    multiline
                                    minRows={4}
                                    value={form.personaPrompt}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, personaPrompt: e.target.value }))
                                    }
                                    helperText="Guardrails fixos permanecem. Se vazio, usa persona global."
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.useCronOverride}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    useCronOverride: e.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Modo avançado (cron manual)"
                                />
                                {!form.useCronOverride ? (
                                    <>
                                        <TextField
                                            label="Horário (HH:mm)"
                                            type="time"
                                            InputLabelProps={{ shrink: true }}
                                            value={form.time}
                                            onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                                        />
                                        <Autocomplete
                                            multiple
                                            options={dowOptions}
                                            getOptionLabel={(o) => o.label}
                                            value={dowOptions.filter((o) => form.daysOfWeek.includes(o.value))}
                                            onChange={(_, newVal) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    daysOfWeek: newVal.map((v) => v.value),
                                                }))
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Dias da semana (vazio = todos)"
                                                    placeholder="Selecione dias"
                                                />
                                            )}
                                        />
                                    </>
                                ) : (
                                    <TextField
                                        label="Cron"
                                        value={form.cron}
                                        onChange={(e) => setForm((p) => ({ ...p, cron: e.target.value }))}
                                        helperText='Ex: "0 6 * * *"'
                                    />
                                )}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        label="Início (opcional)"
                                        type="datetime-local"
                                        InputLabelProps={{ shrink: true }}
                                        value={form.startDate}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, startDate: e.target.value }))
                                        }
                                    />
                                    <TextField
                                        label="Fim (opcional)"
                                        type="datetime-local"
                                        InputLabelProps={{ shrink: true }}
                                        value={form.endDate}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, endDate: e.target.value }))
                                        }
                                    />
                                </Stack>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.active}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, active: e.target.checked }))
                                            }
                                        />
                                    }
                                    label="Ativo"
                                />
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <Button variant="contained" onClick={handleSave} fullWidth>
                                        {editingId ? "Salvar alterações" : "Criar agendamento"}
                                    </Button>
                                    {editingId && (
                                        <Button
                                            variant="text"
                                            onClick={() => {
                                                setEditingId(null);
                                                setForm(emptyForm);
                                            }}
                                        >
                                            Cancelar edição
                                        </Button>
                                    )}
                                </Stack>
                                {status.type !== "idle" && status.message && (
                                    <Alert severity={status.type === "error" ? "error" : "success"}>
                                        {status.message}
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                sx={{ mb: 2, gap: 1 }}
                            >
                                <Typography variant="h6">Agendamentos</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip label={schedules ? schedules.length : 0} color="secondary" size="small" />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() =>
                                            api
                                                .resyncSchedules()
                                                .then(() =>
                                                    setStatus({ type: "success", message: "Resync solicitado" })
                                                )
                                                .catch((err) =>
                                                    setStatus({
                                                        type: "error",
                                                        message: err?.message || "Erro no resync",
                                                    })
                                                )
                                        }
                                    >
                                        Resync
                                    </Button>
                                </Stack>
                            </Stack>
                            {loading && <Typography>Carregando...</Typography>}
                            {error && <Alert severity="error">Erro ao carregar schedules: {error.message}</Alert>}
                            <Stack spacing={2}>
                                {(schedules || []).map((s) => (
                                    <Card key={s._id} variant="outlined">
                                        <CardContent>
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                justifyContent="space-between"
                                                alignItems={{ xs: "flex-start", sm: "center" }}
                                                sx={{ gap: 1 }}
                                            >
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    {s.name}
                                                </Typography>
                                                <Chip
                                                    label={s.active ? "Ativo" : "Inativo"}
                                                    color={s.active ? "success" : "default"}
                                                    size="small"
                                                />
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                                Tipo: {s.type} | Cron: {s.cron} | TZ: {s.timezone}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Random do dia: {s.includeRandomPool !== false ? "Sim" : "Não"}
                                            </Typography>
                                            {s.captionMode !== "none" && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Legenda: {s.captionMode}
                                                </Typography>
                                            )}
                                        </CardContent>
                                        <CardActions
                                            sx={{
                                                justifyContent: {
                                                    xs: "flex-start",
                                                    sm: "flex-end",
                                                },
                                                flexWrap: "wrap",
                                                gap: 1,
                                            }}
                                        >
                                            <Button size="small" onClick={() => handleEdit(s)}>
                                                Editar
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(s._id)}
                                            >
                                                Remover
                                            </Button>
                                        </CardActions>
                                    </Card>
                                ))}
                                {!loading && schedules?.length === 0 && (
                                    <Typography color="text.secondary">Nenhum agendamento cadastrado.</Typography>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Layout>
    );
}

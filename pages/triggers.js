import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Divider,
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
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

const emptyForm = {
    name: "",
    phrases: "",
    matchType: "exact",
    caseSensitive: false,
    normalizeAccents: true,
    wholeWord: true,
    responseType: "text",
    responseText: "",
    responseMediaUrl: "",
    replyMode: "reply",
    mentionSender: false,
    chancePercent: 100,
    expiresAt: "",
    maxUses: "",
    cooldownSeconds: 0,
    cooldownPerUserSeconds: 0,
    active: true,
};

const fetcher = () => api.getTriggers();

export default function TriggersPage() {
    const { data: triggers, mutate, error } = useSWR("/api/triggers", fetcher);
    const [authChecked, setAuthChecked] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [uploading, setUploading] = useState(false);
    const [sessionOk, setSessionOk] = useState(true);

    useEffect(() => {
        api.me()
            .then(() => setSessionOk(true))
            .catch(() => setSessionOk(false))
            .finally(() => setAuthChecked(true));
    }, []);

    const loading = !triggers && !error;

    const parsedForm = useMemo(() => {
        const phrasesArr = (form.phrases || "")
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean);
        return {
            ...form,
            phrases: phrasesArr,
            maxUses: form.maxUses ? Number(form.maxUses) : null,
            expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
            cooldownSeconds: Number(form.cooldownSeconds || 0),
            cooldownPerUserSeconds: Number(form.cooldownPerUserSeconds || 0),
            chancePercent: Number(form.chancePercent || 0),
        };
    }, [form]);

    async function handleSave(e) {
        e?.preventDefault();
        try {
            setStatus({ type: "loading", message: "Salvando trigger..." });
            if (editingId) {
                await api.updateTrigger(editingId, parsedForm);
            } else {
                await api.createTrigger(parsedForm);
            }
            setForm(emptyForm);
            setEditingId(null);
            await mutate();
            setStatus({ type: "success", message: "Trigger salva" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao salvar trigger",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2500);
        }
    }

    function handleEdit(trigger) {
        setEditingId(trigger._id);
        setForm({
            name: trigger.name || "",
            phrases: (trigger.phrases || []).join("\n"),
            matchType: trigger.matchType || "exact",
            caseSensitive: !!trigger.caseSensitive,
            normalizeAccents:
                trigger.normalizeAccents === undefined ? true : !!trigger.normalizeAccents,
            wholeWord: !!trigger.wholeWord,
            responseType: trigger.responseType || "text",
            responseText: trigger.responseText || "",
            responseMediaUrl: trigger.responseMediaUrl || "",
            replyMode: trigger.replyMode || "reply",
            mentionSender: !!trigger.mentionSender,
            chancePercent: trigger.chancePercent ?? 100,
            expiresAt: trigger.expiresAt
                ? new Date(trigger.expiresAt).toISOString().slice(0, 16)
                : "",
            maxUses: trigger.maxUses ?? "",
            cooldownSeconds: trigger.cooldownSeconds ?? 0,
            cooldownPerUserSeconds: trigger.cooldownPerUserSeconds ?? 0,
            active: trigger.active ?? true,
        });
    }

    async function handleDelete(id) {
        try {
            await api.deleteTrigger(id);
            await mutate();
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao remover trigger",
            });
        }
    }

    async function handleUpload(file) {
        if (!file) return;
        setUploading(true);
        try {
            const resp = await api.uploadMedia(file);
            const media = resp?.media;
            if (media?.url && media?.type) {
                setForm((prev) => ({
                    ...prev,
                    responseType: media.type === "text" ? "text" : media.type,
                    responseMediaUrl: media.url,
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
            <Layout title="Triggers">
                <Typography>Verificando sessão...</Typography>
            </Layout>
        );
    }

    if (!sessionOk) {
        return (
            <Layout title="Triggers">
                <Alert severity="warning" sx={{ mb: 2 }}>
                    É preciso estar logado. Vá para /login e faça o login.
                </Alert>
            </Layout>
        );
    }

    return (
        <Layout title="Triggers">
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {editingId ? "Editar trigger" : "Nova trigger"}
                            </Typography>
                            <Stack spacing={2} component="form" onSubmit={handleSave}>
                                <TextField
                                    label="Nome (opcional)"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, name: e.target.value }))
                                    }
                                />
                                <TextField
                                    label="Palavras/Frases (1 por linha)"
                                    value={form.phrases}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, phrases: e.target.value }))
                                    }
                                    multiline
                                    minRows={3}
                                    helperText="Pode usar regex se matchType=regex"
                                />
                                <Stack direction="row" spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tipo de match</InputLabel>
                                        <Select
                                            label="Tipo de match"
                                            value={form.matchType}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, matchType: e.target.value }))
                                            }
                                        >
                                            <MenuItem value="exact">Igual</MenuItem>
                                            <MenuItem value="contains">Contém</MenuItem>
                                            <MenuItem value="regex">Regex</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel>Modo de resposta</InputLabel>
                                        <Select
                                            label="Modo de resposta"
                                            value={form.replyMode}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, replyMode: e.target.value }))
                                            }
                                        >
                                            <MenuItem value="reply">Responder a mensagem</MenuItem>
                                            <MenuItem value="new">Mensagem nova</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tipo de resposta</InputLabel>
                                        <Select
                                            label="Tipo de resposta"
                                            value={form.responseType}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    responseType: e.target.value,
                                                }))
                                            }
                                        >
                                            <MenuItem value="text">Texto</MenuItem>
                                            <MenuItem value="image">Imagem</MenuItem>
                                            <MenuItem value="video">Vídeo</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Chance %"
                                        type="number"
                                        value={form.chancePercent}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                chancePercent: e.target.value,
                                            }))
                                        }
                                        inputProps={{ min: 0, max: 100 }}
                                    />
                                </Stack>

                                {form.responseType === "text" ? (
                                    <TextField
                                        label="Texto de resposta"
                                        multiline
                                        minRows={3}
                                        value={form.responseText}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, responseText: e.target.value }))
                                        }
                                    />
                                ) : (
                                    <Stack spacing={1}>
                                        <TextField
                                            label="URL da mídia (use /api/media upload)"
                                            value={form.responseMediaUrl}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    responseMediaUrl: e.target.value,
                                                }))
                                            }
                                        />
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            disabled={uploading}
                                        >
                                            {uploading ? "Enviando..." : "Enviar mídia e preencher URL"}
                                            <input
                                                type="file"
                                                hidden
                                                onChange={(e) => handleUpload(e.target.files?.[0])}
                                            />
                                        </Button>
                                        <TextField
                                            label="Legenda (opcional)"
                                            value={form.responseText}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    responseText: e.target.value,
                                                }))
                                            }
                                        />
                                    </Stack>
                                )}

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Cooldown global (s)"
                                        type="number"
                                        value={form.cooldownSeconds}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                cooldownSeconds: e.target.value,
                                            }))
                                        }
                                    />
                                    <TextField
                                        label="Cooldown por usuário (s)"
                                        type="number"
                                        value={form.cooldownPerUserSeconds}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                cooldownPerUserSeconds: e.target.value,
                                            }))
                                        }
                                    />
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Expira em"
                                        type="datetime-local"
                                        InputLabelProps={{ shrink: true }}
                                        value={form.expiresAt}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, expiresAt: e.target.value }))
                                        }
                                    />
                                    <TextField
                                        label="Máximo de disparos"
                                        type="number"
                                        value={form.maxUses}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, maxUses: e.target.value }))
                                        }
                                    />
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.caseSensitive}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        caseSensitive: e.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Case sensitive"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.normalizeAccents}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        normalizeAccents: e.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Normalizar acentos"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.wholeWord}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        wholeWord: e.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Palavra inteira"
                                    />
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.mentionSender}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        mentionSender: e.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Mencionar remetente"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.active}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        active: e.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Ativo"
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    <Button variant="contained" onClick={handleSave}>
                                        {editingId ? "Salvar alterações" : "Criar trigger"}
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
                                    <Alert
                                        severity={status.type === "error" ? "error" : "success"}
                                    >
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
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mb: 2 }}
                            >
                                <Typography variant="h6">Triggers</Typography>
                                <Chip
                                    label={triggers ? triggers.length : 0}
                                    color="secondary"
                                    size="small"
                                />
                            </Stack>
                            {loading && <Typography>Carregando...</Typography>}
                            {error && (
                                <Alert severity="error">
                                    Erro ao carregar triggers: {error.message}
                                </Alert>
                            )}
                            <Stack spacing={2}>
                                {(triggers || []).map((t) => (
                                    <Card key={t._id} variant="outlined">
                                        <CardContent>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                            >
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    {t.name || "(sem nome)"}
                                                </Typography>
                                                <Chip
                                                    label={t.active ? "Ativo" : "Inativo"}
                                                    color={t.active ? "success" : "default"}
                                                    size="small"
                                                />
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                                Frases: {(t.phrases || []).join(", ")}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Match: {t.matchType} | Resposta: {t.responseType}
                                            </Typography>
                                            {t.responseMediaUrl && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Mídia: {t.responseMediaUrl}
                                                </Typography>
                                            )}
                                            {t.expiresAt && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Expira em:{" "}
                                                    {new Date(t.expiresAt).toLocaleString()}
                                                </Typography>
                                            )}
                                            {(t.maxUses || t.triggeredCount) && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Disparos: {t.triggeredCount || 0}
                                                    {t.maxUses ? ` / ${t.maxUses}` : ""}
                                                </Typography>
                                            )}
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: "flex-end" }}>
                                            <Button size="small" onClick={() => handleEdit(t)}>
                                                Editar
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(t._id)}
                                            >
                                                Remover
                                            </Button>
                                        </CardActions>
                                    </Card>
                                ))}
                                {!loading && triggers?.length === 0 && (
                                    <Typography color="text.secondary">
                                        Nenhuma trigger cadastrada.
                                    </Typography>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Layout>
    );
}

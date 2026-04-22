import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Fab,
    Grid,
    Slider,
    Stack,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TuneIcon from "@mui/icons-material/Tune";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
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
    restrictByUsers: false,
    allowedUsers: [],
};

const RESP_TYPES = [
    { value: "text",  icon: "💬", label: "Texto" },
    { value: "image", icon: "🖼️", label: "Imagem" },
    { value: "video", icon: "🎬", label: "Vídeo" },
];

const BEHAVIOR_FLAGS = [
    { key: "caseSensitive",    label: "Case sensitive" },
    { key: "normalizeAccents", label: "Normalizar acentos" },
    { key: "wholeWord",        label: "Palavra inteira" },
    { key: "mentionSender",    label: "Mencionar remetente" },
];

const MATCH_LABELS = { exact: "igual", contains: "contém", regex: "regex" };

const fetcher = () => api.getTriggers();

// ── Phrase chips para a lista ────────────────────────────
function PhraseChips({ phrases, matchType }) {
    const visible = phrases.slice(0, 4);
    const extra = phrases.length - visible.length;
    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.75 }}>
            {visible.map((p, i) => (
                <Chip
                    key={i}
                    label={p}
                    size="small"
                    sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        height: 22,
                        maxWidth: 180,
                        bgcolor: matchType === "regex"
                            ? "rgba(234,88,12,0.08)"
                            : "grey.100",
                        color: matchType === "regex" ? "secondary.main" : "text.primary",
                        border: "1px solid",
                        borderColor: matchType === "regex"
                            ? "rgba(234,88,12,0.3)"
                            : "divider",
                        borderRadius: 1,
                        "& .MuiChip-label": { px: 1 },
                    }}
                />
            ))}
            {extra > 0 && (
                <Chip
                    label={`+${extra}`}
                    size="small"
                    sx={{
                        height: 22,
                        fontSize: 11,
                        bgcolor: "transparent",
                        border: "1px dashed",
                        borderColor: "divider",
                        color: "text.disabled",
                        borderRadius: 1,
                        "& .MuiChip-label": { px: 1 },
                    }}
                />
            )}
        </Box>
    );
}

// ── Tag chips para a lista ───────────────────────────────
function TriggerTags({ trigger }) {
    const tags = [];

    tags.push({
        label: MATCH_LABELS[trigger.matchType] || trigger.matchType,
        bgcolor: "rgba(15,118,110,0.08)",
        color: "primary.dark",
    });

    const respLabels = { text: "💬 texto", image: "🖼️ imagem", video: "🎬 vídeo" };
    tags.push({
        label: respLabels[trigger.responseType] || trigger.responseType,
        bgcolor: "grey.100",
        color: "text.secondary",
    });

    if (trigger.chancePercent != null && trigger.chancePercent < 100) {
        tags.push({
            label: `⚡ ${trigger.chancePercent}%`,
            bgcolor: "rgba(234,88,12,0.08)",
            color: "secondary.main",
        });
    }

    if (trigger.cooldownSeconds > 0 || trigger.cooldownPerUserSeconds > 0) {
        const cd = trigger.cooldownSeconds > 0
            ? `⏱ ${trigger.cooldownSeconds}s global`
            : `⏱ ${trigger.cooldownPerUserSeconds}s/user`;
        tags.push({ label: cd, bgcolor: "rgba(217,119,6,0.08)", color: "#92400e" });
    }

    if (trigger.allowedUsers?.length > 0) {
        tags.push({
            label: `🔒 ${trigger.allowedUsers.length} pessoas`,
            bgcolor: "error.50" || "rgba(220,38,38,0.06)",
            color: "error.main",
        });
    }

    if (!trigger.active) {
        tags.push({ label: "inativa", bgcolor: "grey.100", color: "text.disabled" });
    }

    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {tags.map((t, i) => (
                <Box
                    key={i}
                    component="span"
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        px: 0.875,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 0.02,
                        bgcolor: t.bgcolor,
                        color: t.color,
                    }}
                >
                    {t.label}
                </Box>
            ))}
        </Box>
    );
}

// ── Card de trigger na lista ─────────────────────────────
function TriggerCard({ trigger, onEdit, onDelete }) {
    const hasUsageBar = trigger.maxUses && trigger.maxUses > 0;
    const usagePct = hasUsageBar
        ? Math.min(100, ((trigger.triggeredCount || 0) / trigger.maxUses) * 100)
        : 0;

    const footerLeft = [
        trigger.replyMode === "reply" ? "↩ responder msg" : "✦ msg nova",
        trigger.expiresAt && `expira ${new Date(trigger.expiresAt).toLocaleDateString("pt-BR")}`,
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3,
                opacity: trigger.active ? 1 : 0.55,
                transition: "border-color 0.15s, box-shadow 0.15s",
                "&:hover": {
                    borderColor: "primary.light",
                    boxShadow: "0 4px 12px rgba(15,118,110,0.1)",
                },
            }}
        >
            <CardContent sx={{ p: "14px 16px 10px", "&:last-child": { pb: "0 !important" } }}>
                {/* Header row */}
                <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    gap={1}
                    mb={0.75}
                >
                    <Stack direction="row" alignItems="center" gap={0.875} minWidth={0}>
                        <Box
                            sx={{
                                width: 7, height: 7,
                                borderRadius: "50%",
                                flexShrink: 0,
                                bgcolor: trigger.active ? "success.main" : "text.disabled",
                                boxShadow: trigger.active
                                    ? "0 0 6px rgba(22,163,74,0.45)"
                                    : "none",
                            }}
                        />
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            noWrap
                            title={trigger.name || "(sem nome)"}
                        >
                            {trigger.name || "(sem nome)"}
                        </Typography>
                    </Stack>
                    <Stack direction="row" gap={0.5} flexShrink={0}>
                        <Tooltip title="Editar">
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => onEdit(trigger)}
                                sx={{
                                    minWidth: 0, px: 1, py: 0.5, fontSize: 13,
                                    borderRadius: 1.5,
                                }}
                            >
                                ✎
                            </Button>
                        </Tooltip>
                        <Tooltip title="Remover">
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => onDelete(trigger.id)}
                                sx={{
                                    minWidth: 0, px: 1, py: 0.5, fontSize: 13,
                                    borderRadius: 1.5,
                                }}
                            >
                                ✕
                            </Button>
                        </Tooltip>
                    </Stack>
                </Stack>

                <PhraseChips phrases={trigger.phrases || []} matchType={trigger.matchType} />
                <TriggerTags trigger={trigger} />

                {/* Footer */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 1.25,
                        pt: 1,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        mx: -2,
                        px: 2,
                        pb: 1.25,
                        bgcolor: "grey.50",
                        gap: 1,
                    }}
                >
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {footerLeft}
                    </Typography>
                    {hasUsageBar ? (
                        <Stack direction="row" alignItems="center" gap={0.75} flexShrink={0}>
                            <Typography variant="caption" color="text.secondary">
                                {trigger.triggeredCount || 0}/{trigger.maxUses}
                            </Typography>
                            <Box
                                sx={{
                                    width: 60, height: 4,
                                    bgcolor: "divider",
                                    borderRadius: 999,
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    sx={{
                                        height: "100%",
                                        width: `${usagePct}%`,
                                        borderRadius: 999,
                                        bgcolor: usagePct >= 100
                                            ? "text.disabled"
                                            : usagePct > 60
                                            ? "secondary.main"
                                            : "primary.main",
                                    }}
                                />
                            </Box>
                        </Stack>
                    ) : (
                        <Typography variant="caption" color="text.secondary" flexShrink={0}>
                            ↑ {trigger.triggeredCount || 0} disparos
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

// ── Formulário ───────────────────────────────────────────
function TriggerForm({
    form, setForm, editingId, onSave, onCancelEdit,
    status, uploading, onUpload,
    contextMembers, contextLoading, contextError, groupId,
    onRefreshContext,
}) {
    const activeBg = (cond) => cond
        ? "rgba(15,118,110,0.07)"
        : "grey.50";
    const activeBorder = (cond) => cond ? "primary.main" : "divider";

    return (
        <Stack spacing={2.5} component="form" onSubmit={onSave}>

            {/* Nome */}
            <TextField
                label="Nome (opcional)"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                size="small"
                fullWidth
            />

            {/* ── Gatilho ───────────────────────────── */}
            <Box>
                <Typography
                    variant="caption"
                    fontWeight={700}
                    textTransform="uppercase"
                    letterSpacing={0.08}
                    color="text.secondary"
                    display="block"
                    mb={1}
                >
                    Gatilho
                </Typography>
                <Stack spacing={1.5}>
                    <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
                            Tipo de match
                        </Typography>
                        <ToggleButtonGroup
                            value={form.matchType}
                            exclusive
                            onChange={(_, val) => val && setForm((p) => ({ ...p, matchType: val }))}
                            fullWidth
                            size="small"
                            sx={{
                                "& .MuiToggleButton-root": {
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    py: 0.75,
                                },
                            }}
                        >
                            <ToggleButton value="exact">Igual</ToggleButton>
                            <ToggleButton value="contains">Contém</ToggleButton>
                            <ToggleButton value="regex">
                                Regex
                                <Chip
                                    label="avançado"
                                    size="small"
                                    color="secondary"
                                    sx={{ ml: 0.75, height: 16, fontSize: 9, "& .MuiChip-label": { px: 0.75 } }}
                                />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <TextField
                        label="Palavras / Frases"
                        value={form.phrases}
                        onChange={(e) => setForm((p) => ({ ...p, phrases: e.target.value }))}
                        multiline
                        minRows={3}
                        size="small"
                        fullWidth
                        helperText="Uma entrada por linha. Com Regex, cada linha é um padrão independente."
                        inputProps={{ style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13 } }}
                    />
                </Stack>
            </Box>

            {/* ── Resposta ──────────────────────────── */}
            <Box>
                <Typography
                    variant="caption"
                    fontWeight={700}
                    textTransform="uppercase"
                    letterSpacing={0.08}
                    color="text.secondary"
                    display="block"
                    mb={1}
                >
                    Resposta
                </Typography>
                <Stack spacing={1.5}>
                    {/* Tipo de resposta: cards */}
                    <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
                            Tipo de resposta
                        </Typography>
                        <Grid container spacing={1}>
                            {RESP_TYPES.map((rt) => (
                                <Grid item xs={4} key={rt.value}>
                                    <Box
                                        onClick={() => setForm((p) => ({ ...p, responseType: rt.value }))}
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 0.5,
                                            py: 1.25,
                                            px: 1,
                                            border: "1.5px solid",
                                            borderColor: activeBorder(form.responseType === rt.value),
                                            borderRadius: 2,
                                            bgcolor: activeBg(form.responseType === rt.value),
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                            userSelect: "none",
                                            "&:hover": {
                                                borderColor: form.responseType === rt.value
                                                    ? "primary.main"
                                                    : "text.disabled",
                                            },
                                        }}
                                    >
                                        <Typography fontSize={20} lineHeight={1}>{rt.icon}</Typography>
                                        <Typography
                                            variant="caption"
                                            fontWeight={700}
                                            textTransform="uppercase"
                                            letterSpacing={0.05}
                                            color={form.responseType === rt.value ? "primary.main" : "text.secondary"}
                                            fontSize={10}
                                        >
                                            {rt.label}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* Conteúdo conforme tipo */}
                    {form.responseType === "text" ? (
                        <TextField
                            label="Texto de resposta"
                            multiline
                            minRows={3}
                            value={form.responseText}
                            onChange={(e) => setForm((p) => ({ ...p, responseText: e.target.value }))}
                            size="small"
                            fullWidth
                        />
                    ) : (
                        <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                <TextField
                                    label="URL da mídia"
                                    value={form.responseMediaUrl}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, responseMediaUrl: e.target.value }))
                                    }
                                    size="small"
                                    fullWidth
                                />
                                <Button
                                    variant="outlined"
                                    component="label"
                                    disabled={uploading}
                                    size="small"
                                    sx={{ whiteSpace: "nowrap", flexShrink: 0, alignSelf: "stretch" }}
                                >
                                    {uploading ? <CircularProgress size={14} /> : "↑ Upload"}
                                    <input
                                        type="file"
                                        hidden
                                        onChange={(e) => onUpload(e.target.files?.[0])}
                                    />
                                </Button>
                            </Stack>
                            <TextField
                                label="Legenda (opcional)"
                                value={form.responseText}
                                onChange={(e) => setForm((p) => ({ ...p, responseText: e.target.value }))}
                                size="small"
                                fullWidth
                            />
                        </Stack>
                    )}

                    {/* Modo de envio */}
                    <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
                            Modo de envio
                        </Typography>
                        <ToggleButtonGroup
                            value={form.replyMode}
                            exclusive
                            onChange={(_, val) => val && setForm((p) => ({ ...p, replyMode: val }))}
                            fullWidth
                            size="small"
                            sx={{
                                "& .MuiToggleButton-root": {
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    py: 0.75,
                                },
                            }}
                        >
                            <ToggleButton value="reply">↩ Responder mensagem</ToggleButton>
                            <ToggleButton value="new">✦ Mensagem nova</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Stack>
            </Box>

            {/* ── Opções avançadas ──────────────────── */}
            <Accordion
                disableGutters
                elevation={0}
                sx={{
                    border: "1.5px solid",
                    borderColor: "divider",
                    borderRadius: "12px !important",
                    "&:before": { display: "none" },
                    "&.Mui-expanded": { borderColor: "primary.light" },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize="small" />}
                    sx={{ minHeight: 44, px: 2, "& .MuiAccordionSummary-content": { my: 0 } }}
                >
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <TuneIcon fontSize="small" sx={{ color: "text.secondary", fontSize: 15 }} />
                        <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing={0.08}>
                            Opções avançadas
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: { xs: "none", sm: "block" } }}>
                            · regex · cooldown · limites · restrições
                        </Typography>
                    </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Stack spacing={2}>

                        {/* Comportamento de match */}
                        <Box>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.75} display="block">
                                Comportamento de match
                            </Typography>
                            <Grid container spacing={0.75}>
                                {BEHAVIOR_FLAGS.map((flag) => (
                                    <Grid item xs={6} key={flag.key}>
                                        <Box
                                            onClick={() =>
                                                setForm((p) => ({ ...p, [flag.key]: !p[flag.key] }))
                                            }
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                px: 1.25,
                                                py: 0.875,
                                                border: "1.5px solid",
                                                borderColor: activeBorder(form[flag.key]),
                                                borderRadius: 1.5,
                                                bgcolor: activeBg(form[flag.key]),
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                                userSelect: "none",
                                                gap: 0.5,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                fontWeight={600}
                                                color={form[flag.key] ? "primary.dark" : "text.secondary"}
                                                lineHeight={1.3}
                                            >
                                                {flag.label}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    width: 28, height: 16,
                                                    borderRadius: 999,
                                                    bgcolor: form[flag.key] ? "primary.main" : "divider",
                                                    transition: "background 0.2s",
                                                    position: "relative",
                                                    flexShrink: 0,
                                                    "&::after": {
                                                        content: '""',
                                                        position: "absolute",
                                                        width: 12, height: 12,
                                                        bgcolor: "white",
                                                        borderRadius: "50%",
                                                        top: 2,
                                                        left: form[flag.key] ? 14 : 2,
                                                        transition: "left 0.2s",
                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Chance % */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    Chance de disparo
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight={700}
                                    color="primary.main"
                                    fontFamily="'JetBrains Mono', monospace"
                                >
                                    {form.chancePercent}%
                                </Typography>
                            </Stack>
                            <Slider
                                value={Number(form.chancePercent)}
                                onChange={(_, val) => setForm((p) => ({ ...p, chancePercent: val }))}
                                min={0}
                                max={100}
                                size="small"
                                color="primary"
                            />
                            <Typography variant="caption" color="text.disabled">
                                Probabilidade de disparar quando a frase for detectada.
                            </Typography>
                        </Box>

                        {/* Cooldowns */}
                        <Box>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.75} display="block">
                                Cooldown
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Global (s)"
                                        type="number"
                                        value={form.cooldownSeconds}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, cooldownSeconds: e.target.value }))
                                        }
                                        size="small"
                                        fullWidth
                                        inputProps={{ min: 0 }}
                                        helperText="Para todo o grupo"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Por usuário (s)"
                                        type="number"
                                        value={form.cooldownPerUserSeconds}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                cooldownPerUserSeconds: e.target.value,
                                            }))
                                        }
                                        size="small"
                                        fullWidth
                                        inputProps={{ min: 0 }}
                                        helperText="Por pessoa"
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Limites */}
                        <Box>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.75} display="block">
                                Limites de disparo
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Expira em"
                                        type="datetime-local"
                                        InputLabelProps={{ shrink: true }}
                                        value={form.expiresAt}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, expiresAt: e.target.value }))
                                        }
                                        size="small"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Máx. disparos"
                                        type="number"
                                        value={form.maxUses}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, maxUses: e.target.value }))
                                        }
                                        size="small"
                                        fullWidth
                                        inputProps={{ min: 1 }}
                                        placeholder="sem limite"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Trigger ativo */}
                        <Box
                            onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                px: 1.5,
                                py: 1,
                                border: "1.5px solid",
                                borderColor: activeBorder(form.active),
                                borderRadius: 1.5,
                                bgcolor: activeBg(form.active),
                                cursor: "pointer",
                                userSelect: "none",
                            }}
                        >
                            <Typography variant="body2" fontWeight={600} color={form.active ? "primary.dark" : "text.secondary"}>
                                Trigger ativa
                            </Typography>
                            <Box
                                sx={{
                                    width: 34, height: 19,
                                    borderRadius: 999,
                                    bgcolor: form.active ? "primary.main" : "divider",
                                    transition: "background 0.2s",
                                    position: "relative",
                                    flexShrink: 0,
                                    "&::after": {
                                        content: '""',
                                        position: "absolute",
                                        width: 15, height: 15,
                                        bgcolor: "white",
                                        borderRadius: "50%",
                                        top: 2,
                                        left: form.active ? 17 : 2,
                                        transition: "left 0.2s",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                    },
                                }}
                            />
                        </Box>

                        {/* Restrição de usuários */}
                        <Box>
                            <Box
                                onClick={() =>
                                    setForm((p) => ({
                                        ...p,
                                        restrictByUsers: !p.restrictByUsers,
                                        allowedUsers: !p.restrictByUsers ? p.allowedUsers : [],
                                    }))
                                }
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    px: 1.5,
                                    py: 1,
                                    border: "1.5px solid",
                                    borderColor: activeBorder(form.restrictByUsers),
                                    borderRadius: 1.5,
                                    bgcolor: activeBg(form.restrictByUsers),
                                    cursor: "pointer",
                                    userSelect: "none",
                                    mb: form.restrictByUsers ? 1 : 0,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    color={form.restrictByUsers ? "primary.dark" : "text.secondary"}
                                >
                                    Restrito a pessoas específicas
                                </Typography>
                                <Box
                                    sx={{
                                        width: 34, height: 19,
                                        borderRadius: 999,
                                        bgcolor: form.restrictByUsers ? "primary.main" : "divider",
                                        transition: "background 0.2s",
                                        position: "relative",
                                        flexShrink: 0,
                                        "&::after": {
                                            content: '""',
                                            position: "absolute",
                                            width: 15, height: 15,
                                            bgcolor: "white",
                                            borderRadius: "50%",
                                            top: 2,
                                            left: form.restrictByUsers ? 17 : 2,
                                            transition: "left 0.2s",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                        },
                                    }}
                                />
                            </Box>

                            {form.restrictByUsers && (
                                <Stack spacing={1}>
                                    {contextError && (
                                        <Alert severity="warning" sx={{ py: 0.5 }}>{contextError}</Alert>
                                    )}
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="caption" color="text.secondary">
                                            Quem pode disparar
                                        </Typography>
                                        {contextLoading ? (
                                            <CircularProgress size={14} thickness={5} />
                                        ) : (
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={onRefreshContext}
                                                disabled={!groupId}
                                                sx={{ fontSize: 11, py: 0, minHeight: 0 }}
                                            >
                                                Atualizar contexto
                                            </Button>
                                        )}
                                    </Stack>
                                    <Autocomplete
                                        multiple
                                        disableCloseOnSelect
                                        options={contextMembers}
                                        getOptionLabel={(option) =>
                                            option.pushname ||
                                            option.displayName ||
                                            option.name ||
                                            option.number ||
                                            option.id ||
                                            "Sem nome"
                                        }
                                        renderOption={(props, option) => {
                                            const label =
                                                option.pushname ||
                                                option.displayName ||
                                                option.name ||
                                                option.number ||
                                                option.id;
                                            return (
                                                <li {...props} key={option.id || label}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Avatar
                                                            src={option.profilePicUrl || ""}
                                                            alt={label}
                                                            sx={{ width: 28, height: 28 }}
                                                        >
                                                            {(label || "?").charAt(0)}
                                                        </Avatar>
                                                        <Typography variant="body2">{label}</Typography>
                                                    </Stack>
                                                </li>
                                            );
                                        }}
                                        value={(form.allowedUsers || []).map(
                                            (id) =>
                                                contextMembers.find((m) => m.id === id) || {
                                                    id,
                                                    name: id,
                                                }
                                        )}
                                        onChange={(_, newVal) =>
                                            setForm((p) => ({
                                                ...p,
                                                allowedUsers: newVal.map((m) => m.id).filter(Boolean),
                                            }))
                                        }
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip
                                                    {...getTagProps({ index })}
                                                    key={option.id || option.name}
                                                    avatar={
                                                        <Avatar
                                                            src={option.profilePicUrl || ""}
                                                            alt={option.name || option.id}
                                                        >
                                                            {(
                                                                option.pushname ||
                                                                option.name ||
                                                                option.id ||
                                                                "?"
                                                            ).charAt(0)}
                                                        </Avatar>
                                                    }
                                                    label={
                                                        option.pushname ||
                                                        option.displayName ||
                                                        option.name ||
                                                        option.number ||
                                                        option.id
                                                    }
                                                    size="small"
                                                />
                                            ))
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Selecione quem pode disparar"
                                                size="small"
                                                placeholder={
                                                    contextLoading ? "Carregando..." : "Escolha membros"
                                                }
                                            />
                                        )}
                                    />
                                </Stack>
                            )}
                        </Box>

                    </Stack>
                </AccordionDetails>
            </Accordion>

            {/* ── Ações ─────────────────────────────── */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                <Button
                    variant="contained"
                    onClick={onSave}
                    fullWidth
                    size="large"
                    sx={{ fontWeight: 700 }}
                >
                    {editingId ? "Salvar alterações" : "Criar trigger"}
                </Button>
                {editingId && (
                    <Button variant="text" onClick={onCancelEdit} sx={{ whiteSpace: "nowrap" }}>
                        Cancelar edição
                    </Button>
                )}
            </Stack>

            {status.type !== "idle" && status.message && (
                <Alert severity={status.type === "error" ? "error" : "success"} sx={{ py: 0.5 }}>
                    {status.message}
                </Alert>
            )}
        </Stack>
    );
}

// ── Página principal ─────────────────────────────────────
export default function TriggersPage() {
    const { data: triggers, mutate, error } = useSWR("/api/triggers", fetcher);
    const [authChecked, setAuthChecked] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [uploading, setUploading] = useState(false);
    const [sessionOk, setSessionOk] = useState(true);
    const [contextMembers, setContextMembers] = useState([]);
    const [contextLoading, setContextLoading] = useState(false);
    const [contextError, setContextError] = useState("");
    const [mobileTab, setMobileTab] = useState(0);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const groupId =
        process.env.NEXT_PUBLIC_GROUP_ID ||
        process.env.NEXT_PUBLIC_ALLOWED_PING_GROUP ||
        process.env.NEXT_PUBLIC_GROUP ||
        "";

    useEffect(() => {
        api.me()
            .then(() => setSessionOk(true))
            .catch(() => setSessionOk(false))
            .finally(() => setAuthChecked(true));
    }, []);

    useEffect(() => {
        if (!sessionOk) return;
        if (!groupId) {
            setContextError("Defina NEXT_PUBLIC_GROUP_ID para carregar membros do grupo.");
            return;
        }
        setContextLoading(true);
        setContextError("");
        api.getGroupContext(groupId)
            .then((ctx) => setContextMembers(ctx?.members || []))
            .catch((err) => setContextError(err?.message || "Erro ao carregar contexto"))
            .finally(() => setContextLoading(false));
    }, [sessionOk, groupId]);

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
            allowedUsers: form.restrictByUsers ? form.allowedUsers : [],
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
            if (isMobile) setMobileTab(0);
        } catch (err) {
            setStatus({ type: "error", message: err?.message || "Erro ao salvar trigger" });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2500);
        }
    }

    function handleEdit(trigger) {
        setEditingId(trigger.id);
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
            restrictByUsers: (trigger.allowedUsers || []).length > 0,
            allowedUsers: trigger.allowedUsers || [],
        });
        if (isMobile) setMobileTab(1);
    }

    function handleCancelEdit() {
        setEditingId(null);
        setForm(emptyForm);
    }

    async function handleDelete(id) {
        try {
            await api.deleteTrigger(id);
            await mutate();
        } catch (err) {
            setStatus({ type: "error", message: err?.message || "Erro ao remover trigger" });
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2500);
        }
    }

    async function handleUpload(file) {
        if (!file) return;
        setUploading(true);
        try {
            const resp = await api.uploadMedia(file, "trigger");
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
            setStatus({ type: "error", message: err?.message || "Erro ao enviar mídia" });
        } finally {
            setUploading(false);
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2500);
        }
    }

    async function handleRefreshContext() {
        try {
            setContextLoading(true);
            await api.refreshGroupContext(groupId);
            try {
                const ctx = await api.getGroupContext(groupId);
                setContextMembers(ctx?.members || []);
            } catch (_) {}
            setContextError("");
        } catch (err) {
            setContextError(err?.message || "Erro ao atualizar contexto");
        } finally {
            setContextLoading(false);
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

    const activeCount = (triggers || []).filter((t) => t.active).length;

    const formProps = {
        form, setForm, editingId,
        onSave: handleSave,
        onCancelEdit: handleCancelEdit,
        status, uploading,
        onUpload: handleUpload,
        contextMembers, contextLoading, contextError, groupId,
        onRefreshContext: handleRefreshContext,
    };

    // ── Lista de triggers ─────────────────────────
    const listContent = (
        <>
            {loading && <CircularProgress size={24} />}
            {error && (
                <Alert severity="error">Erro ao carregar triggers: {error.message}</Alert>
            )}
            <Stack spacing={1.25}>
                {(triggers || []).map((t) => (
                    <TriggerCard
                        key={t.id}
                        trigger={t}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
                {!loading && (triggers || []).length === 0 && (
                    <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                        <Typography fontSize={36} mb={1}>🤖</Typography>
                        <Typography variant="body2" fontWeight={600}>
                            Nenhuma trigger cadastrada
                        </Typography>
                        <Typography variant="caption">
                            Crie uma trigger para começar a responder mensagens automaticamente.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </>
    );

    // ── Layout mobile: tabs ───────────────────────
    if (isMobile) {
        return (
            <Layout title="">
                <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
                            Triggers
                        </Typography>
                        <Chip
                            label={`${activeCount} ativa${activeCount !== 1 ? "s" : ""}`}
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                    </Stack>
                    <Tabs
                        value={mobileTab}
                        onChange={(_, v) => setMobileTab(v)}
                        variant="fullWidth"
                        sx={{ borderBottom: 1, borderColor: "divider" }}
                    >
                        <Tab
                            label={`Lista (${(triggers || []).length})`}
                            sx={{ fontWeight: 700, textTransform: "none", fontSize: 14 }}
                        />
                        <Tab
                            label={editingId ? "Editar trigger" : "Nova trigger"}
                            sx={{ fontWeight: 700, textTransform: "none", fontSize: 14 }}
                        />
                    </Tabs>
                </Box>

                {mobileTab === 0 && (
                    <Box>
                        {listContent}
                        {/* FAB para nova trigger */}
                        <Fab
                            color="primary"
                            aria-label="Nova trigger"
                            onClick={() => {
                                handleCancelEdit();
                                setMobileTab(1);
                            }}
                            sx={{
                                position: "fixed",
                                bottom: 24,
                                right: 20,
                                boxShadow: "0 6px 20px rgba(15,118,110,0.35)",
                            }}
                        >
                            <AddIcon />
                        </Fab>
                    </Box>
                )}

                {mobileTab === 1 && (
                    <TriggerForm {...formProps} />
                )}
            </Layout>
        );
    }

    // ── Layout desktop: two columns ───────────────
    return (
        <Layout title="">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em">
                    Triggers
                </Typography>
                <Chip
                    label={`${activeCount} ativa${activeCount !== 1 ? "s" : ""} · ${(triggers || []).length} total`}
                    color="success"
                    variant="outlined"
                    size="small"
                />
            </Stack>

            <Grid container spacing={3}>
                {/* Formulário */}
                <Grid item xs={12} md={5}>
                    <Card
                        elevation={0}
                        sx={{
                            border: "1.5px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                            position: { md: "sticky" },
                            top: { md: 24 },
                        }}
                    >
                        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                                <Box>
                                    <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
                                        {editingId ? (
                                            <>Editar <Box component="span" color="primary.main">trigger</Box></>
                                        ) : (
                                            <>Nova <Box component="span" color="primary.main">trigger</Box></>
                                        )}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        define o gatilho e a resposta automática
                                    </Typography>
                                </Box>
                                {editingId && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={handleCancelEdit}
                                        sx={{ fontSize: 12 }}
                                    >
                                        ✕ cancelar
                                    </Button>
                                )}
                            </Stack>
                            <TriggerForm {...formProps} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Lista */}
                <Grid item xs={12} md={7}>
                    <Stack spacing={1.25} direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                            Triggers configuradas
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleCancelEdit}
                            sx={{ fontSize: 12 }}
                        >
                            + Nova
                        </Button>
                    </Stack>
                    {listContent}
                </Grid>
            </Grid>
        </Layout>
    );
}

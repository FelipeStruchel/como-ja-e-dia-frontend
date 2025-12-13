import { useState } from "react";
import useSWR from "swr";
import {
    Box,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Typography,
    Stack,
    LinearProgress,
    Alert,
    Divider,
    Chip,
    Grid,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

const MAX_TEXT_LENGTH = 4000;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const fetcher = (key) => {
    if (key === "frases") return api.getFrases();
    if (key === "media") return api.getMedia();
    return null;
};

function getFilename(item) {
    if (item?.fileName) return item.fileName;
    if (item?.path) return item.path.split("/").pop();
    if (item?.urlPublic) return item.urlPublic.split("/").pop();
    if (item?.url) return item.url.split("/").pop();
    return "";
}

export default function DailyPage() {
    const { data: frases, mutate: mutateFrases, isValidating: frasesLoading } =
        useSWR("frases", fetcher);
    const { data: media, mutate: mutateMedia, isValidating: mediaLoading } =
        useSWR("media", fetcher);

    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: "idle", message: "" });

    const isUploading = status.type === "loading";

    async function handleAddFrase(e) {
        e.preventDefault();
        if (!text.trim()) {
            setStatus({ type: "error", message: "Digite uma mensagem" });
            return;
        }
        if (text.length > MAX_TEXT_LENGTH) {
            setStatus({
                type: "error",
                message: `Limite de ${MAX_TEXT_LENGTH} caracteres`,
            });
            return;
        }
        try {
            setStatus({ type: "loading", message: "Enviando..." });
            await api.addFrase(text.trim());
            setText("");
            await mutateFrases();
            setStatus({ type: "success", message: "Mensagem enviada" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao enviar mensagem",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
        }
    }

    async function handleUpload(e) {
        e.preventDefault();
        if (!file) {
            setStatus({ type: "error", message: "Selecione um arquivo" });
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setStatus({
                type: "error",
                message: "Arquivo maior que 100MB",
            });
            return;
        }
        try {
            setStatus({ type: "loading", message: "Enviando mídia..." });
            await api.uploadMedia(file);
            setFile(null);
            await mutateMedia();
            setStatus({ type: "success", message: "Mídia enviada" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao enviar mídia",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
        }
    }

    async function handleDeleteFrase(index) {
        try {
            await api.deleteFraseByIndex(index);
            await mutateFrases();
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao apagar",
            });
        }
    }

    async function handleDeleteMedia(item) {
        const filename = getFilename(item);
        if (!filename || !item?.type) return;
        try {
            await api.deleteMedia(item.type, filename);
            await mutateMedia();
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao apagar mídia",
            });
        }
    }

    return (
        <Layout title="Mensagem do Dia">
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Enviar texto
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                A mensagem será usada como base para a Mensagem do Dia no
                                grupo.
                            </Typography>
                            <Box
                                component="form"
                                onSubmit={handleAddFrase}
                                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                            >
                                <TextField
                                    label="Mensagem"
                                    multiline
                                    minRows={4}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    helperText={`${text.length}/${MAX_TEXT_LENGTH}`}
                                />
                                <CardActions sx={{ p: 0 }}>
                                    <Button
                                        variant="contained"
                                        type="submit"
                                        disabled={isUploading}
                                    >
                                        Enviar texto
                                    </Button>
                                </CardActions>
                            </Box>
                        </CardContent>
                        {isUploading && <LinearProgress />}
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Enviar mídia
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                JPG, PNG, GIF, MP4, MOV, AVI, MKV (até 100MB).
                            </Typography>
                            <Box
                                component="form"
                                onSubmit={handleUpload}
                                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                            >
                                <Button variant="outlined" component="label">
                                    {file ? file.name : "Selecionar arquivo"}
                                    <input
                                        type="file"
                                        hidden
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </Button>
                                <CardActions sx={{ p: 0 }}>
                                    <Button
                                        variant="contained"
                                        type="submit"
                                        disabled={isUploading}
                                    >
                                        Enviar mídia
                                    </Button>
                                </CardActions>
                            </Box>
                        </CardContent>
                        {isUploading && <LinearProgress />}
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                                sx={{ mb: 2, gap: 1 }}
                            >
                                <Typography variant="h6">Textos</Typography>
                                <Chip
                                    label={`${frases?.length || 0}`}
                                    color="secondary"
                                    size="small"
                                />
                            </Stack>
                            {frasesLoading && <LinearProgress sx={{ mb: 2 }} />}
                            <Stack spacing={1.5}>
                                {(frases || []).map((frase, idx) => (
                                    <Card
                                        key={`${idx}-${frase.slice(0, 10)}`}
                                        variant="outlined"
                                        sx={{ bgcolor: "grey.50" }}
                                    >
                                        <CardContent>
                                            <Typography variant="body1">{frase}</Typography>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: "flex-end" }}>
                                            <Button
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteFrase(idx)}
                                            >
                                                Apagar
                                            </Button>
                                        </CardActions>
                                    </Card>
                                ))}
                                {!frasesLoading && (frases || []).length === 0 && (
                                    <Typography color="text.secondary">
                                        Nenhum texto enviado ainda.
                                    </Typography>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                                sx={{ mb: 2, gap: 1 }}
                            >
                                <Typography variant="h6">Mídias</Typography>
                                <Chip
                                    label={`${media?.length || 0}`}
                                    color="secondary"
                                    size="small"
                                />
                            </Stack>
                            {mediaLoading && <LinearProgress sx={{ mb: 2 }} />}
                            <Grid container spacing={2}>
                                {(media || []).map((item) => {
                                    const filename = getFilename(item);
                                    const url = item.urlPublic || item.url || item.path || "";
                                    const isImage = item.type === "image";
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={filename}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 600, mb: 1 }}
                                                    >
                                                        {filename || "mídia"}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            mb: 1,
                                                            bgcolor: "grey.100",
                                                        }}
                                                    >
                                                        {isImage ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={url}
                                                                alt={filename}
                                                                style={{
                                                                    width: "100%",
                                                                    height: 200,
                                                                    objectFit: "cover",
                                                                }}
                                                            />
                                                        ) : (
                                                            <video
                                                                src={url}
                                                                controls
                                                                style={{
                                                                    width: "100%",
                                                                    height: 200,
                                                                    objectFit: "cover",
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Button
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleDeleteMedia(item)}
                                                    >
                                                        Apagar
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                            {!mediaLoading && (media || []).length === 0 && (
                                <Typography color="text.secondary" sx={{ mt: 1 }}>
                                    Nenhuma mídia enviada ainda.
                                </Typography>
                            )}
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
            <Divider sx={{ my: 4 }} />
            <Typography variant="body2" color="text.secondary">
                API: {"/api"}
            </Typography>
        </Layout>
    );
}

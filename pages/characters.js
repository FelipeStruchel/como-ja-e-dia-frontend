import { useState } from "react"
import useSWR from "swr"
import {
    Alert, Box, Button, Card, CardContent, CardMedia, Chip, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogTitle, Fab, FormControl,
    Grid, InputLabel, MenuItem, Pagination, Select, Stack, TextField,
    ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import Layout from "../components/Layout"
import { api } from "../lib/apiClient"
import { useAuth } from "../lib/auth"

const CATEGORIES = ["ANIME", "SERIES", "MOVIE", "STREAMER"]
const RARITIES = ["COMMON", "RARE", "EPIC", "LEGENDARY"]
const RARITY_COLOR = { COMMON: "default", RARE: "info", EPIC: "secondary", LEGENDARY: "warning" }
const RARITY_LABEL = { COMMON: "Comum", RARE: "Raro", EPIC: "Épico", LEGENDARY: "Lendário" }
const PAGE_SIZE = 20

const emptyForm = {
    name: "", series: "", category: "ANIME", imageUrl: "",
    popularityScore: "", rarityOverride: "", active: true,
}

function computePreview(score, override) {
    const n = parseFloat(score)
    if (isNaN(n)) return null
    const rarity = override || (n >= 90 ? "LEGENDARY" : n >= 70 ? "EPIC" : n >= 40 ? "RARE" : "COMMON")
    const mult = { COMMON: 1, RARE: 2, EPIC: 4, LEGENDARY: 8 }[rarity]
    return { rarity, coinValue: Math.floor(n * mult) }
}

export default function CharactersPage() {
    const { hasRole } = useAuth()
    const isAdmin = hasRole("miru_cadastro")

    const [filters, setFilters] = useState({ category: "", rarity: "", search: "" })
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const swrKey = JSON.stringify({ ...filters, page, pageSize: PAGE_SIZE })
    const { data, mutate, isLoading } = useSWR(swrKey, () =>
        api.getCharacters({ ...filters, page, pageSize: PAGE_SIZE })
    )

    const items = data?.items ?? []
    const total = data?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

    function openCreate() {
        setEditing(null)
        setForm(emptyForm)
        setError("")
        setDialogOpen(true)
    }

    function openEdit(char) {
        setEditing(char)
        setForm({
            name: char.name, series: char.series, category: char.category,
            imageUrl: char.imageUrl, popularityScore: String(char.popularityScore),
            rarityOverride: "", active: char.active,
        })
        setError("")
        setDialogOpen(true)
    }

    async function handleSave() {
        setSaving(true)
        setError("")
        try {
            const payload = {
                name: form.name, series: form.series, category: form.category,
                imageUrl: form.imageUrl,
                popularityScore: parseFloat(form.popularityScore),
                active: form.active,
                ...(form.rarityOverride ? { rarityOverride: form.rarityOverride } : {}),
            }
            if (editing) {
                await api.updateCharacter(editing.id, payload)
            } else {
                await api.createCharacter(payload)
            }
            await mutate()
            setDialogOpen(false)
        } catch (err) {
            setError(err.message || "Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(char) {
        if (!confirm(`Desativar "${char.name}"?`)) return
        try {
            await api.deleteCharacter(char.id)
            await mutate()
        } catch (err) {
            alert(err.message || "Erro ao deletar")
        }
    }

    const preview = computePreview(form.popularityScore, form.rarityOverride)

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" mb={2}>
                    🎴 Personagens Miru
                </Typography>

                {/* Filters */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} flexWrap="wrap">
                    <TextField
                        label="Buscar" size="small" value={filters.search}
                        onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
                        sx={{ minWidth: 200 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Categoria</InputLabel>
                        <Select label="Categoria" value={filters.category}
                            onChange={(e) => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1) }}>
                            <MenuItem value="">Todas</MenuItem>
                            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Raridade</InputLabel>
                        <Select label="Raridade" value={filters.rarity}
                            onChange={(e) => { setFilters(f => ({ ...f, rarity: e.target.value })); setPage(1) }}>
                            <MenuItem value="">Todas</MenuItem>
                            {RARITIES.map(r => <MenuItem key={r} value={r}>{RARITY_LABEL[r]}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Stack>

                {/* Content */}
                {isLoading ? (
                    <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
                ) : items.length === 0 ? (
                    <Typography color="text.secondary">Nenhum personagem encontrado.</Typography>
                ) : (
                    <Grid container spacing={2}>
                        {items.map((char) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={char.id}>
                                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                                    <CardMedia
                                        component="img" height="200"
                                        image={char.imageUrl} alt={char.name}
                                        sx={{ objectFit: "cover" }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                            {char.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {char.series}
                                        </Typography>
                                        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                                            <Chip
                                                label={RARITY_LABEL[char.rarity]}
                                                color={RARITY_COLOR[char.rarity]}
                                                size="small"
                                            />
                                            <Chip label={`🪙 ${char.coinValue}`} size="small" variant="outlined" />
                                            <Chip label={char.category} size="small" variant="outlined" />
                                        </Stack>
                                    </CardContent>
                                    {isAdmin && (
                                        <Box sx={{ p: 1, display: "flex", gap: 1 }}>
                                            <Button size="small" startIcon={<EditIcon />}
                                                onClick={() => openEdit(char)}>
                                                Editar
                                            </Button>
                                            <Button size="small" color="error" startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(char)}>
                                                Desativar
                                            </Button>
                                        </Box>
                                    )}
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Pagination */}
                {pageCount > 1 && (
                    <Box display="flex" justifyContent="center" mt={3}>
                        <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} />
                    </Box>
                )}

                {/* Admin FAB */}
                {isAdmin && (
                    <Fab color="primary" sx={{ position: "fixed", bottom: 24, right: 24 }}
                        onClick={openCreate}>
                        <AddIcon />
                    </Fab>
                )}

                {/* Create / Edit Dialog */}
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{editing ? "Editar Personagem" : "Novo Personagem"}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} pt={1}>
                            {error && <Alert severity="error">{error}</Alert>}
                            <TextField label="Nome" required value={form.name}
                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                            <TextField label="Série / Obra" required value={form.series}
                                onChange={(e) => setForm(f => ({ ...f, series: e.target.value }))} />
                            <FormControl fullWidth required>
                                <InputLabel>Categoria</InputLabel>
                                <Select label="Categoria" value={form.category}
                                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                                    {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField label="URL da Imagem" required value={form.imageUrl}
                                onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
                            <TextField
                                label="Popularity Score (0–100)" required type="number"
                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                value={form.popularityScore}
                                onChange={(e) => setForm(f => ({ ...f, popularityScore: e.target.value }))}
                                helperText={preview
                                    ? `Auto: ${RARITY_LABEL[preview.rarity]} • 🪙 ${preview.coinValue} coins`
                                    : ""}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Override de Raridade (opcional)</InputLabel>
                                <Select
                                    label="Override de Raridade (opcional)"
                                    value={form.rarityOverride}
                                    onChange={(e) => setForm(f => ({ ...f, rarityOverride: e.target.value }))}>
                                    <MenuItem value="">Auto (pelo score)</MenuItem>
                                    {RARITIES.map(r => <MenuItem key={r} value={r}>{RARITY_LABEL[r]}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <ToggleButtonGroup
                                value={form.active ? "active" : "inactive"} exclusive size="small"
                                onChange={(_, v) => v && setForm(f => ({ ...f, active: v === "active" }))}>
                                <ToggleButton value="active">Ativo</ToggleButton>
                                <ToggleButton value="inactive">Inativo</ToggleButton>
                            </ToggleButtonGroup>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button variant="contained" onClick={handleSave} disabled={saving}>
                            {saving ? "Salvando…" : "Salvar"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    )
}

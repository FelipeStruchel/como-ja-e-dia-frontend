import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
    Card,
    CardContent,
    Grid,
    Typography,
    Alert,
    Stack,
    Switch,
    FormControlLabel,
    LinearProgress,
    Button,
    TextField,
} from "@mui/material";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { api } from "../lib/apiClient";
import GroupPicker from "../components/GroupPicker";

const FEATURES = [
    { key: "pokemonEnabled", label: "Pokémon" },
    { key: "confessionsEnabled", label: "Confissões" },
    { key: "scheduledGreetingsEnabled", label: "Saudações agendadas" },
    { key: "triggersEnabled", label: "Triggers" },
    { key: "contextSyncEnabled", label: "Sync de contexto" },
];

export default function GroupsPage() {
    const { user, loading, hasRole } = useAuth();
    const router = useRouter();
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [error, setError] = useState("");
    const [newName, setNewName] = useState("");
    const [picked, setPicked] = useState(null);

    useEffect(() => {
        if (!loading && user && !hasRole("super_admin")) {
            router.replace("/403");
        }
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, hasRole, router]);

    function refresh() {
        setLoadingGroups(true);
        api.getGroups()
            .then((data) => setGroups(data || []))
            .catch((err) => setError(err?.message || "Erro ao carregar grupos"))
            .finally(() => setLoadingGroups(false));
    }

    useEffect(() => {
        if (!user || !hasRole("super_admin")) return;
        refresh();
    }, [user]);

    async function handleToggle(group, key) {
        await api.updateGroup(group.id, { [key]: !group[key] });
        setGroups((prev) =>
            prev.map((g) => (g.id === group.id ? { ...g, [key]: !g[key] } : g))
        );
    }

    async function handleDelete(id) {
        await api.deleteGroup(id);
        setGroups((prev) => prev.filter((g) => g.id !== id));
    }

    async function handleAdd() {
        if (!picked) return;
        const created = await api.createGroup({
            id: picked.id,
            name: newName.trim() || picked.subject || picked.id,
        });
        setGroups((prev) => [...prev, created]);
        setPicked(null);
        setNewName("");
    }

    if (loading || !user) return null;

    return (
        <Layout title="Gerenciar Grupos">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    {loadingGroups && <LinearProgress sx={{ mb: 2 }} />}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                                Adicionar grupo
                            </Typography>
                            <Stack spacing={1.5}>
                                <GroupPicker onSelect={setPicked} label="Grupo do WhatsApp" />
                                <TextField
                                    label="Nome de exibição (opcional)"
                                    size="small"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                                <Button variant="contained" onClick={handleAdd} disabled={!picked}>
                                    Adicionar
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Stack spacing={2}>
                        {groups.map((g) => (
                            <Card key={g.id} variant="outlined">
                                <CardContent>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        justifyContent="space-between"
                                    >
                                        <Stack spacing={0.5}>
                                            <Typography fontWeight={700}>{g.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {g.id}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" flexWrap="wrap" spacing={1}>
                                            {FEATURES.map((f) => (
                                                <FormControlLabel
                                                    key={f.key}
                                                    control={
                                                        <Switch
                                                            checked={!!g[f.key]}
                                                            onChange={() => handleToggle(g, f.key)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={f.label}
                                                />
                                            ))}
                                        </Stack>
                                        <Button color="error" size="small" onClick={() => handleDelete(g.id)}>
                                            Remover
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                        {!loadingGroups && groups.length === 0 && (
                            <Typography color="text.secondary">Nenhum grupo cadastrado.</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Layout>
    );
}

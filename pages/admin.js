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
    Checkbox,
    FormGroup,
    LinearProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from "@mui/material";
import Layout from "../components/Layout";
import WhatsAppStatus from "../components/WhatsAppStatus";
import { useAuth } from "../lib/auth";
import { api } from "../lib/apiClient";

export default function AdminPage() {
    const { user, loading, hasRole } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userError, setUserError] = useState("");
    const [pendingGroupByUser, setPendingGroupByUser] = useState({});

    useEffect(() => {
        if (!loading && user && !hasRole("super_admin")) {
            router.replace("/403");
        }
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, hasRole, router]);

    useEffect(() => {
        if (!user || !hasRole("super_admin")) return;
        setLoadingUsers(true);
        Promise.all([api.listUsers(), api.listRoles(), api.getGroups()])
            .then(([usersData, rolesData, groupsData]) => {
                setUsers(usersData || []);
                setAvailableRoles(rolesData || []);
                setGroups(groupsData || []);
                setUserError("");
            })
            .catch((err) => setUserError(err?.message || "Erro ao carregar dados"))
            .finally(() => setLoadingUsers(false));
    }, [user]);

    async function handleActiveToggle(id, currentActive) {
        const newActive = !currentActive;
        await api.setUserActive(id, newActive);
        setUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, active: newActive } : u))
        );
    }

    async function handleRoleToggle(userId, slug, currentlyHas) {
        if (currentlyHas) {
            await api.removeRole(userId, slug);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId
                        ? { ...u, roles: u.roles.filter((r) => r !== slug) }
                        : u
                )
            );
        } else {
            await api.assignRole(userId, slug);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, roles: [...u.roles, slug] } : u
                )
            );
        }
    }

    async function handleAddGroupAdmin(u) {
        const groupId = pendingGroupByUser[u.id];
        if (!groupId) return;
        await api.addGroupAdmin(groupId, u.email);
        setUsers((prev) =>
            prev.map((it) =>
                it.id === u.id
                    ? { ...it, adminGroupIds: [...(it.adminGroupIds || []), groupId] }
                    : it
            )
        );
        setPendingGroupByUser((prev) => ({ ...prev, [u.id]: "" }));
    }

    async function handleRemoveGroupAdmin(userId, groupId) {
        await api.removeGroupAdmin(groupId, userId);
        setUsers((prev) =>
            prev.map((it) =>
                it.id === userId
                    ? { ...it, adminGroupIds: (it.adminGroupIds || []).filter((id) => id !== groupId) }
                    : it
            )
        );
    }

    if (loading || !user) return null;

    return (
        <Layout title="Gerenciar Usuários">
            <WhatsAppStatus />
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    {loadingUsers && <LinearProgress sx={{ mb: 2 }} />}
                    {userError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {userError}
                        </Alert>
                    )}
                    <Stack spacing={2}>
                        {users.map((u) => (
                            <Card key={u.id} variant="outlined">
                                <CardContent>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        alignItems={{ sm: "flex-start" }}
                                        justifyContent="space-between"
                                    >
                                        <Stack spacing={0.5}>
                                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                                {u.email}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {u.name || "Sem nome"}
                                            </Typography>
                                            <Chip
                                                label={u.active ? "ativo" : "inativo"}
                                                color={u.active ? "success" : "default"}
                                                variant="outlined"
                                                size="small"
                                                sx={{ width: "fit-content" }}
                                            />
                                        </Stack>
                                        <Stack spacing={1}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={u.active}
                                                        onChange={() => handleActiveToggle(u.id, u.active)}
                                                        size="small"
                                                    />
                                                }
                                                label="Conta ativa"
                                            />
                                            <FormGroup>
                                                {availableRoles.map((role) => (
                                                    <FormControlLabel
                                                        key={role.slug}
                                                        control={
                                                            <Checkbox
                                                                checked={u.roles.includes(role.slug)}
                                                                onChange={() =>
                                                                    handleRoleToggle(
                                                                        u.id,
                                                                        role.slug,
                                                                        u.roles.includes(role.slug)
                                                                    )
                                                                }
                                                                size="small"
                                                            />
                                                        }
                                                        label={role.name}
                                                    />
                                                ))}
                                            </FormGroup>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                                Admin de grupo
                                            </Typography>
                                            <Stack direction="row" flexWrap="wrap" spacing={1}>
                                                {(u.adminGroupIds || []).map((groupId) => {
                                                    const group = groups.find((g) => g.id === groupId);
                                                    return (
                                                        <Chip
                                                            key={groupId}
                                                            label={group?.name || groupId}
                                                            size="small"
                                                            onDelete={() => handleRemoveGroupAdmin(u.id, groupId)}
                                                        />
                                                    );
                                                })}
                                                {(u.adminGroupIds || []).length === 0 && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Nenhum grupo
                                                    </Typography>
                                                )}
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                                    <InputLabel id={`add-group-${u.id}`}>Adicionar grupo</InputLabel>
                                                    <Select
                                                        labelId={`add-group-${u.id}`}
                                                        label="Adicionar grupo"
                                                        value={pendingGroupByUser[u.id] || ""}
                                                        onChange={(e) =>
                                                            setPendingGroupByUser((prev) => ({
                                                                ...prev,
                                                                [u.id]: e.target.value,
                                                            }))
                                                        }
                                                    >
                                                        {groups
                                                            .filter((g) => !(u.adminGroupIds || []).includes(g.id))
                                                            .map((g) => (
                                                                <MenuItem key={g.id} value={g.id}>
                                                                    {g.name || g.id}
                                                                </MenuItem>
                                                            ))}
                                                    </Select>
                                                </FormControl>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleAddGroupAdmin(u)}
                                                    disabled={!pendingGroupByUser[u.id]}
                                                >
                                                    Adicionar
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                        {!loadingUsers && users.length === 0 && (
                            <Typography color="text.secondary">
                                Nenhum usuário cadastrado.
                            </Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Layout>
    );
}

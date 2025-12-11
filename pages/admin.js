import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Card,
    CardActionArea,
    CardContent,
    Grid,
    Typography,
    Alert,
    Stack,
    Button,
    Chip,
    LinearProgress,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";

const sections = [
    {
        title: "Triggers",
        description: "Gerencie palavras-chave, respostas e regras de disparo.",
        href: "/triggers",
    },
    {
        title: "Logs",
        description: "Consulte os logs do backend e do worker, com filtro e auto-refresh.",
        href: "/logs",
    },
];

export default function AdminPage() {
    const [sessionOk, setSessionOk] = useState(true);
    const [checked, setChecked] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userError, setUserError] = useState("");

    useEffect(() => {
        api.me()
            .then(() => setSessionOk(true))
            .catch(() => setSessionOk(false))
            .finally(() => setChecked(true));
    }, []);

    useEffect(() => {
        if (!sessionOk) return;
        setLoadingUsers(true);
        api.listUsers()
            .then((data) => {
                setUsers(data || []);
                setUserError("");
            })
            .catch((err) => setUserError(err?.message || "Erro ao carregar usuários"))
            .finally(() => setLoadingUsers(false));
    }, [sessionOk]);

    async function handleApprove(id) {
        await api.approveUser(id);
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "approved" } : u)));
    }
    async function handleBlock(id) {
        await api.blockUser(id);
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "blocked" } : u)));
    }

    return (
        <Layout title="Admin">
            {!sessionOk && checked && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    É preciso estar logado. Vá para /login e faça o login.
                </Alert>
            )}
            <Typography variant="body1" sx={{ mb: 3 }}>
                Acesso centralizado às áreas administrativas do bot.
            </Typography>
            <Grid container spacing={3}>
                {sections.map((sec) => (
                    <Grid item xs={12} md={6} key={sec.href}>
                        <Card>
                            <CardActionArea component={Link} href={sec.href}>
                                <CardContent>
                                    <Stack spacing={1}>
                                        <Typography variant="h6">{sec.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {sec.description}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}

                {sessionOk && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{ mb: 2 }}
                                >
                                    <Typography variant="h6">Usuários</Typography>
                                    <Chip
                                        label={`${users.length} usuários`}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 700, borderWidth: 2 }}
                                    />
                                </Stack>
                                {loadingUsers && <LinearProgress sx={{ mb: 2 }} />}
                                {userError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {userError}
                                    </Alert>
                                )}
                                <Stack spacing={1.5}>
                                    {users.map((u) => (
                                        <Card key={u.id} variant="outlined">
                                            <CardContent>
                                                <Stack
                                                    direction={{ xs: "column", sm: "row" }}
                                                    spacing={1}
                                                    alignItems={{ sm: "center" }}
                                                    justifyContent="space-between"
                                                >
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                                            {u.email}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {u.name || "Sem nome"}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip
                                                            label={u.status}
                                                            color={
                                                                u.status === "approved"
                                                                    ? "success"
                                                                    : u.status === "blocked"
                                                                    ? "error"
                                                                    : "warning"
                                                            }
                                                            variant="outlined"
                                                            sx={{ textTransform: "capitalize" }}
                                                        />
                                                        {u.status !== "approved" && (
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                onClick={() => handleApprove(u.id)}
                                                            >
                                                                Aprovar
                                                            </Button>
                                                        )}
                                                        {u.status !== "blocked" && (
                                                            <Button
                                                                size="small"
                                                                color="error"
                                                                variant="outlined"
                                                                onClick={() => handleBlock(u.id)}
                                                            >
                                                                Bloquear
                                                            </Button>
                                                        )}
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
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Layout>
    );
}

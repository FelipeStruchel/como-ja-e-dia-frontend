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

    useEffect(() => {
        api.me()
            .then(() => setSessionOk(true))
            .catch(() => setSessionOk(false))
            .finally(() => setChecked(true));
    }, []);

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
            </Grid>
        </Layout>
    );
}

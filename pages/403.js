import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import Layout from "../components/Layout";

export default function ForbiddenPage() {
    return (
        <Layout title="Sem permissão">
            <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h1" sx={{ fontSize: "4rem", fontWeight: 700, mb: 1 }}>
                    403
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Você não tem permissão para acessar esta página.
                </Typography>
                <Button variant="contained" component={Link} href="/">
                    Voltar para o início
                </Button>
            </Box>
        </Layout>
    );
}

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Layout from "../components/Layout";
import { api } from "../lib/apiClient";
import { useAuth } from "../lib/auth";
import { resolvePickerGroups } from "../lib/groupPicker";

// PersonaConfig.groupId is nullable and the null row is the deliberate
// global-fallback persona — only super_admin gets to view/edit it.
const GLOBAL_OPTION = { id: null, name: "Padrão global (fallback)" };

export default function PersonaPage() {
    const [sessionOk, setSessionOk] = useState(true);
    const { hasRole } = useAuth();
    const isSuperAdmin = hasRole("super_admin");
    const { data: myGroups, isLoading: myGroupsLoading } = useSWR("my-groups", () =>
        api.getMyGroups()
    );

    // Unlike Events/Schedules/Triggers this isn't a "which group(s) does
    // this apply to" multi-select picker — there is exactly one
    // PersonaConfig row per group, so it's a single-select "which group's
    // persona am I currently viewing/editing" switcher. No flag filter:
    // every group implicitly supports a persona.
    const { eligible } = resolvePickerGroups(myGroups || [], isSuperAdmin, null);

    const options = useMemo(() => {
        const opts = eligible.map((g) => ({ id: g.id, name: g.name || g.id }));
        if (isSuperAdmin) opts.push(GLOBAL_OPTION);
        return opts;
    }, [eligible, isSuperAdmin]);

    const noOptions = !myGroupsLoading && options.length === 0;
    const needsSwitcher = options.length > 1;

    // selectedGroupId starts undefined ("not decided yet") and is set once,
    // after myGroups resolves, to the first available option — which may
    // legitimately be `null` (the global fallback), so we can't reuse
    // null/undefined interchangeably as the "unset" sentinel.
    const [selectedGroupId, setSelectedGroupId] = useState(undefined);
    const [groupIdInitialized, setGroupIdInitialized] = useState(false);

    useEffect(() => {
        if (myGroupsLoading || groupIdInitialized) return;
        if (options.length > 0) {
            setSelectedGroupId(options[0].id);
            setGroupIdInitialized(true);
        }
    }, [myGroupsLoading, groupIdInitialized, options]);

    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState("");
    const [defaultPrompt, setDefaultPrompt] = useState("");
    const [status, setStatus] = useState({ type: "idle", message: "" });

    useEffect(() => {
        api.me()
            .then(() => setSessionOk(true))
            .catch(() => setSessionOk(false));
    }, []);

    useEffect(() => {
        if (!sessionOk || !groupIdInitialized) return;
        setLoading(true);
        api.getPersona(selectedGroupId)
            .then((res) => {
                setPrompt(res?.prompt || "");
                setDefaultPrompt(res?.default || "");
            })
            .catch((err) => {
                setStatus({ type: "error", message: err?.message || "Erro ao carregar persona" });
            })
            .finally(() => setLoading(false));
    }, [sessionOk, groupIdInitialized, selectedGroupId]);

    async function handleSave() {
        try {
            setStatus({ type: "loading", message: "Validando e salvando..." });
            const res = await api.updatePersona(selectedGroupId, prompt);
            setPrompt(res?.prompt || prompt);
            setStatus({ type: "success", message: "Persona salva" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || "Erro ao salvar persona",
            });
        } finally {
            setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
        }
    }

    if (!sessionOk) {
        return (
            <Layout title="Persona">
                <Alert severity="warning">É preciso estar logado. Vá para /login e faça o login.</Alert>
            </Layout>
        );
    }

    if (noOptions) {
        return (
            <Layout title="Persona">
                <Alert severity="warning">
                    Você não administra nenhum grupo com persona configurável.
                </Alert>
            </Layout>
        );
    }

    const selectedOption = options.find((o) => o.id === selectedGroupId);
    const showForm = groupIdInitialized && !loading;

    return (
        <Layout title="Persona da IA">
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Typography variant="h6">Persona (tom da IA)</Typography>

                        {needsSwitcher && groupIdInitialized && (
                            <FormControl size="small" sx={{ minWidth: 260 }}>
                                <InputLabel id="persona-group-label">Grupo</InputLabel>
                                <Select
                                    labelId="persona-group-label"
                                    label="Grupo"
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value)}
                                >
                                    {options.map((opt) => (
                                        <MenuItem key={opt.id ?? "__global__"} value={opt.id}>
                                            {opt.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {!needsSwitcher && selectedOption && (
                            <Typography variant="caption" color="text.secondary">
                                Grupo: {selectedOption.name}
                            </Typography>
                        )}

                        {!showForm ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={20} /> <Typography>Carregando...</Typography>
                            </Box>
                        ) : (
                            <>
                                <TextField
                                    label="Prompt da persona"
                                    multiline
                                    minRows={8}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    helperText="Altere o tom. Guardrails de formato/segurança permanecem fixos no backend."
                                />
                                <Button variant="outlined" onClick={() => setPrompt(defaultPrompt)}>
                                    Restaurar padrão
                                </Button>
                                <Stack direction="row" spacing={2}>
                                    <Button variant="contained" onClick={handleSave}>
                                        Salvar
                                    </Button>
                                </Stack>
                            </>
                        )}
                        {status.type !== "idle" && (
                            <Alert severity={status.type === "error" ? "error" : "success"}>
                                {status.message}
                            </Alert>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Layout>
    );
}

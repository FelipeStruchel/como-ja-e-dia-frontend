function handleHeaders(initHeaders = {}) {
    const headers = { ...initHeaders };
    if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("auth_token");
        if (token) headers.authorization = `Bearer ${token}`;
    }
    return headers;
}

async function handleResponse(res) {
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json() : await res.text();
    if (!res.ok) {
        const message =
            (body && body.error) ||
            (typeof body === "string" ? body : "Erro inesperado");
        throw new Error(message);
    }
    return body;
}

const withCreds = { credentials: "include" };

export const api = {
    getFrases: () =>
        fetch("/api/frases", { ...withCreds, headers: handleHeaders() }).then(handleResponse),
    addFrase: (frase) =>
        fetch("/api/frases", {
            method: "POST",
            headers: handleHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ frase }),
            credentials: "include",
        }).then(handleResponse),
    deleteFraseByIndex: (index) =>
        fetch(`/api/frases/${index}`, {
            method: "DELETE",
            credentials: "include",
            headers: handleHeaders(),
        }).then(handleResponse),

    getMedia: (scope) => {
        const qs = scope ? `?scope=${scope}` : "";
        return fetch(`/api/media${qs}`, { ...withCreds, headers: handleHeaders() }).then(
            handleResponse
        );
    },
    uploadMedia: (file, scope) => {
        const formData = new FormData();
        const extension = (file.name || "").split(".").pop()?.toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "gif"].includes(extension);
        const type = isImage ? "image" : "video";
        formData.append("type", type);
        formData.append("file", file);
        if (scope) formData.append("scope", scope);
        return fetch("/api/media", {
            method: "POST",
            body: formData,
            credentials: "include",
            headers: handleHeaders(),
        }).then(handleResponse);
    },
    deleteMedia: (type, filename, scope) => {
        const qs = scope ? `?scope=${scope}` : "";
        return fetch(`/api/media/${type}/${filename}${qs}`, {
            method: "DELETE",
            credentials: "include",
            headers: handleHeaders(),
        }).then(handleResponse);
    },

    getEvents: () =>
        fetch("/api/events", { ...withCreds, headers: handleHeaders() }).then(handleResponse),
    createEvent: ({ name, date }) =>
        fetch("/api/events", {
            method: "POST",
            headers: handleHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ name, date }),
            credentials: "include",
        }).then(handleResponse),
    deleteEvent: (id) =>
        fetch(`/api/events/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: handleHeaders(),
        }).then(handleResponse),

    getTriggers: () =>
        fetch("/api/triggers", { ...withCreds, headers: handleHeaders() }).then(handleResponse),
    createTrigger: (payload) =>
        fetch("/api/triggers", {
            method: "POST",
            headers: handleHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(payload),
            credentials: "include",
        }).then(handleResponse),
    updateTrigger: (id, payload) =>
        fetch(`/api/triggers/${id}`, {
            method: "PUT",
            headers: handleHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(payload),
            credentials: "include",
        }).then(handleResponse),
    deleteTrigger: (id) =>
        fetch(`/api/triggers/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: handleHeaders(),
        }).then(handleResponse),

    getLogs: (params = {}) => {
        const query = new URLSearchParams();
        if (params.limit) query.set("limit", params.limit);
        if (params.source) query.set("source", params.source);
        const q = query.toString();
        return fetch(`/api/logs${q ? "?" + q : ""}`, {
            ...withCreds,
            headers: handleHeaders(),
        }).then(handleResponse);
    },

    login: ({ email, password }) =>
        fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include",
        }).then(handleResponse),
    register: ({ email, password, name }) =>
        fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
            credentials: "include",
        }).then(handleResponse),
    me: () => fetch("/api/auth/me", { ...withCreds, headers: handleHeaders() }).then(handleResponse),
    logout: () =>
        fetch("/api/auth/logout", { method: "POST", credentials: "include", headers: handleHeaders() }).then(
            handleResponse
        ),

    sendConfession: (message) =>
        fetch("/api/confessions", {
            method: "POST",
            headers: handleHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ message }),
            credentials: "include",
        }).then(handleResponse),

    listUsers: (status) => {
        const query = status ? `?status=${status}` : "";
        return fetch(`/api/auth/users${query}`, { ...withCreds, headers: handleHeaders() }).then(
            handleResponse
        );
    },
    approveUser: (id) =>
        fetch(`/api/auth/users/${id}/approve`, {
            method: "POST",
            credentials: "include",
            headers: handleHeaders(),
        }).then(handleResponse),
    blockUser: (id) =>
        fetch(`/api/auth/users/${id}/block`, {
            method: "POST",
            credentials: "include",
            headers: handleHeaders(),
        }).then(handleResponse),
};

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

export const api = {
    getFrases: () => fetch("/api/frases").then(handleResponse),
    addFrase: (frase) =>
        fetch("/api/frases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frase }),
        }).then(handleResponse),
    deleteFraseByIndex: (index) =>
        fetch(`/api/frases/${index}`, { method: "DELETE" }).then(handleResponse),

    getMedia: () => fetch("/api/media").then(handleResponse),
    uploadMedia: (file) => {
        const formData = new FormData();
        const extension = (file.name || "").split(".").pop()?.toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "gif"].includes(extension);
        const type = isImage ? "image" : "video";
        formData.append("type", type);
        formData.append("file", file);
        return fetch("/api/media", {
            method: "POST",
            body: formData,
        }).then(handleResponse);
    },
    deleteMedia: (type, filename) =>
        fetch(`/api/media/${type}/${filename}`, {
            method: "DELETE",
        }).then(handleResponse),

    getEvents: () => fetch("/api/events").then(handleResponse),
    createEvent: ({ name, date }) =>
        fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, date }),
        }).then(handleResponse),
    deleteEvent: (id) =>
        fetch(`/api/events/${id}`, { method: "DELETE" }).then(handleResponse),

    getTriggers: () => fetch("/api/triggers").then(handleResponse),
    createTrigger: (payload) =>
        fetch("/api/triggers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).then(handleResponse),
    updateTrigger: (id, payload) =>
        fetch(`/api/triggers/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).then(handleResponse),
    deleteTrigger: (id) =>
        fetch(`/api/triggers/${id}`, { method: "DELETE" }).then(handleResponse),

    getLogs: (params = {}) => {
        const query = new URLSearchParams();
        if (params.limit) query.set("limit", params.limit);
        if (params.source) query.set("source", params.source);
        const q = query.toString();
        return fetch(`/api/logs${q ? "?" + q : ""}`).then(handleResponse);
    },

    login: ({ email, password }) =>
        fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        }).then(handleResponse),
    register: ({ email, password, name }) =>
        fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
        }).then(handleResponse),
    me: () => fetch("/api/auth/me").then(handleResponse),
    logout: () => fetch("/api/auth/logout", { method: "POST" }).then(handleResponse),

    sendConfession: (message) =>
        fetch("/api/confessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        }).then(handleResponse),
};

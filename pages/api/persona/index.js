import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    // proxyJson builds the upstream URL from a fixed `path` string, so the
    // groupId query param (used to select which group's PersonaConfig row
    // to read/write, or the null-groupId global fallback) has to be
    // appended here explicitly — it isn't forwarded automatically.
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
        if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    const suffix = qs.toString() ? `?${qs}` : "";

    if (req.method === "GET") {
        return proxyJson(req, res, { path: `/persona${suffix}`, method: "GET" });
    }
    if (req.method === "PUT") {
        return proxyJson(req, res, { path: `/persona${suffix}`, method: "PUT" });
    }
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end("Method Not Allowed");
}

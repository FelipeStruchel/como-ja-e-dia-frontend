import { proxyJson } from "../../../../lib/backendApi";

export default async function handler(req, res) {
    const { method, query } = req;
    if (method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end("Method Not Allowed");
    }
    const qs = query.status ? `?status=${encodeURIComponent(query.status)}` : "";
    return proxyJson(req, res, { path: `/auth/users${qs}`, method: "GET" });
}

import { proxyJson } from "../../../../../lib/backendApi";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end("Method Not Allowed");
    }
    const { id } = req.query;
    return proxyJson(req, res, { path: `/auth/users/${id}/block`, method: "POST" });
}

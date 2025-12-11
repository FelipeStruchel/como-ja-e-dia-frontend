import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end("Method Not Allowed");
    }
    return proxyJson(req, res, { path: "/auth/me", method: "GET" });
}

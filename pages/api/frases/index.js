import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    if (req.method === "GET") {
        return proxyJson(req, res, { path: "/frases", method: "GET" });
    }
    if (req.method === "POST") {
        return proxyJson(req, res, { path: "/frases", method: "POST" });
    }
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end("Method Not Allowed");
}

import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    if (req.method === "GET") {
        return proxyJson(req, res, { path: "/persona", method: "GET" });
    }
    if (req.method === "PUT") {
        return proxyJson(req, res, { path: "/persona", method: "PUT" });
    }
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end("Method Not Allowed");
}

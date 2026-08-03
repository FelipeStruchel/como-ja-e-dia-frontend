import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    const { id } = req.query;
    if (req.method === "PATCH") {
        return proxyJson(req, res, { path: `/groups/${id}`, method: "PATCH" });
    }
    if (req.method === "DELETE") {
        return proxyJson(req, res, { path: `/groups/${id}`, method: "DELETE" });
    }
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    res.status(405).end("Method Not Allowed");
}

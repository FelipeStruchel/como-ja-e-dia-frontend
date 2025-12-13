import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    const { id } = req.query;
    if (req.method === "PUT") {
        return proxyJson(req, res, { path: `/schedules/${id}`, method: "PUT" });
    }
    if (req.method === "DELETE") {
        return proxyJson(req, res, { path: `/schedules/${id}`, method: "DELETE" });
    }
    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end("Method Not Allowed");
}

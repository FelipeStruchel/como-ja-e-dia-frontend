import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    const { id } = req.query;
    if (req.method === "DELETE") {
        return proxyJson(req, res, { path: `/events/${id}`, method: "DELETE" });
    }
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end("Method Not Allowed");
}

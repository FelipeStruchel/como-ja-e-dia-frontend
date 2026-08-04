import { proxyJson } from "../../../../../lib/backendApi";

export default async function handler(req, res) {
    const { id, userId } = req.query;
    if (req.method === "DELETE") {
        return proxyJson(req, res, { path: `/groups/${id}/admins/${userId}`, method: "DELETE" });
    }
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end("Method Not Allowed");
}

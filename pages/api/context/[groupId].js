import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    if (req.method === "GET") {
        const { groupId } = req.query;
        return proxyJson(req, res, { path: `/context/${encodeURIComponent(groupId)}`, method: "GET" });
    }
    res.setHeader("Allow", ["GET"]);
    res.status(405).end("Method Not Allowed");
}

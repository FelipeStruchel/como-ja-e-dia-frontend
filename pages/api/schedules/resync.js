import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    if (req.method === "POST") {
        return proxyJson(req, res, { path: "/schedules/resync", method: "POST" });
    }
    res.setHeader("Allow", ["POST"]);
    res.status(405).end("Method Not Allowed");
}

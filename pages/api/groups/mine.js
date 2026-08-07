import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    if (req.method === "GET") {
        return proxyJson(req, res, { path: "/groups/mine", method: "GET" });
    }
    res.setHeader("Allow", ["GET"]);
    res.status(405).end("Method Not Allowed");
}

import { proxyJson } from "../../lib/backendApi";

export default async function handler(req, res) {
    if (req.method === "GET") {
        return proxyJson(req, res, {
            path: `/logs${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`,
            method: "GET",
        });
    }
    res.setHeader("Allow", ["GET"]);
    res.status(405).end("Method Not Allowed");
}

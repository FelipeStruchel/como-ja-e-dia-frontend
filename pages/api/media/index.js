import { proxyJson, proxyStream } from "../../../lib/backendApi";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method === "GET") {
        return proxyJson(req, res, { path: "/media", method: "GET" });
    }
    if (req.method === "POST") {
        return proxyStream(req, res, { path: "/media", method: "POST" });
    }
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end("Method Not Allowed");
}

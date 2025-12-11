import { proxyJson } from "../../../lib/backendApi";

export default async function handler(req, res) {
    const { index } = req.query;
    if (req.method === "DELETE") {
        return proxyJson(req, res, { path: `/frases/${index}`, method: "DELETE" });
    }
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end("Method Not Allowed");
}

import { serialize } from "cookie";

const BACKEND =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:3000";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end("Method Not Allowed");
    }
    const upstream = await fetch(`${BACKEND}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req.body || {}),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
        return res.status(upstream.status).json(data);
    }
    const token = data.token;
    if (token) {
        res.setHeader(
            "Set-Cookie",
            serialize("auth_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            })
        );
    }
    return res.status(200).json(data);
}

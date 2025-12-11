const BACKEND_API_URL =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:3000";

function stripHopByHop(headers) {
    const out = { ...headers };
    delete out.host;
    delete out.connection;
    delete out["content-length"];
    delete out["transfer-encoding"];
    return out;
}

function bearerFromCookies(req) {
    const token = req.cookies?.auth_token;
    return token ? `Bearer ${token}` : null;
}

export async function proxyJson(req, res, { path, method }) {
    const url = `${BACKEND_API_URL}${path}`;
    const auth = bearerFromCookies(req);
    const init = {
        method,
        headers: {
            "content-type": "application/json",
            ...stripHopByHop(req.headers),
        },
    };
    if (auth) init.headers.authorization = auth;
    if (req.body) {
        init.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }
    const upstream = await fetch(url, init);
    const text = await upstream.text();
    const contentType =
        upstream.headers.get("content-type") || "application/json; charset=utf-8";
    res.status(upstream.status);
    res.setHeader("content-type", contentType);
    res.send(text);
}

export async function proxyStream(req, res, { path, method }) {
    const url = `${BACKEND_API_URL}${path}`;
    const headers = stripHopByHop(req.headers);
    const auth = bearerFromCookies(req);
    if (auth) headers.authorization = auth;
    const upstream = await fetch(url, {
        method,
        headers,
        body: req,
        duplex: "half",
    });
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
        res.setHeader(key, value);
    });
    if (upstream.body) {
        upstream.body.pipe(res);
    } else {
        res.end();
    }
}

export function getBackendApiUrl() {
    return BACKEND_API_URL;
}

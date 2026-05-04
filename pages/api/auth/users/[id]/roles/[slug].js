import { proxyJson } from "../../../../../../lib/backendApi";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).end("Method Not Allowed");
  }
  const { id, slug } = req.query;
  return proxyJson(req, res, {
    path: `/auth/users/${id}/roles/${slug}`,
    method: req.method,
  });
}

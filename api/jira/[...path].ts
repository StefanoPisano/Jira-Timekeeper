// /api/jira/[...path].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import querystring from "querystring";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const domain = req.headers["x-jira-domain"];
    if (!domain) return res.status(400).json({ error: "Missing x-jira-domain header" });

    const jiraPath = typeof req.query.path === "string" ? req.query.path : "";
    if (!jiraPath) return res.status(400).json({ error: "Missing ?path query param" });

    const queryParams = { ...req.query };
    delete queryParams.path;
    const queryString = querystring.stringify(queryParams);

    const url = `https://${domain}/${jiraPath}${queryString ? "?" + queryString : ""}`;
    console.log("Forwarding URL:", url);

    try {
        const response = await fetch(url, {
            method: req.method,
            headers: {
                Authorization: `Basic ${process.env.JIRA_API_TOKEN}`,
                Accept: "application/json",
                "User-Agent": "jira-timekeeper-proxy",
            },
            body: req.method !== "GET" && req.body ? JSON.stringify(req.body) : undefined,
        });

        const data = await response.text();
        res.status(response.status).setHeader("Content-Type", "application/json").send(data);

    } catch (err: any) {
        console.error("Proxy error:", err);
        res.status(500).json({ error: "Proxy error", details: err.message });
    }
}
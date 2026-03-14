// app/api/jira/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const unwrappedParams = await params;
    if (!unwrappedParams.path) return NextResponse.json({ error: 'Missing path segments' }, { status: 400 });

    // Estrai i dati di auth dal client
    const email = req.headers.get('x-jira-email');
    const token = req.headers.get('x-jira-token');
    const domain = req.headers.get('x-jira-domain');

    if (!email || !token || !domain) {
        return NextResponse.json({ error: 'Missing Jira credentials' }, { status: 400 });
    }

    const jiraPath = unwrappedParams.path.join('/');
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const url = `https://${domain}/${jiraPath}${queryString}`;

    const authHeader = `Basic ${Buffer.from(`${email.trim()}:${token.trim()}`).toString('base64')}`;
    try {
        const res = await fetch(url, {
            headers: {
                Authorization: authHeader,
                Accept: 'application/json',
                'User-Agent': 'jira-timekeeper-proxy',
            },
        });

        const data = await res.text();
        return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
        console.error('Proxy error:', err);
        return NextResponse.json({ error: 'Proxy error', details: err.message }, { status: 500 });
    }
}
import { format } from 'date-fns';
import { getActiveAuth } from './auth';

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const getAuthHeaders = (): HeadersInit => {
    const active = getActiveAuth();
    const email = active?.email;
    const token = active?.token;
    const domain = active?.domain;

    if (!email || !token || !domain) {
        throw new Error('Missing Jira credentials');
    }

    const auth = btoa(`${email.trim()}:${token.trim()}`);

    return {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'x-jira-domain': domain.trim(),
    } as HeadersInit;
};

export const jiraFetch = async (path: string, headers:HeadersInit = getAuthHeaders()) => {
    return fetch(`${path}`, { headers });
};

export { formatDate };

import type { JiraAuth } from '../types/jira';
import {jiraFetch} from "./jiraClient.ts";

const getStorageValue = (key: string) => localStorage.getItem(key);

export const getActiveAuth = (): JiraAuth | null => {
    const authsJson = getStorageValue('JIRA_AUTHS');
    if (!authsJson) return null;

    try {
        const auths: JiraAuth[] = JSON.parse(authsJson);
        const activeId = getStorageValue('ACTIVE_JIRA_AUTH_ID');
        return auths.find(a => a.id === activeId) || auths[0] || null;
    } catch (e) {
        console.error('Failed to parse JIRA_AUTHS', e);
        return null;
    }
};

export const testAuthConnection = async (auth: JiraAuth): Promise<boolean> => {
    try {
        const email = auth.email.trim();
        const token = auth.token.trim();
        const domain = auth.domain.trim() || 'default.atlassian.net';

        const chars = `${email}:${token}`;
        const b64 = btoa(unescape(encodeURIComponent(chars)));
        const headers = {
            Authorization: `Basic ${b64}`,
            Accept: 'application/json',
            'x-jira-domain': domain,
        } as HeadersInit;

        const response = await jiraFetch(`/api/jira/rest/api/3/myself`, headers);
        return response.ok;
    } catch (e) {
        console.error('Connection test failed', e);
        return false;
    }
};

import {getActiveAuth} from "@/app/services/authentication/auth";

export const getAuthHeaders = (email: string | undefined, token: string | undefined, domain: string | undefined): HeadersInit => {
    if (!email || !token || !domain) {
        throw new Error('Missing Jira credentials');
    }
    return {
        'x-jira-domain': domain.trim(),
        'x-jira-token': token,
        'x-jira-email': email
    } as HeadersInit;
};

export const getActiveAuthHeaders = (): HeadersInit => {
    const active = getActiveAuth();
    const email = active?.email;
    const token = active?.token;
    const domain = active?.domain;

    return getAuthHeaders(email, token, domain)
};

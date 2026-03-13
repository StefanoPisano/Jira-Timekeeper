import { addDays, format, startOfWeek, isSameDay } from 'date-fns';

export interface Ticket {
    id: string; // Issue Key (e.g., PROJ-123)
    summary: string;
    loggedHours: number;
    projectKey: string;
}

export interface DayWorklog {
    date: string; // ISO string YYYY-MM-DD
    tickets: Ticket[];
    totalHours: number;
}


export interface JiraAuth {
    id: string;
    label: string;
    domain: string;
    email: string;
    token: string;
}

// Helper to format date
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const getStorageValue = (key: string) => localStorage.getItem(key);

export const getActiveAuth = (): JiraAuth | null => {
    const authsJson = getStorageValue('JIRA_AUTHS');
    if (!authsJson) return null;

    try {
        const auths: JiraAuth[] = JSON.parse(authsJson);
        const activeId = getStorageValue('ACTIVE_JIRA_AUTH_ID');
        return auths.find(a => a.id === activeId) || auths[0] || null;
    } catch (e) {
        console.error("Failed to parse JIRA_AUTHS", e);
        return null;
    }
};

const getAuthHeaders = () => {
    const activeAuth = getActiveAuth();
    const email = activeAuth?.email.trim();
    const token = activeAuth?.token.trim();

    console.log("email & token", email, token);
    if (!email || !token) {
        throw new Error("Jira credentials missing in .env");
    }
    const chars = `${email}:${token}`;
    // Encode to base64
    const b64 = btoa(unescape(encodeURIComponent(chars)));
    return {
        'Authorization': `Basic ${b64}`,
        'Accept': 'application/json',
    };
};

export const jiraFetch = async (path: string) => {
    const activeAuth = getActiveAuth();
    const headers = getAuthHeaders();

    const domain = activeAuth?.domain || 'default.atlassian.net';
    return fetch(`/api/jira/${domain}${path}`, { headers });
};

export const testAuthConnection = async (auth: JiraAuth): Promise<boolean> => {
    try {
        const email = auth.email.trim();
        const token = auth.token.trim();
        const domain = auth.domain.trim() || 'default.atlassian.net';

        const chars = `${email}:${token}`;
        const b64 = btoa(unescape(encodeURIComponent(chars)));
        const headers = {
            'Authorization': `Basic ${b64}`,
            'Accept': 'application/json',
        };

        const response = await fetch(`/api/jira/${domain}/rest/api/3/myself`, { headers });
        return response.ok;
    } catch (e) {
        console.error("Connection test failed", e);
        return false;
    }
};


export const fetchWeeklyWorklogs = async (currentDate: Date): Promise<DayWorklog[]> => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
    const weekEnd = addDays(weekStart, 6);
    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');

    // 1. Initialize the weekData array
    const weekData: DayWorklog[] = [];
    for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        weekData.push({
            date: formatDate(day),
            tickets: [],
            totalHours: 0
        });
    }

    try {
        const headers = getAuthHeaders();

        // 2. Fetch issues user worked on during this week
        // JQL: worklogAuthor = currentUser() AND worklogDate >= startOfWeek AND worklogDate <= endOfWeek
        const jql = `worklogAuthor = currentUser() AND worklogDate >= "${startStr}" AND worklogDate <= "${endStr}"`;

        const searchRes = await fetch(
            `/api/jira/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,project`, { headers }
        );
        if (!searchRes.ok) throw new Error(`Jira Search failed: ${searchRes.statusText}`);
        const searchData = await searchRes.json();
        const issues = searchData.issues || [];

        const meRes = await fetch('/api/jira/rest/api/3/myself', { headers });
        const meData = await meRes.json();
        const currentUserAccountId = meData.accountId;

        // 3. For each issue, fetch its worklogs and filter by current user and this week
        for (const issue of issues) {
            const worklogRes = await fetch(`/api/jira/rest/api/3/issue/${issue.key}/worklog`, {
                headers
            });



            if (issue.key === 'BPSDEV-6016') debugger;

            if (!worklogRes.ok) continue;

            const worklogData = await worklogRes.json();
            const worklogs = worklogData.worklogs || [];

            const userWorklogs = worklogs.filter(
                l => l.author?.accountId === currentUserAccountId
            );
            for (const log of userWorklogs) {
                const logDate = new Date(log.started);

                console.log(logDate)
                if (logDate >= weekStart && logDate < addDays(weekEnd, 1)) {

                    const dayBox = weekData.find(d => isSameDay(new Date(d.date), logDate));

                    if (!dayBox) continue;

                    const hours = (log.timeSpentSeconds || 0) / 3600;

                    const existingTicket = dayBox.tickets.find(t => t.id === issue.key);

                    if (existingTicket) {
                        existingTicket.loggedHours += hours;
                    } else {
                        dayBox.tickets.push({
                            id: issue.key,
                            summary: issue.fields?.summary || "Unknown Task",
                            loggedHours: hours,
                            projectKey: issue.fields?.project?.key || "UNK"
                        });
                    }

                    dayBox.totalHours += hours;
                }
            }
        }

        // Cleanup decimals
        weekData.forEach(day => {
            day.totalHours = parseFloat(day.totalHours.toFixed(2));
            day.tickets.forEach(t => t.loggedHours = parseFloat(t.loggedHours.toFixed(2)));
        });

    } catch (error) {
        console.error("Error communicating with Jira:", error);
        throw error;
    }

    return weekData;
};

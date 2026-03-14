import {addDays, format, isSameDay, startOfWeek} from 'date-fns';
import type {DayWorklog} from '../types/jira';
import {formatDate, jiraFetch} from './jiraClient';

export const fetchWeeklyWorklogs = async (currentDate: Date): Promise<DayWorklog[]> => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');

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
        const jql = `worklogAuthor = currentUser() AND worklogDate >= "${startStr}" AND worklogDate <= "${endStr}"`;

        const searchRes =await jiraFetch(
            `/api/jira/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,project`);

        if (!searchRes.ok) throw new Error(`Jira Search failed: ${searchRes.statusText}`);
        const searchData = await searchRes.json();
        const issues = searchData.issues || [];

        const meRes = await jiraFetch('/api/jira/rest/api/3/myself');
        const meData = await meRes.json();
        const currentUserAccountId = meData.accountId;

        for (const issue of issues) {
            const worklogRes = await jiraFetch(`/api/jira/rest/api/3/issue/${issue.key}/worklog`);

            if (!worklogRes.ok) continue;

            const worklogData = await worklogRes.json();
            const worklogs = worklogData.worklogs || [];

            const userWorklogs = worklogs.filter(
                (l: any) => l.author?.accountId === currentUserAccountId
            );
            for (const log of userWorklogs) {
                const logDate = new Date(log.started);

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

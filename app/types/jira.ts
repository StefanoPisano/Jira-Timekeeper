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
    workingHours?: number;
    showWeekends?: boolean;
}

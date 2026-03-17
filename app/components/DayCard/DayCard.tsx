import React from 'react';
import { format, isToday, isWeekend } from 'date-fns';
import type { DayWorklog } from '../../types/jira.ts';
import { TicketItem } from '../Ticket/TicketItem';
import "../../styles/DayCard.scss"

import { getActiveAuth } from "../../services/authentication/auth";

interface DayCardProps {
    worklog: DayWorklog;
}

export const DayCard: React.FC<DayCardProps> = ({ worklog }) => {
    const activeAuth = getActiveAuth();
    const workingHours = activeAuth?.workingHours ?? 8;
    const date = new Date(worklog.date);
    const dayName = format(date, 'EEEE');
    const dayNumber = format(date, 'd');
    const isCurrentDay = isToday(date);
    const isWeekendDay = isWeekend(date);

    return (
        <div className={`day-card ${isCurrentDay ? 'is-today' : ''} ${worklog.totalHours === 0 ? 'is-empty' : ''} ${isWeekendDay ? 'weekend' : ''}`}>
            <div className="day-header">
                <div className="day-info">
                    <span className="day-name">{dayName}</span>
                    <span className="day-number">{dayNumber}</span>
                </div>
                <div className={`day-total ${worklog.totalHours !== workingHours && date <= new Date()
                    ? 'day-warning' : date <= new Date() ? 'day-ok' : ''}`}>
                    <span className="total-hours">{worklog.totalHours}h</span>
                    <span className="total-label">Total</span>
                </div>
            </div>

            <div className="tickets-container">
                {worklog.tickets.length > 0 ? (
                    worklog.tickets.map(ticket => (
                        <TicketItem key={ticket.id} ticket={ticket} />
                    ))
                ) : (
                    <div className="no-tickets">
                        <p>No hours logged</p>
                    </div>
                )}
            </div>
        </div>
    );
};

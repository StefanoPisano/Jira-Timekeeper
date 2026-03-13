import React from 'react';
import { Clock } from 'lucide-react';
import type { Ticket } from '../services/api';

interface TicketItemProps {
    ticket: Ticket;
}

export const TicketItem: React.FC<TicketItemProps> = ({ ticket }) => {
    return (
        <div className="ticket-item">
            <div className="ticket-header">
                <span className="ticket-id">{ticket.id}</span>
                <div className="ticket-hours">
                    <Clock size={12} className="clock-icon" />
                    <span>{ticket.loggedHours}h</span>
                </div>
            </div>
            <p className="ticket-summary">{ticket.summary}</p>
        </div>
    );
};

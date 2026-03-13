import React, { useState, useEffect } from 'react';
import { addWeeks, subWeeks, format, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { fetchWeeklyWorklogs } from '../services/api';
import type { DayWorklog } from '../services/api';
import { DayCard } from './DayCard';

export const WeeklyCalendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [worklogs, setWorklogs] = useState<DayWorklog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weeklyTotal, setWeeklyTotal] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchWeeklyWorklogs(currentDate);
                setWorklogs(data);

                const total = data.reduce((sum, day) => sum + day.totalHours, 0);
                setWeeklyTotal(parseFloat(total.toFixed(1)));
            } catch (err: any) {
                console.error("Failed to fetch worklogs", err);
                setError(err.message || "An error occurred while fetching Jira data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentDate]);

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

    return (
        <div className="calendar-container">
            <header className="calendar-header">
                <div className="header-title">
                    <CalendarIcon className="header-icon" />
                    <h1>Jira Weekly Time</h1>
                </div>

                <div className="header-controls">
                    <button className="btn btn-outline" onClick={handleToday}>
                        Today
                    </button>

                    <div className="week-navigation">
                        <button className="btn btn-icon" onClick={handlePrevWeek} aria-label="Previous Week">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="week-range">{weekRange}</span>
                        <button className="btn btn-icon" onClick={handleNextWeek} aria-label="Next Week">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="weekly-summary">
                    <span className="summary-label">Week Total:</span>
                    <span className="summary-value">{weeklyTotal}h</span>
                </div>
            </header>

            <div className="calendar-grid-wrapper">
                {error ? (
                    <div className="error-state">
                        <p>{error}</p>
                        <p className="help-text mt-4">Check your Jira authentication in the sidebar.</p>
                    </div>
                ) : loading ? (
                    <div className="loading-state">
                        <Loader2 className="spinner" size={40} />
                        <p>Loading your tickets...</p>
                    </div>
                ) : (
                    <div className="calendar-grid">
                        {worklogs.map((log: DayWorklog) => (
                            <DayCard key={log.date} worklog={log} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

import React, {useEffect, useState} from 'react';
import {addWeeks, endOfWeek, format, startOfWeek, subWeeks} from 'date-fns';
import {Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, RefreshCcw} from 'lucide-react';
import type {DayWorklog} from '../../types/jira.ts';
import {fetchWeeklyWorklogs} from '../../services/worklogs';
import {DayCard} from '../DayCard/DayCard';
import "../../styles/Calendar.scss"

export const WeeklyCalendar: React.FC = () => {
    const [forceRefresh,setForceRefresh] = useState<number | null>(null);
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
                setError(err.message || "An error occurred while fetching Jira data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentDate, forceRefresh]);

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());
    const handleRefresh = () => setForceRefresh(Math.random());

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

    return (
        <div className="calendar-container">
            <header className="calendar-header">
                <div className="header-title">
                    <CalendarIcon className="header-icon" />
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

                    <button className="btn btn-outline" onClick={handleRefresh}>
                        <RefreshCcw size={20} />
                    </button>
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

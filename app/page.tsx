'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { WeeklyCalendar } from './components/Calendar/WeeklyCalendar';
import { NavigationBar } from './components/NavigationBar/NavigationBar';
import Footer from "@/app/components/Footer/Footer";

export default function Page() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAuthChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="app-layout">
            <header className="top-nav">
                <div className="logo-container">
                    <CalendarIcon className="text-accent" size={24} />
                    <span className="app-name">Jira Timekeeper</span>
                </div>
                <NavigationBar onAuthChange={handleAuthChange} />
            </header>

            <div className="main-content flex flex-col justify-between">
                <main className={"flex-1"}>
                    <WeeklyCalendar key={refreshKey} />
                </main>
                <Footer></Footer>
            </div>
        </div>
    );
}
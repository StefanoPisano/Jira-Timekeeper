// app/page.tsx
'use client'; // needed because this is a client-side component

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { WeeklyCalendar } from './components/Calendar/WeeklyCalendar';
import { AuthSidebar } from './components/Sidebar/AuthSidebar';
import './page.css';
import Footer from "@/app/components/Footer/Footer";

export default function Page() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAuthChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="app-layout">
            <nav className="sidebar">
                <div className="logo-container">
                    <CalendarIcon className="text-accent" size={24} />
                    <span className="app-name">Jira Timekeeper</span>
                </div>
                <AuthSidebar onAuthChange={handleAuthChange} />
            </nav>
            <main className="main-content">
                <WeeklyCalendar key={refreshKey} />
            </main>
            <Footer></Footer>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { Key, Trash2, Edit2, CheckCircle2, X, Info, HelpCircle } from 'lucide-react';
import type { JiraAuth } from '../../types/jira';
import { testAuthConnection } from '../../services/auth';
import Footer from "@/app/components/Footer/Footer";

interface AuthSidebarProps {
    onAuthChange: () => void;
}

export const AuthSidebar: React.FC<AuthSidebarProps> = ({ onAuthChange }) => {
    const [auths, setAuths] = useState<JiraAuth[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAuth, setCurrentAuth] = useState<Partial<JiraAuth>>({});
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    useEffect(() => {
        loadAuths();
    }, []);

    const loadAuths = () => {
        const storedAuths = localStorage.getItem('JIRA_AUTHS');
        if (storedAuths) {
            try {
                const parsed = JSON.parse(storedAuths);
                setAuths(parsed);
                const active = localStorage.getItem('ACTIVE_JIRA_AUTH_ID');
                setActiveId(active || (parsed.length > 0 ? parsed[0].id : null));
            } catch (e) {
                console.error("Failed to load auths", e);
            }
        }
    };

    const handleSelect = (id: string) => {
        localStorage.setItem('ACTIVE_JIRA_AUTH_ID', id);
        setActiveId(id);
        onAuthChange();
    };

    const handleAdd = () => {
        setCurrentAuth({
            id: crypto.randomUUID(),
            label: '',
            domain: '',
            email: '',
            token: ''
        });
        setIsEditing(true);
    };

    const handleEdit = (auth: JiraAuth) => {
        setCurrentAuth(auth);
        setIsEditing(true);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = auths.filter(a => a.id !== id);
        localStorage.setItem('JIRA_AUTHS', JSON.stringify(updated));
        if (activeId === id) {
            const nextActive = updated.length > 0 ? updated[0].id : null;
            if (nextActive) localStorage.setItem('ACTIVE_JIRA_AUTH_ID', nextActive);
            else localStorage.removeItem('ACTIVE_JIRA_AUTH_ID');
            setActiveId(nextActive);
        }
        setAuths(updated);
        onAuthChange();
    };

    const handleTest = async () => {
        if (!currentAuth.email || !currentAuth.token) return;
        setTestStatus('testing');
        const success = await testAuthConnection({
            ...currentAuth,
            email: currentAuth.email.trim(),
            token: currentAuth.token.trim(),
            domain: (currentAuth.domain || '').trim()
        } as JiraAuth);
        setTestStatus(success ? 'success' : 'error');
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedAuth: JiraAuth = {
            id: currentAuth.id!,
            label: (currentAuth.label || '').trim(),
            domain: (currentAuth.domain || '').trim().replace(/^https?:\/\//, ''),
            email: (currentAuth.email || '').trim(),
            token: (currentAuth.token || '').trim()
        };

        const updatedAuths = [...auths];
        const index = updatedAuths.findIndex(a => a.id === trimmedAuth.id);

        if (index >= 0) {
            updatedAuths[index] = trimmedAuth;
        } else {
            updatedAuths.push(trimmedAuth);
        }

        localStorage.setItem('JIRA_AUTHS', JSON.stringify(updatedAuths));
        if (updatedAuths.length === 1 || activeId === currentAuth.id) {
            localStorage.setItem('ACTIVE_JIRA_AUTH_ID', currentAuth.id!);
            setActiveId(currentAuth.id!);
        }

        setAuths(updatedAuths);
        setIsEditing(false);
        setTestStatus("idle")
        onAuthChange();
    };

    return (
        <div className="auth-sidebar-content">
            <div className="sidebar-section">
                <div className="section-header">

                    <button className="btn-icon-sm" onClick={handleAdd} title="Add New Auth">
                        <Key size={16} />
                    </button>

                </div>

                <div className="auth-list">
                    {auths.length > 0 ? (
                        auths.map(auth => (
                            <div
                                key={auth.id}
                                className={`auth-item ${activeId === auth.id ? 'active' : ''}`}
                                onClick={() => handleSelect(auth.id)}
                            >
                                <div className="auth-info">
                                    <span className="auth-label">{auth.label}</span>
                                    <span className="auth-domain">{auth.domain || 'Default'}</span>
                                </div>
                                <div className="auth-actions">
                                    <button className="btn-icon-xs" onClick={(e) => { e.stopPropagation(); handleEdit(auth); }}>
                                        <Edit2 size={12} />
                                    </button>
                                    <button className="btn-icon-xs text-error" onClick={(e) => handleDelete(auth.id, e)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                {activeId === auth.id && <CheckCircle2 size={14} className="active-indicator" />}
                            </div>
                        ))
                    ) : (
                        <div className="no-auths">
                            <p>No auth profiles found.</p>
                        </div>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="settings-overlay">
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2>{currentAuth.label ? 'Edit' : 'Add'} Jira Auth</h2>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Profile Label</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Work, Personal, Client X"
                                    value={currentAuth.label || ''}
                                    onChange={(e) => setCurrentAuth({ ...currentAuth, label: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Jira Domain</label>
                                <input
                                    type="text"
                                    placeholder="e.g. your-company.atlassian.net"
                                    value={currentAuth.domain || ''}
                                    onChange={(e) => setCurrentAuth({ ...currentAuth, domain: e.target.value })}
                                />
                                <p className="help-text">Leave empty to use the default configured domain.</p>
                            </div>

                            <div className="form-group">
                                <label>Jira Email</label>
                                <input
                                    type="email"
                                    placeholder="your-email@company.com"
                                    value={currentAuth.email || ''}
                                    onChange={(e) => setCurrentAuth({ ...currentAuth, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>API Token</label>
                                <input
                                    type="password"
                                    placeholder="Your Jira API Token"
                                    value={currentAuth.token || ''}
                                    onChange={(e) => setCurrentAuth({ ...currentAuth, token: e.target.value })}
                                    required
                                />
                                <div className="help-text flex items-center gap-1">
                                    <Info size={12} />
                                    <span>Create one at id.atlassian.com/manage/api-tokens</span>
                                </div>
                            </div>

                            <div className="settings-actions">
                                <button
                                    type="button"
                                    className={`btn btn-outline ${testStatus === 'testing' ? 'opacity-50' : ''}`}
                                    onClick={handleTest}
                                    disabled={testStatus === 'testing' || !currentAuth.email || !currentAuth.token}
                                >
                                    {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                                </button>
                                <div className="flex-1"></div>
                                <button type="button" className="btn btn-outline" onClick={() => {
                                    setIsEditing(false); setTestStatus("idle");
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Profile
                                </button>
                            </div>

                            {testStatus !== 'idle' && (
                                <div className={`mt-4 p-3 rounded-md text-sm flex items-center gap-2 ${testStatus === 'success' ? 'bg-success/10 text-success' :
                                    testStatus === 'error' ? 'bg-danger/10 text-danger' :
                                        'bg-accent/10 text-accent'
                                    }`}>
                                    {testStatus === 'success' && <CheckCircle2 size={16} />}
                                    {testStatus === 'error' && <X size={16} />}
                                    {testStatus === 'testing' && <HelpCircle size={16} className="animate-spin" />}
                                    <span>
                                        {testStatus === 'success' && 'Connection successful!'}
                                        {testStatus === 'error' && 'Connection failed. Please check your credentials and domain.'}
                                        {testStatus === 'testing' && 'Attempting to connect to Jira...'}
                                    </span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

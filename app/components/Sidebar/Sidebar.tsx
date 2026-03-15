import React, {useState, useEffect, SyntheticEvent} from 'react';
import {Key, Trash2, Edit2, CheckCircle2, X, Info, HelpCircle} from 'lucide-react';
import type {JiraAuth} from '../../types/jira';
import {getActiveAuth, testConnection} from "../../services/authentication/auth";
import "../../styles/Modal.scss";
import "../../styles/Sidebar.scss";

interface AuthSidebarProps {
    onAuthChange: () => void;
}

export const Sidebar: React.FC<AuthSidebarProps> = ({onAuthChange}) => {
    const [auths, setAuths] = useState<JiraAuth[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAuth, setCurrentAuth] = useState<Partial<JiraAuth>>({});
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

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

    useEffect(() => {
        loadAuths();
    }, []);

    // const handleSelect = (id: string) => {
    //     localStorage.setItem('ACTIVE_JIRA_AUTH_ID', id);
    //     setActiveId(id);
    //     onAuthChange();
    // };

    const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        localStorage.setItem('ACTIVE_JIRA_AUTH_ID', value);
        setActiveId(value);
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

    const handleEdit = () => {
        const currentAuth = getActiveAuth();
        if (currentAuth) {
            setCurrentAuth(currentAuth);
            setIsEditing(true);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        const currentAuth = getActiveAuth();
        const deletedId = currentAuth?.id;
        const updated = auths.filter(a => a.id !== deletedId);
        localStorage.setItem('JIRA_AUTHS', JSON.stringify(updated));

        const nextActive = updated.length > 0 ? updated[0].id : null;
        if (nextActive) localStorage.setItem('ACTIVE_JIRA_AUTH_ID', nextActive);
        else localStorage.removeItem('ACTIVE_JIRA_AUTH_ID');
        setActiveId(nextActive);

        setAuths(updated);
        onAuthChange();
    };

    const handleTest = async () => {
        if (!currentAuth.email || !currentAuth.token) return;
        setTestStatus('testing');
        const success = await testConnection({
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
            <div className={"auth-sidebar-profile"}>
                <div className="sidebar-auth-list">
                    {auths.length > 0 ? (
                        <select className="w-full select___auth-list" onChange={handleSelect}>
                            {auths.map(auth => (
                                <option key={auth.id} id={auth.id} value={auth.id}>
                                    {auth.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className={"text-center text-xs no-auths"}>Missing auth profile. Please add one.</div>
                    )}
                </div>
                <div className="sidebar-actions flex gap-1.5">
                    <button className="btn-icon-sm" onClick={handleAdd} title="Add New Auth">
                        <Key size={24}/>
                    </button>
                    <button className="btn-icon-sm" onClick={handleEdit}  disabled={auths.length === 0 || getActiveAuth() == null}>
                        <Edit2 size={24}/>
                    </button>
                    <button className="btn-icon-sm text-error" onClick={handleDelete} disabled={auths.length === 0 || getActiveAuth() == null}>
                        <Trash2 size={24}/>
                    </button>
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
                                    onChange={(e) => setCurrentAuth({...currentAuth, label: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Jira Domain</label>
                                <input
                                    type="text"
                                    placeholder="e.g. your-company.atlassian.net"
                                    value={currentAuth.domain || ''}
                                    onChange={(e) => setCurrentAuth({...currentAuth, domain: e.target.value})}
                                />
                                <p className="help-text">Leave empty to use the default configured domain.</p>
                            </div>

                            <div className="form-group">
                                <label>Jira Email</label>
                                <input
                                    type="email"
                                    placeholder="your-email@company.com"
                                    value={currentAuth.email || ''}
                                    onChange={(e) => setCurrentAuth({...currentAuth, email: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>API Token</label>
                                <input
                                    type="password"
                                    placeholder="Your Jira API Token"
                                    value={currentAuth.token || ''}
                                    onChange={(e) => setCurrentAuth({...currentAuth, token: e.target.value})}
                                    required
                                />
                                <div className="help-text flex items-center gap-1">
                                    <Info size={12}/>
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
                                    setIsEditing(false);
                                    setTestStatus("idle");
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Profile
                                </button>
                            </div>

                            {testStatus !== 'idle' && (
                                <div
                                    className={`mt-4 p-3 rounded-md text-sm flex items-center gap-2 ${testStatus === 'success' ? 'bg-success/10 text-success' :
                                        testStatus === 'error' ? 'bg-danger/10 text-danger' :
                                            'bg-accent/10 text-accent'
                                    }`}>
                                    {testStatus === 'success' && <CheckCircle2 size={16}/>}
                                    {testStatus === 'error' && <X size={16}/>}
                                    {testStatus === 'testing' && <HelpCircle size={16} className="animate-spin"/>}
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

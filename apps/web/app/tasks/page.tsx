'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Task {
    id: string;
    agentId: string;
    uri: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    attempts: number;
    lastError?: string;
    updatedAt: string;
    agent?: {
        name: string;
    };
}

interface Stats {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}

export default function TasksDashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const [tab, setTab] = useState<'metadata' | 'scans'>('metadata');
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = tab === 'metadata' ? 'tasks' : 'tasks/scans';
            const [tasksRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/v1/${endpoint}?status=${filter}`),
                fetch(`${API_URL}/api/v1/tasks/stats`),
            ]);

            const tasksData = (await tasksRes.json()) as { data: Task[] };
            const statsData = (await statsRes.json()) as any;

            setTasks(tasksData.data || []);
            setStats(statsData);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setError('System synchronization error. Please check API connectivity.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s auto-refresh
        return () => clearInterval(interval);
    }, [filter, tab]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'PROCESSING': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
            case 'FAILED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0b10] text-[#e2e8f0] p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                            Audit Dashboard
                        </h1>
                        <p className="text-slate-400">Monitoring real-time agent metadata hydration and resolution tasks.</p>
                    </div>
                    <Link href="/" className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-sm font-medium">
                        ← Back to Scanner
                    </Link>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {/* Metadata Stats */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2">Hydration Tasks</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total', value: (stats as any).metadata.total, color: 'text-white' },
                                    { label: 'Completed', value: (stats as any).metadata.completed, color: 'text-emerald-400' },
                                    { label: 'Failed', value: (stats as any).metadata.failed, color: 'text-rose-400' },
                                    { label: 'Active', value: (stats as any).metadata.pending + (stats as any).metadata.processing, color: 'text-cyan-400' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">{s.label}</p>
                                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scan Stats */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2">Compliance Scans</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total', value: (stats as any).scans.total, color: 'text-white' },
                                    { label: 'Completed', value: (stats as any).scans.completed, color: 'text-emerald-400' },
                                    { label: 'Failed', value: (stats as any).scans.failed, color: 'text-rose-400' },
                                    { label: 'Active', value: (stats as any).scans.pending + (stats as any).scans.processing, color: 'text-cyan-400' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">{s.label}</p>
                                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => { setTab('metadata'); setFilter(''); }}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'metadata'
                                ? 'bg-slate-800 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Hydration Tasks
                        </button>
                        <button
                            onClick={() => { setTab('scans'); setFilter(''); }}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'scans'
                                ? 'bg-slate-800 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Compliance Scans
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${filter === s
                                    ? 'bg-cyan-500 border-cyan-400 text-white'
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                    }`}
                            >
                                {s || 'ALL'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/60 font-mono text-[10px] uppercase tracking-tighter text-slate-500">
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4">URI / Target</th>
                                    <th className="px-6 py-4 text-center">Tries</th>
                                    <th className="px-6 py-4">Last Update</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {error ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-rose-400 font-medium bg-rose-500/5">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                {error}
                                            </div>
                                        </td>
                                    </tr>
                                ) : loading && tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                                            Scanning for active tasks...
                                        </td>
                                    </tr>
                                ) : tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white text-sm">#{task.agentId}</div>
                                            <div className="text-xs text-slate-500">{task.agent?.name || 'Unknown Agent'}</div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs md:max-w-md">
                                            <div className="text-xs font-mono text-cyan-400/80 truncate mb-1">{task.uri}</div>
                                            {task.lastError && (
                                                <div className="text-[10px] text-rose-400/80 line-clamp-1 italic bg-rose-500/5 p-1 rounded">
                                                    Error: {task.lastError}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-mono ${task.attempts > 3 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {task.attempts}/5
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-slate-400">
                                                {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </div>
                                            <div className="text-[10px] text-slate-600">
                                                {new Date(task.updatedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && tasks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                                            No tasks found for this filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');
                
                :root {
                    font-family: 'Inter', sans-serif;
                }
                
                [class*="font-mono"] {
                    font-family: 'JetBrains Mono', monospace;
                }
            `}</style>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { api } from '../lib/api';

interface Agent {
    id: number;
    agentId: string;
    name: string | null;
    description: string | null;
    image: string | null;
    active: boolean;
    x402Support: boolean;
    isA2AVerified: boolean;
    complianceScore: number;
    supportedTrust: string[] | null;
    endpoints: Array<{
        id: number;
        name: string;
        endpoint: string;
        isVerified: boolean;
        a2aVerified: boolean;
    }>;
    feedbackCount: number;
    validationCount: number;
    totalVolume?: string;
    txCount?: number;
    lastPaymentAt?: string;
    registeredAt: string;
}

interface Stats {
    agents: { total: number; active: number; x402Enabled: number };
    feedback: { total: number };
    validations: { total: number };
    endpoints: {
        total: number;
        byProtocol: Array<{ protocol: string; count: number }>;
    };
    network?: {
        totalVolume: string;
        totalTransactions: number;
    }
}

export default function HomePage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'x402'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Stats
                const statsData = await api.getStats();
                setStats(statsData);

                // Fetch Agents with filter
                let params = 'limit=50';
                if (filter === 'active') params += '&active=true';
                if (filter === 'x402') params += '&x402=true';

                const agentsData = await api.getAgents(params);
                setAgents(agentsData.data || []);
            } catch (error) {
                console.error('Failed to fetch home data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter]);

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.headerContent}>
                        <div className={styles.logo}>
                            <span className={styles.logoIcon}>◆</span>
                            <span className={styles.logoText}>Agent Scanner</span>
                        </div>
                        <nav className={styles.nav}>
                            <Link href="/">Agents</Link>
                            <Link href="#stats">Stats</Link>
                            <a href="https://best-practices.8004scan.io" target="_blank" rel="noopener">
                                ERC-8004 ↗
                            </a>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.titleContainer}>
                        <div>
                            <h1 className={styles.heroTitle}>
                                Discover <span className={styles.accent}>Trusted</span> AI Agents
                            </h1>
                            <p className={styles.heroSubtitle}>
                                Explore ERC-8004 registered agents on Avalanche with real-time trust scoring,
                                reputation tracking, and endpoint verification.
                            </p>
                        </div>
                        <Link href="/agent/register" className={styles.registerLink}>
                            + Register Agent
                        </Link>
                    </div>

                    <div className={styles.heroStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats?.agents.total ?? 0}</span>
                            <span className={styles.statLabel}>Total Agents</span>
                            <div className={styles.statBar} style={{ width: '100%', opacity: 0.3 }}></div>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats?.agents.active ?? 0}</span>
                            <span className={styles.statLabel}>Active</span>
                            <div className={styles.statBar} style={{ width: `${(stats?.agents.active || 0) / (stats?.agents.total || 1) * 100}%` }}></div>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats?.feedback.total ?? 0}</span>
                            <span className={styles.statLabel}>Reviews</span>
                            <div className={styles.statBar} style={{ width: '60%', background: 'var(--color-secondary)' }}></div>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats?.agents.x402Enabled ?? 0}</span>
                            <span className={styles.statLabel}>x402 Enabled</span>
                            <div className={styles.statBar} style={{ width: `${(stats?.agents.x402Enabled || 0) / (stats?.agents.total || 1) * 100}%`, background: '#ff00cc' }}></div>
                        </div>
                    </div>
                </div>
            </section>

            <main className={styles.main}>
                <div className="container">
                    {/* Global Network Pulse */}
                    {stats?.network && (
                        <section className={styles.networkPulse}>
                            <div className={styles.pulseHeader}>
                                <div className={styles.pulseIcon}>⚡</div>
                                <h2>Network Pulse</h2>
                                <span className={styles.liveBadge}>LIVE</span>
                            </div>
                            <div className={styles.pulseGrid}>
                                <div className={styles.pulseStat}>
                                    <div className={styles.pulseLabel}>Total Network Volume</div>
                                    <div className={styles.pulseValue}>
                                        {(Number(stats.network.totalVolume) / 1e18).toFixed(2)} <span>AVAX</span>
                                    </div>
                                </div>
                                <div className={styles.pulseStat}>
                                    <div className={styles.pulseLabel}>Global Transactions</div>
                                    <div className={styles.pulseValue}>
                                        {stats.network.totalTransactions} <span>txs</span>
                                    </div>
                                </div>
                                <div className={styles.pulseStat}>
                                    <div className={styles.pulseLabel}>Avg. Trust Level</div>
                                    <div className={styles.pulseValue}>
                                        {agents.length > 0 ? (agents.reduce((acc, a) => acc + a.complianceScore, 0) / agents.length).toFixed(0) : 0}%
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            placeholder="Search agents by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                        <span className={styles.searchIcon}>🔍</span>
                    </div>

                    {/* Ranking Section */}
                    <section className={styles.rankingSection} id="ranking">
                        <h2 className={styles.rankingTitle}>
                            <span className={styles.rankingEmoji}>🏆</span> Agent Power Ranking
                        </h2>
                        <div className={styles.rankingGrid}>
                            {agents
                                .filter(a => Number(a.totalVolume || 0) > 0)
                                .sort((a, b) => Number(b.totalVolume || 0) - Number(a.totalVolume || 0))
                                .slice(0, 4)
                                .map((agent, index) => (
                                    <Link key={agent.id} href={`/agent/${agent.agentId}`} className={styles.rankingItem}>
                                        <div className={styles.rankNumber}>#{index + 1}</div>
                                        <div className={styles.rankInfo}>
                                            <div className={styles.rankName}>{agent.name || `Agent #${agent.agentId}`}</div>
                                            <div className={styles.rankVolume}>
                                                {(Number(agent.totalVolume) / 1e18).toFixed(2)} <span>AVAX</span>
                                            </div>
                                            <div className={styles.rankSub}>Active in {agent.endpoints.length} protocols</div>
                                        </div>
                                    </Link>
                                ))}
                            {agents.filter(a => Number(a.totalVolume || 0) > 0).length === 0 && (
                                <div className={styles.emptyState} style={{ gridColumn: '1 / -1', padding: '20px' }}>
                                    <p>Gathering network analytics...</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className={styles.sectionHeader} style={{ marginTop: '48px' }}>
                        <h2>Directory</h2>
                        <div className={styles.filters}>
                            <button
                                className={`btn btn-secondary ${styles.filterBtn} ${filter === 'all' ? styles.activeFilter : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </button>
                            <button
                                className={`btn btn-secondary ${styles.filterBtn} ${filter === 'active' ? styles.activeFilter : ''}`}
                                onClick={() => setFilter('active')}
                            >
                                Active
                            </button>
                            <button
                                className={`btn btn-secondary ${styles.filterBtn} ${filter === 'x402' ? styles.activeFilter : ''}`}
                                onClick={() => setFilter('x402')}
                            >
                                x402
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.agentGrid}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={`${styles.agentCard} ${styles.skeletonCard}`}>
                                    <div className={styles.skeletonAvatar}></div>
                                    <div className={styles.skeletonTitle}></div>
                                    <div className={styles.skeletonText}></div>
                                    <div className={styles.skeletonBadges}></div>
                                </div>
                            ))}
                        </div>
                    ) : agents.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <h3>No agents found</h3>
                            <p>Agents will appear here once indexed from the blockchain.</p>
                        </div>
                    ) : (
                        <div className={styles.agentGrid}>
                            {agents
                                .filter(a =>
                                (a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    a.agentId.toLowerCase().includes(searchTerm.toLowerCase()))
                                )
                                .map((agent) => (
                                    <Link
                                        key={agent.id}
                                        href={`/agent/${agent.agentId}`}
                                        className={`card ${styles.agentCard}`}
                                    >
                                        <div className={styles.trustScoreWrapper}>
                                            <div className={styles.trustScoreCircle} style={{ '--score': agent.complianceScore } as any}>
                                                <span className={styles.trustValue}>{agent.complianceScore}</span>
                                                <span className={styles.trustLabel}>Trust</span>
                                            </div>
                                        </div>
                                        <div className={styles.agentHeader}>
                                            <div className={styles.agentAvatar}>
                                                {agent.image ? (
                                                    <img src={agent.image} alt={agent.name || 'Agent'} />
                                                ) : (
                                                    <span>{(agent.name?.[0] || '?').toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className={styles.agentInfo}>
                                                <h3 className={styles.agentName}>
                                                    {agent.name || `Agent #${agent.agentId}`}
                                                </h3>
                                                <span className={styles.agentId}>#{agent.agentId}</span>
                                            </div>
                                        </div>

                                        {agent.description && (
                                            <p className={styles.agentDescription}>
                                                {agent.description.slice(0, 120)}
                                                {agent.description.length > 120 ? '...' : ''}
                                            </p>
                                        )}

                                        <div className={styles.agentBadges} style={{ marginBottom: '8px' }}>
                                            {agent.active && (
                                                <span className="badge badge-success">● Active</span>
                                            )}
                                            {agent.isA2AVerified && (
                                                <span className="badge badge-primary">A2A Verified</span>
                                            )}
                                            {agent.x402Support && (
                                                <span className="badge badge-accent">x402</span>
                                            )}
                                            {Number(agent.totalVolume || 0) > 0 && (
                                                <span className={styles.volumeTag}>
                                                    {(Number(agent.totalVolume) / 1e18).toFixed(1)} AVAX
                                                </span>
                                            )}
                                        </div>

                                        <div className={styles.agentProtocols}>
                                            {agent.endpoints.slice(0, 4).map((ep) => (
                                                <span key={ep.id} className={styles.protocolTag}>
                                                    {ep.name}
                                                </span>
                                            ))}
                                            {agent.endpoints.length > 4 && (
                                                <span className={styles.protocolMore}>
                                                    +{agent.endpoints.length - 4}
                                                </span>
                                            )}
                                        </div>

                                        <div className={styles.agentFooter}>
                                            <div className={styles.reputationBadge}>
                                                {agent.id === 2 ? (
                                                    <div className={styles.issueBubble}>
                                                        <span className={styles.issueIcon}>N</span>
                                                        <span>1 Issue</span>
                                                    </div>
                                                ) : (
                                                    <span className={styles.validationCount}>{agent.feedbackCount} reviews</span>
                                                )}
                                            </div>
                                            <div className={styles.reputationBadge}>
                                                <span className={styles.validationCount}>{agent.validationCount} validations</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                        </div>
                    )}
                </div>
            </main>

            <footer className={styles.footer}>
                <div className="container">
                    <div className={styles.footerContent}>
                        <p>
                            Built for <strong>Avalanche</strong> • Powered by{' '}
                            <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noopener">
                                ERC-8004
                            </a>
                        </p>
                        <p className={styles.footerMuted}>
                            Agent Scanner with Sentinel Trust Layer
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

import Link from 'next/link';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Agent {
    id: number;
    agentId: string;
    name: string | null;
    description: string | null;
    image: string | null;
    active: boolean;
    x402Support: boolean;
    supportedTrust: string[];
    endpoints: Array<{
        id: number;
        name: string;
        endpoint: string;
        isVerified: boolean;
    }>;
    feedbackCount: number;
    validationCount: number;
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
}

async function getStats(): Promise<Stats | null> {
    try {
        const res = await fetch(`${API_URL}/api/v1/stats`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function getAgents(): Promise<Agent[]> {
    try {
        const res = await fetch(`${API_URL}/api/v1/agents?limit=20`, {
            next: { revalidate: 30 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const [stats, agents] = await Promise.all([getStats(), getAgents()]);

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
                    <h1 className={styles.heroTitle}>
                        Discover <span className={styles.accent}>Trusted</span> AI Agents
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Explore ERC-8004 registered agents on Avalanche with real-time trust scoring,
                        reputation tracking, and endpoint verification.
                    </p>
                    <div className={styles.heroStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats?.agents.total ?? 0}</span>
                            <span className={styles.statLabel}>Total Agents</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats?.agents.active ?? 0}</span>
                            <span className={styles.statLabel}>Active</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats?.feedback.total ?? 0}</span>
                            <span className={styles.statLabel}>Reviews</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats?.agents.x402Enabled ?? 0}</span>
                            <span className={styles.statLabel}>x402 Enabled</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agent List */}
            <main className={styles.main}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <h2>Registered Agents</h2>
                        <div className={styles.filters}>
                            <button className={`btn btn-secondary ${styles.filterBtn}`}>All</button>
                            <button className={`btn btn-secondary ${styles.filterBtn}`}>Active</button>
                            <button className={`btn btn-secondary ${styles.filterBtn}`}>x402</button>
                        </div>
                    </div>

                    {agents.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <h3>No agents found</h3>
                            <p>Agents will appear here once indexed from the blockchain.</p>
                        </div>
                    ) : (
                        <div className={styles.agentGrid}>
                            {agents.map((agent, index) => (
                                <Link
                                    key={agent.id}
                                    href={`/agent/${agent.agentId}`}
                                    className={`card ${styles.agentCard}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
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

                                    <div className={styles.agentBadges}>
                                        {agent.active && (
                                            <span className="badge badge-success">● Active</span>
                                        )}
                                        {agent.x402Support && (
                                            <span className="badge badge-accent">x402</span>
                                        )}
                                        {agent.endpoints.length > 0 && (
                                            <span className="badge badge-info">
                                                {agent.endpoints.length} endpoints
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

                                    <div className={styles.agentStats}>
                                        <div className={styles.agentStat}>
                                            <span className={styles.agentStatValue}>{agent.feedbackCount}</span>
                                            <span className={styles.agentStatLabel}>reviews</span>
                                        </div>
                                        <div className={styles.agentStat}>
                                            <span className={styles.agentStatValue}>{agent.validationCount}</span>
                                            <span className={styles.agentStatLabel}>validations</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
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

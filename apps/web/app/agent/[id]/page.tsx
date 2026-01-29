import Link from 'next/link';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AgentDetails {
    id: number;
    agentId: string;
    chainId: number;
    registryAddress: string;
    ownerAddress: string;
    agentURI: string | null;
    name: string | null;
    description: string | null;
    image: string | null;
    active: boolean;
    x402Support: boolean;
    supportedTrust: string[];
    agentHash: string | null;
    agentWallet: string | null;
    endpoints: Array<{
        id: number;
        name: string;
        endpoint: string;
        version: string | null;
        isVerified: boolean;
        tlsValid: boolean | null;
        dnsValid: boolean | null;
    }>;
    metadata: Array<{ key: string; value: string }>;
    registeredAt: string;
    registeredBlock: string;
    registeredTx: string;
}

interface Feedback {
    id: number;
    clientAddress: string;
    score: number;
    tag1: string | null;
    tag2: string | null;
    isRevoked: boolean;
    createdAt: string;
}

async function getAgent(id: string): Promise<AgentDetails | null> {
    try {
        const res = await fetch(`${API_URL}/api/v1/agents/${id}`, {
            next: { revalidate: 30 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function getFeedback(id: string): Promise<{ data: Feedback[]; summary: { averageScore: number; totalFeedback: number } }> {
    try {
        const res = await fetch(`${API_URL}/api/v1/agents/${id}/feedback?limit=10`, {
            next: { revalidate: 30 },
        });
        if (!res.ok) return { data: [], summary: { averageScore: 0, totalFeedback: 0 } };
        return res.json();
    } catch {
        return { data: [], summary: { averageScore: 0, totalFeedback: 0 } };
    }
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [agent, feedbackData] = await Promise.all([getAgent(id), getFeedback(id)]);

    if (!agent) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <div className="container">
                        <Link href="/" className={styles.backLink}>← Back to Agents</Link>
                    </div>
                </header>
                <main className={styles.main}>
                    <div className="container">
                        <div className={styles.notFound}>
                            <h1>Agent Not Found</h1>
                            <p>The agent with ID {id} could not be found.</p>
                            <Link href="/" className="btn btn-primary">Browse Agents</Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className="container">
                    <Link href="/" className={styles.backLink}>← Back to Agents</Link>
                </div>
            </header>

            <main className={styles.main}>
                <div className="container">
                    {/* Agent Profile */}
                    <div className={styles.profileSection}>
                        <div className={styles.profileHeader}>
                            <div className={styles.avatar}>
                                {agent.image ? (
                                    <img src={agent.image} alt={agent.name || 'Agent'} />
                                ) : (
                                    <span>{(agent.name?.[0] || '?').toUpperCase()}</span>
                                )}
                            </div>
                            <div className={styles.profileInfo}>
                                <h1 className={styles.profileName}>
                                    {agent.name || `Agent #${agent.agentId}`}
                                </h1>
                                <p className={styles.profileId}>
                                    Token ID: {agent.agentId} • Chain ID: {agent.chainId}
                                </p>
                                <div className={styles.badges}>
                                    {agent.active ? (
                                        <span className="badge badge-success">● Active</span>
                                    ) : (
                                        <span className="badge badge-warning">○ Inactive</span>
                                    )}
                                    {agent.x402Support && (
                                        <span className="badge badge-accent">x402 Payments</span>
                                    )}
                                    {agent.supportedTrust.map((trust) => (
                                        <span key={trust} className="badge badge-info">{trust}</span>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.trustScore}>
                                <div className={styles.scoreCircle}>
                                    <span className={styles.scoreValue}>
                                        {feedbackData.summary.averageScore.toFixed(0)}
                                    </span>
                                    <span className={styles.scoreLabel}>Trust</span>
                                </div>
                            </div>
                        </div>

                        {agent.description && (
                            <p className={styles.description}>{agent.description}</p>
                        )}
                    </div>

                    <div className={styles.grid}>
                        {/* Endpoints */}
                        <section className={`card ${styles.section}`}>
                            <h2 className={styles.sectionTitle}>Endpoints ({agent.endpoints.length})</h2>
                            {agent.endpoints.length === 0 ? (
                                <p className={styles.empty}>No endpoints registered</p>
                            ) : (
                                <div className={styles.endpointList}>
                                    {agent.endpoints.map((ep) => (
                                        <div key={ep.id} className={styles.endpoint}>
                                            <div className={styles.endpointHeader}>
                                                <span className={styles.endpointName}>{ep.name}</span>
                                                {ep.version && (
                                                    <span className={styles.endpointVersion}>v{ep.version}</span>
                                                )}
                                            </div>
                                            <code className={styles.endpointUrl}>{ep.endpoint}</code>
                                            <div className={styles.endpointTrust}>
                                                {ep.tlsValid !== null && (
                                                    <span className={ep.tlsValid ? styles.trustValid : styles.trustInvalid}>
                                                        {ep.tlsValid ? '✓' : '✗'} TLS
                                                    </span>
                                                )}
                                                {ep.dnsValid !== null && (
                                                    <span className={ep.dnsValid ? styles.trustValid : styles.trustInvalid}>
                                                        {ep.dnsValid ? '✓' : '✗'} DNS
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Feedback */}
                        <section className={`card ${styles.section}`}>
                            <h2 className={styles.sectionTitle}>
                                Feedback ({feedbackData.summary.totalFeedback})
                            </h2>
                            <div className={styles.feedbackSummary}>
                                <div className={styles.avgScore}>
                                    <span className={styles.avgScoreValue}>
                                        {feedbackData.summary.averageScore.toFixed(1)}
                                    </span>
                                    <span className={styles.avgScoreLabel}>Average Score</span>
                                </div>
                            </div>
                            {feedbackData.data.length === 0 ? (
                                <p className={styles.empty}>No feedback yet</p>
                            ) : (
                                <div className={styles.feedbackList}>
                                    {feedbackData.data.map((fb) => (
                                        <div
                                            key={fb.id}
                                            className={`${styles.feedback} ${fb.isRevoked ? styles.revoked : ''}`}
                                        >
                                            <div className={styles.feedbackScore}>{fb.score}</div>
                                            <div className={styles.feedbackContent}>
                                                <span className={styles.feedbackClient}>
                                                    {fb.clientAddress.slice(0, 8)}...{fb.clientAddress.slice(-6)}
                                                </span>
                                                <div className={styles.feedbackTags}>
                                                    {fb.tag1 && <span>{fb.tag1}</span>}
                                                    {fb.tag2 && <span>{fb.tag2}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Technical Details */}
                    <section className={`card ${styles.section} ${styles.fullWidth}`}>
                        <h2 className={styles.sectionTitle}>Technical Details</h2>
                        <div className={styles.details}>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Registry Address</span>
                                <code className={styles.detailValue}>{agent.registryAddress}</code>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Owner Address</span>
                                <code className={styles.detailValue}>{agent.ownerAddress}</code>
                            </div>
                            {agent.agentWallet && (
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Agent Wallet</span>
                                    <code className={styles.detailValue}>{agent.agentWallet}</code>
                                </div>
                            )}
                            {agent.agentHash && (
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Agent Hash</span>
                                    <code className={styles.detailValue}>{agent.agentHash}</code>
                                </div>
                            )}
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Registered</span>
                                <span className={styles.detailValue}>
                                    Block {agent.registeredBlock} • {new Date(agent.registeredAt).toLocaleDateString()}
                                </span>
                            </div>
                            {agent.agentURI && (
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Agent URI</span>
                                    <code className={styles.detailValue}>{agent.agentURI.slice(0, 80)}...</code>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

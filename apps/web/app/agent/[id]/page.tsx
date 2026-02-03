'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { ScanTimeline } from '../../../components/ScanTimeline';

// =============================================
// TIPOS MEJORADOS
// =============================================
interface Endpoint {
    id: number;
    name: string;
    endpoint: string;
    version: string | null;
    isVerified: boolean;
    tlsValid: boolean | null;
    dnsValid: boolean | null;
}

interface MetadataItem {
    key: string;
    value: string;
}

interface Scan {
    id: number;
    scannedAt: string;
    trustScore: number;
    tlsValid: boolean;
    tlsVersion: string | null;
    tlsIssuer: string | null;
    dnsValid: boolean;
    httpStatus: number;
    httpLatency: number | null;
    error: string | null;
    hasHSTS: boolean;
    hasCSP: boolean;
    hasCORS: boolean;
}

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
    complianceScore: number;
    supportedTrust: string[] | null;
    agentHash: string | null;
    agentWallet: string | null;
    endpoints: Endpoint[];
    metadata: MetadataItem[];
    recentScans: Scan[];
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

interface FeedbackData {
    data: Feedback[];
    summary: {
        averageScore: number;
        totalFeedback: number;
    };
}

// =============================================
// COMPONENTE PRINCIPAL CORREGIDO
// =============================================
export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params); // Next.js 15 standard for client components

    const [agent, setAgent] = useState<AgentDetails | null>(null);
    const [feedbackData, setFeedbackData] = useState<FeedbackData>({
        data: [],
        summary: { averageScore: 0, totalFeedback: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { showToast } = useToast();

    // =============================================
    // FETCH DATA CON CLEANUP
    // =============================================
    useEffect(() => {
        let isMounted = true;
        let abortController = new AbortController();

        const fetchData = async () => {
            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                // api.getAgent and getAgentFeedback should support AbortSignal if needed, 
                // but we keep the isMounted check for reliability.
                const [agentData, fbData] = await Promise.all([
                    api.getAgent(id),
                    api.getAgentFeedback(id)
                ]);

                if (isMounted) {
                    setAgent(agentData);
                    setFeedbackData(fbData);
                }
            } catch (err: any) {
                if (isMounted && err.name !== 'AbortError') {
                    console.error('Failed to fetch agent details:', err);
                    setError('Failed to load agent details');
                    showToast('Failed to load agent details.', 'error');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [id, showToast]);

    // =============================================
    // VALIDACIÓN CON POLLING MEJORADO
    // =============================================
    const handleValidate = useCallback(async () => {
        if (!agent) return;

        setValidating(true);
        let isCancelled = false;

        try {
            await api.validateAgent(agent.id);
            showToast('Validation triggered! Scanner is working...', 'info');

            const maxAttempts = 10;
            const pollInterval = 4000;
            const originalScore = agent.complianceScore;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (isCancelled) break;

                await new Promise(resolve => setTimeout(resolve, pollInterval));

                if (isCancelled) break;

                try {
                    const updatedAgent = await api.getAgent(id);

                    if (updatedAgent.complianceScore !== originalScore) {
                        showToast('Scan complete! Trust score updated.', 'success');
                        setAgent(updatedAgent);
                        setValidating(false);
                        return;
                    }

                    setAgent(updatedAgent);
                } catch (pollError) {
                    console.error('Error polling agent:', pollError);
                }
            }

            if (!isCancelled) {
                showToast('Scan cycle complete. Check history for details.', 'info');
            }
        } catch (validationError) {
            console.error('Failed to trigger validation:', validationError);

            if (!isCancelled) {
                showToast('Failed to trigger validation scan.', 'error');
            }
        } finally {
            if (!isCancelled) {
                setValidating(false);
            }
        }

        return () => { isCancelled = true; };
    }, [agent, id, showToast]);

    // =============================================
    // VALORES COMPUTADOS (MEMOIZADOS)
    // =============================================
    const feedbackSummary = useMemo(() => ({
        averageScore: feedbackData?.summary?.averageScore ?? 0,
        totalFeedback: feedbackData?.summary?.totalFeedback ?? 0
    }), [feedbackData]);

    const agentDisplayName = useMemo(() =>
        agent?.name || `Agent #${agent?.agentId || 'Unknown'}`,
        [agent]
    );

    // =============================================
    // ESTADOS DE CARGA Y ERROR
    // =============================================
    if (loading && !agent) {
        return (
            <div className={styles.page}>
                <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
                    <div className="spinner" aria-label="Loading agent data"></div>
                    <h2 style={{ color: 'var(--color-primary)' }}>Loading Agent Data...</h2>
                    <p>Fetching on-chain details and trust metrics.</p>
                </div>
            </div>
        );
    }

    if (error || !agent) {
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

    // =============================================
    // RENDER PRINCIPAL
    // =============================================
    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className="container">
                    <Link href="/" className={styles.backLink} aria-label="Back to Agents">
                        ← Back to Agents
                    </Link>
                </div>
            </header>

            <main className={styles.main}>
                <div className="container">
                    {/* Agent Profile */}
                    <div className={styles.profileSection}>
                        <div className={styles.profileHeader}>
                            <div className={styles.avatar} aria-hidden="true">
                                {agent.image ? (
                                    <img
                                        src={agent.image}
                                        alt={`${agentDisplayName} avatar`}
                                        loading="lazy"
                                    />
                                ) : (
                                    <span>{(agent.name?.[0] || '?').toUpperCase()}</span>
                                )}
                            </div>

                            <div className={styles.profileInfo}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <h1 className={styles.profileName}>
                                        {agentDisplayName}
                                    </h1>
                                    <button
                                        className={`btn ${styles.validateBtn}`}
                                        onClick={handleValidate}
                                        disabled={validating}
                                        aria-busy={validating}
                                        aria-label={validating ? 'Validation in progress' : 'Validate agent now'}
                                    >
                                        {validating ? (
                                            <>
                                                <span className="spinner-small" aria-hidden="true"></span>
                                                Scanning...
                                            </>
                                        ) : 'Validate now'}
                                    </button>
                                </div>

                                <p className={styles.profileId}>
                                    Token ID: {agent.agentId} • Chain ID: {agent.chainId}
                                </p>

                                <div className={styles.badges} role="list">
                                    {agent.active ? (
                                        <span className="badge badge-success" role="listitem">● Active</span>
                                    ) : (
                                        <span className="badge badge-warning" role="listitem">○ Inactive</span>
                                    )}
                                    {agent.x402Support && (
                                        <span className="badge badge-accent" role="listitem">x402 Payments</span>
                                    )}
                                    {agent.supportedTrust?.map((trust) => (
                                        <span key={trust} className="badge badge-info" role="listitem">
                                            {trust}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.trustScore}>
                                <div
                                    className={`${styles.scoreCircle} ${validating ? styles.scanningEffect : ''}`}
                                    role="status"
                                    aria-label={validating ? 'Scanning in progress' : `Trust score: ${agent.complianceScore.toFixed(0)}`}
                                >
                                    <span className={styles.scoreValue}>
                                        {validating ? '...' : (agent.complianceScore?.toFixed(0) ?? 0)}
                                    </span>
                                    <span className={styles.scoreLabel}>
                                        {validating ? 'Scanning' : 'Trust'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {agent.description && (
                            <p className={styles.description}>{agent.description}</p>
                        )}
                    </div>

                    {/* Trust Metrics Breakdown */}
                    <section className={`card ${styles.section}`} aria-labelledby="metrics-heading">
                        <h2 id="metrics-heading" className={styles.sectionTitle}>
                            Trust Metrics Breakdown
                        </h2>
                        <div className={styles.metricsGrid}>
                            {/* Health Metric */}
                            <div className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricLabel}>Health</span>
                                    <span className={styles.metricValue}>
                                        {agent.endpoints.every(e => e.tlsValid && e.dnsValid) ? '100%' : '80%'}
                                    </span>
                                </div>
                                <div className={styles.metricBarContainer}>
                                    <div
                                        className={styles.metricBar}
                                        style={{ width: agent.endpoints.every(e => e.tlsValid && e.dnsValid) ? '100%' : '80%' }}
                                    ></div>
                                </div>
                                <p className={styles.metricDesc}>TLS, DNS and Server uptime status.</p>
                            </div>

                            {/* Reputation Metric */}
                            <div className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricLabel}>Reputation</span>
                                    <span className={styles.metricValue}>
                                        {feedbackSummary.averageScore.toFixed(0)}%
                                    </span>
                                </div>
                                <div className={styles.metricBarContainer}>
                                    <div
                                        className={styles.metricBar}
                                        style={{
                                            width: `${feedbackSummary.averageScore}%`,
                                            background: 'var(--color-secondary)'
                                        }}
                                    ></div>
                                </div>
                                <p className={styles.metricDesc}>Calculated from {feedbackSummary.totalFeedback} on-chain reviews.</p>
                            </div>

                            {/* Compliance Metric */}
                            <div className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricLabel}>Compliance</span>
                                    <span className={styles.metricValue}>
                                        {agent.active && agent.agentHash ? '100%' : '50%'}
                                    </span>
                                </div>
                                <div className={styles.metricBarContainer}>
                                    <div
                                        className={styles.metricBar}
                                        style={{
                                            width: agent.active && agent.agentHash ? '100%' : '50%',
                                            background: 'var(--color-accent)'
                                        }}
                                    ></div>
                                </div>
                                <p className={styles.metricDesc}>Registry status and metadata integrity.</p>
                            </div>

                            {/* Economy Metric */}
                            <div className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricLabel}>Economy</span>
                                    <span className={styles.metricValue}>
                                        {agent.x402Support ? '100%' : '0%'}
                                    </span>
                                </div>
                                <div className={styles.metricBarContainer}>
                                    <div
                                        className={styles.metricBar}
                                        style={{
                                            width: agent.x402Support ? '100%' : '0%',
                                            background: '#ff00cc'
                                        }}
                                    ></div>
                                </div>
                                <p className={styles.metricDesc}>x402 Payment support and agent wallet setup.</p>
                            </div>
                        </div>
                    </section>

                    {/* Feedback Section */}
                    <section className={`card ${styles.section}`} aria-labelledby="feedback-heading">
                        <h2 id="feedback-heading" className={styles.sectionTitle}>
                            Feedback ({feedbackSummary.totalFeedback})
                        </h2>

                        <div className={styles.feedbackSummary}>
                            <div className={styles.avgScore}>
                                <span className={styles.avgScoreValue}>
                                    {feedbackSummary.averageScore.toFixed(1)}
                                </span>
                                <span className={styles.avgScoreLabel}>Average Score</span>
                            </div>
                        </div>

                        {feedbackData.data.length === 0 ? (
                            <p className={styles.empty}>No feedback yet</p>
                        ) : (
                            <div className={styles.feedbackList} role="list">
                                {feedbackData.data.map((fb) => (
                                    <div
                                        key={fb.id}
                                        className={`${styles.feedback} ${fb.isRevoked ? styles.revoked : ''}`}
                                        role="listitem"
                                    >
                                        <div className={styles.feedbackScore} aria-label={`Score: ${fb.score}`}>
                                            {fb.score}
                                        </div>
                                        <div className={styles.feedbackContent}>
                                            <span className={styles.feedbackClient}>
                                                {fb.clientAddress.slice(0, 8)}...{fb.clientAddress.slice(-6)}
                                            </span>
                                            <time
                                                className={styles.feedbackDate}
                                                dateTime={fb.createdAt}
                                            >
                                                {new Date(fb.createdAt).toLocaleDateString()}
                                            </time>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className={styles.grid}>
                        {/* Endpoints Section */}
                        <section className={`card ${styles.section}`} aria-labelledby="endpoints-heading">
                            <h2 id="endpoints-heading" className={styles.sectionTitle}>
                                Endpoints ({agent.endpoints.length})
                            </h2>

                            {agent.endpoints.length === 0 ? (
                                <p className={styles.empty}>No endpoints registered</p>
                            ) : (
                                <div className={styles.endpointList} role="list">
                                    {agent.endpoints.map((ep) => (
                                        <div key={ep.id} className={styles.endpoint} role="listitem">
                                            <div className={styles.endpointHeader}>
                                                <span className={styles.endpointName}>{ep.name}</span>
                                                {ep.version && (
                                                    <span className={styles.endpointVersion}>v{ep.version}</span>
                                                )}
                                            </div>
                                            <code className={styles.endpointUrl}>{ep.endpoint}</code>
                                            <div className={styles.endpointTrust}>
                                                {ep.tlsValid !== null && (
                                                    <span
                                                        className={ep.tlsValid ? styles.trustValid : styles.trustInvalid}
                                                        aria-label={`TLS: ${ep.tlsValid ? 'Valid' : 'Invalid'}`}
                                                    >
                                                        {ep.tlsValid ? '✓' : '✗'} TLS
                                                    </span>
                                                )}
                                                {ep.dnsValid !== null && (
                                                    <span
                                                        className={ep.dnsValid ? styles.trustValid : styles.trustInvalid}
                                                        aria-label={`DNS: ${ep.dnsValid ? 'Valid' : 'Invalid'}`}
                                                    >
                                                        {ep.dnsValid ? '✓' : '✗'} DNS
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Scan History */}
                        <section className={`card ${styles.section}`} aria-labelledby="scan-history-heading">
                            <h2 id="scan-history-heading" className={styles.sectionTitle}>
                                Scan History ({agent.recentScans?.length || 0})
                            </h2>
                            <ScanTimeline scans={agent.recentScans} />
                        </section>
                    </div>

                    {/* Technical Details */}
                    <section
                        className={`card ${styles.section} ${styles.fullWidth}`}
                        aria-labelledby="technical-details-heading"
                    >
                        <h2 id="technical-details-heading" className={styles.sectionTitle}>
                            Technical Details
                        </h2>

                        <dl className={styles.details}>
                            <div className={styles.detailItem}>
                                <dt className={styles.detailLabel}>Registry Address</dt>
                                <dd className={styles.detailValue}>
                                    <code>{agent.registryAddress}</code>
                                </dd>
                            </div>

                            <div className={styles.detailItem}>
                                <dt className={styles.detailLabel}>Owner Address</dt>
                                <dd className={styles.detailValue}>
                                    <code>{agent.ownerAddress}</code>
                                </dd>
                            </div>

                            {agent.agentWallet && (
                                <div className={styles.detailItem}>
                                    <dt className={styles.detailLabel}>Agent Wallet</dt>
                                    <dd className={styles.detailValue}>
                                        <code>{agent.agentWallet}</code>
                                    </dd>
                                </div>
                            )}

                            {agent.agentHash && (
                                <div className={styles.detailItem}>
                                    <dt className={styles.detailLabel}>Agent Hash</dt>
                                    <dd className={styles.detailValue}>
                                        <code>{agent.agentHash}</code>
                                    </dd>
                                </div>
                            )}

                            <div className={styles.detailItem}>
                                <dt className={styles.detailLabel}>Registered</dt>
                                <dd className={styles.detailValue}>
                                    Block {agent.registeredBlock} • {' '}
                                    <time dateTime={agent.registeredAt}>
                                        {new Date(agent.registeredAt).toLocaleDateString()}
                                    </time>
                                </dd>
                            </div>

                            {agent.agentURI && (
                                <div className={styles.detailItem}>
                                    <dt className={styles.detailLabel}>Agent URI</dt>
                                    <dd className={styles.detailValue}>
                                        <code style={{ overflowWrap: 'break-word', maxWidth: '100%' }}>
                                            {agent.agentURI}
                                        </code>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </section>
                </div>
            </main>
        </div>
    );
}

import React from 'react';
import styles from './ScanTimeline.module.css';

interface Scan {
    id: number;
    trustScore: number;
    httpStatus: number;
    tlsValid: boolean;
    tlsVersion: string | null;
    tlsIssuer: string | null;
    dnsValid: boolean;
    httpLatency: number | null;
    error: string | null;
    hasHSTS: boolean;
    hasCSP: boolean;
    hasCORS: boolean;
    scannedAt: string;
}

interface ScanTimelineProps {
    scans: Scan[];
}

export function ScanTimeline({ scans }: ScanTimelineProps) {
    const [expandedScan, setExpandedScan] = React.useState<number | null>(null);

    if (!scans || scans.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No scans recorded yet for this agent.</p>
            </div>
        );
    }

    return (
        <div className={styles.timeline}>
            {scans.map((scan, index) => (
                <div key={scan.id} className={styles.scanItem}>
                    <div className={styles.marker}>
                        <div className={`${styles.dot} ${scan.trustScore > 80 ? styles.good : scan.trustScore > 50 ? styles.warning : styles.danger}`}></div>
                        {index !== scans.length - 1 && <div className={styles.line}></div>}
                    </div>
                    <div className={styles.content}>
                        <div
                            className={styles.header}
                            onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.headerLeft}>
                                <span className={styles.score}>{scan.trustScore}% Trust</span>
                                <span className={styles.date}>{new Date(scan.scannedAt).toLocaleString()}</span>
                            </div>
                            <span className={styles.toggleIcon}>
                                {expandedScan === scan.id ? '▼' : '▶'}
                            </span>
                        </div>
                        <div className={styles.details}>
                            <span className={`${styles.badge} ${scan.tlsValid ? styles.badgeSuccess : styles.badgeError}`}>
                                TLS: {scan.tlsValid ? 'Valid' : 'Invalid'}
                            </span>
                            <span className={`${styles.badge} ${scan.dnsValid ? styles.badgeSuccess : styles.badgeError}`}>
                                DNS: {scan.dnsValid ? 'Valid' : 'Invalid'}
                            </span>
                            <span className={styles.status}>Status: {scan.httpStatus}</span>
                            {scan.httpLatency && <span className={styles.status}>{scan.httpLatency}ms</span>}
                        </div>

                        {expandedScan === scan.id && (
                            <div className={styles.expandedContent}>
                                <div className={styles.logGrid}>
                                    <div className={styles.logItem}>
                                        <span className={styles.logLabel}>SSL Issuer:</span>
                                        <span className={styles.logValue}>{scan.tlsIssuer || 'N/A'}</span>
                                    </div>
                                    <div className={styles.logItem}>
                                        <span className={styles.logLabel}>TLS Version:</span>
                                        <span className={styles.logValue}>{scan.tlsVersion || 'N/A'}</span>
                                    </div>
                                    <div className={styles.logItem}>
                                        <span className={styles.logLabel}>HSTS:</span>
                                        <span className={`${styles.logValue} ${scan.hasHSTS ? styles.textSuccess : styles.textDim}`}>
                                            {scan.hasHSTS ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className={styles.logItem}>
                                        <span className={styles.logLabel}>CSP:</span>
                                        <span className={`${styles.logValue} ${scan.hasCSP ? styles.textSuccess : styles.textDim}`}>
                                            {scan.hasCSP ? 'Strict' : 'None'}
                                        </span>
                                    </div>
                                    <div className={styles.logItem}>
                                        <span className={styles.logLabel}>CORS:</span>
                                        <span className={`${styles.logValue} ${scan.hasCORS ? styles.textSuccess : styles.textDim}`}>
                                            {scan.hasCORS ? 'Restricted' : 'Open/None'}
                                        </span>
                                    </div>
                                    {scan.error && (
                                        <div className={`${styles.logItem} ${styles.fullRow}`}>
                                            <span className={styles.logLabel}>Diagnostic Error:</span>
                                            <span className={styles.errorValue}>{scan.error}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

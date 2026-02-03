'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';

export default function RegisterAgentPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        agentId: '',
        description: '',
        image: '',
        x402Support: true,
        endpoint1Name: 'Sentinel Main',
        endpoint1Url: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple real-time/submission validation
        if (formData.name.length < 3) {
            showToast('Agent name must be at least 3 characters.', 'error');
            return;
        }

        const agentIdNum = parseInt(formData.agentId, 10);
        if (isNaN(agentIdNum) || agentIdNum <= 0) {
            showToast('Invalid Token ID. Must be a positive number.', 'error');
            return;
        }

        if (!formData.endpoint1Url.startsWith('http')) {
            showToast('Endpoint URL must start with http/https.', 'error');
            return;
        }

        setLoading(true);

        try {
            const res = await api.registerAgent({
                name: formData.name,
                agentId: agentIdNum,
                description: formData.description,
                image: formData.image,
                x402Support: formData.x402Support,
                endpoints: [
                    { name: formData.endpoint1Name, url: formData.endpoint1Url }
                ]
            });

            showToast('Agent registered successfully!', 'success');
            router.push(`/agent/${res.id}`);
        } catch (error: any) {
            console.error('Registration failed:', error);
            showToast(error.message || 'Failed to register agent.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" className={styles.backLink}>← Back to Home</Link>
                </div>
            </header>

            <main className={styles.main}>
                <div className="container">
                    <div className={styles.formCard}>
                        <h1 className={styles.title}>Register New Agent</h1>
                        <p className={styles.subtitle}>Add your ERC-8004 compliant agent to the Shadow-Galaxy scanner.</p>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Agent Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. SnowRail Liquidity Bot"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Token ID (On-Chain Agent ID)</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="e.g. 8004"
                                    value={formData.agentId}
                                    onChange={(e) => setFormData({ ...formData, agentId: (e.target as HTMLInputElement).value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    placeholder="What does this agent do?"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: (e.target as HTMLTextAreaElement).value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Avatar URL</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: (e.target as HTMLInputElement).value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formData.x402Support}
                                        onChange={(e) => setFormData({ ...formData, x402Support: (e.target as HTMLInputElement).checked })}
                                    />
                                    Enable x402 Payment Support
                                </label>
                            </div>

                            <hr className={styles.divider} />
                            <h3 style={{ color: 'var(--color-primary)', fontSize: '18px', fontWeight: 700 }}>Primary Endpoint</h3>

                            <div className={styles.formGroup}>
                                <label>Endpoint Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.endpoint1Name}
                                    onChange={(e) => setFormData({ ...formData, endpoint1Name: (e.target as HTMLInputElement).value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Endpoint URL</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://agent.example.com/api"
                                    value={formData.endpoint1Url}
                                    onChange={(e) => setFormData({ ...formData, endpoint1Url: (e.target as HTMLInputElement).value })}
                                />
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Registering...' : 'Register Agent'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

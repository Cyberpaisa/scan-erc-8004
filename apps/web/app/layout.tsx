import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '../context/ToastContext';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    title: 'Avalanche Agent Scanner | ERC-8004',
    description: 'Explore and verify AI agents on Avalanche with real-time trust scoring, reputation tracking, and endpoint validation.',
    keywords: ['Avalanche', 'AI Agents', 'ERC-8004', 'Blockchain', 'Trust', 'Reputation'],
    openGraph: {
        title: 'Avalanche Agent Scanner | ERC-8004',
        description: 'Trust-based ecosystem for AI Agents on Avalanche.',
        url: 'https://scanner.shadow-galaxy.xyz',
        siteName: 'Shadow-Galaxy Scanner',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Avalanche Agent Scanner | ERC-8004',
        description: 'Verify AI Agents on Avalanche with ease.',
        images: ['/og-image.png'],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body suppressHydrationWarning>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}

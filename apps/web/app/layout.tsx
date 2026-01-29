import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Avalanche Agent Scanner | ERC-8004',
    description: 'Explore and verify AI agents on Avalanche with trust scoring, reputation tracking, and endpoint validation.',
    keywords: ['Avalanche', 'AI Agents', 'ERC-8004', 'Blockchain', 'Trust', 'Reputation'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body>{children}</body>
        </html>
    );
}

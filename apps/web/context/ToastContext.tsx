'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import styles from './ToastContext.module.css';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    // Ensure we handle client-side rendering only for the portal/container
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {mounted && (
                <div className={styles.toastContainer}>
                    {toasts.map((toast) => (
                        <div key={toast.id} className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}` as keyof typeof styles]}`}>
                            <div className={styles.toastContent}>
                                <span className={styles.toastIcon}>
                                    {toast.type === 'success' && '✓'}
                                    {toast.type === 'error' && '✕'}
                                    {toast.type === 'info' && 'ℹ'}
                                </span>
                                <span className={styles.toastMessage}>{toast.message}</span>
                            </div>
                            <div className={styles.toastProgress}></div>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

/**
 * Centralized API Service for Shadow-Galaxy Web
 * Handles environment-agnostic URLs, error handling, and type safety.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
    data: T;
    error?: string;
}

export const api = {
    async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error(`[API Error] ${endpoint}:`, error.message);
            throw error;
        }
    },

    // Agents
    getAgents: (params?: string) => api.fetch<any>(`/api/v1/agents${params ? `?${params}` : ''}`),
    getAgent: (id: string | number) => api.fetch<any>(`/api/v1/agents/${id}`),
    getAgentFeedback: (id: string | number, limit = 10) =>
        api.fetch<any>(`/api/v1/agents/${id}/feedback?limit=${limit}`),
    validateAgent: (id: string | number) =>
        api.fetch<any>(`/api/v1/agents/${id}/validate`, { method: 'POST' }),
    registerAgent: (data: any) =>
        api.fetch<any>('/api/v1/agents', { method: 'POST', body: JSON.stringify(data) }),

    // Stats
    getStats: () => api.fetch<any>('/api/v1/stats'),
};

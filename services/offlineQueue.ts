
import { API_URL } from './db';

const STORAGE_KEY = 'offline_queue';

interface QueueItem {
    id: string;
    url: string;
    method: string;
    body: any;
    timestamp: number;
}

export const OfflineQueue = {
    getQueue: (): QueueItem[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    },

    enqueue: (url: string, body: any) => {
        const queue = OfflineQueue.getQueue();
        const item: QueueItem = {
            id: crypto.randomUUID(),
            url,
            method: 'POST',
            body,
            timestamp: Date.now()
        };
        queue.push(item);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        console.log('[Offline] Request queued:', url);
    },

    remove: (id: string) => {
        const queue = OfflineQueue.getQueue();
        const updated = queue.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    sync: async () => {
        const queue = OfflineQueue.getQueue();
        if (queue.length === 0) return;

        console.log(`[Offline] Syncing ${queue.length} items...`);

        // Process sequentially to ensure order (especially for sequential data, though surveys are independent)
        for (const item of queue) {
            try {
                const res = await fetch(`${API_URL}${item.url}`, {
                    method: item.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.body)
                });

                if (res.ok) {
                    console.log('[Offline] Synced item:', item.id);
                    OfflineQueue.remove(item.id);
                } else {
                    console.warn('[Offline] Failed to sync item, keeping in queue:', item.id);
                }
            } catch (e) {
                console.error('[Offline] Network error during sync:', e);
                // if network error, stop syncing to avoid spamming
                break;
            }
        }
    }
};

// Wrapper for Fetch that handles offline fallback
export const apiPost = async (endpoint: string, body: any) => {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        // If server returns 500 or 4xx, we assume logic error, NOT connection error, 
        // unless it's a timeout/network failure which throws.
        // However, if server is "down" it might return 502/503.
        // For simple "connection closed", fetch usually throws.

        if (!res.ok && res.status >= 500) {
            throw new Error(`Server Error ${res.status}`);
        }

        return await res.json();
    } catch (e) {
        console.warn('Network Request Failed. Queuing for offline.', e);
        OfflineQueue.enqueue(endpoint, body);
        return { success: true, offline: true }; // Fake success for UI
    }
};

// ============================================================
// AI SERVICE — API Client
// ============================================================

import api from './api';

const aiService = {
    // ── Companions ───────────────────────────────────────────────

    getCompanions: (params = {}) =>
        api.get('/ai/companions', { params }).then(r => r.data),

    getCompanion: (idOrSlug) =>
        api.get(`/ai/companions/${idOrSlug}`).then(r => r.data),

    createCompanion: (data) =>
        api.post('/ai/companions', data).then(r => r.data),

    updateCompanion: (id, data) =>
        api.patch(`/ai/companions/${id}`, data).then(r => r.data),

    deleteCompanion: (id) =>
        api.delete(`/ai/companions/${id}`).then(r => r.data),

    myCompanions: () =>
        api.get('/ai/companions/my/list').then(r => r.data),

    // ── Chat ─────────────────────────────────────────────────────

    sendMessage: (companionId, message) =>
        api.post(`/ai/chat/${companionId}/message`, { message }).then(r => r.data),

    getHistory: (companionId, page = 1, limit = 50) =>
        api.get(`/ai/chat/${companionId}/history`, { params: { page, limit } }).then(r => r.data),

    clearConversation: (companionId) =>
        api.delete(`/ai/chat/${companionId}`).then(r => r.data),

    // ── Subscriptions ────────────────────────────────────────────

    subscribe: (companionId, plan = 'basic') =>
        api.post(`/ai/subscribe/${companionId}`, { plan }).then(r => r.data),

    mySubscriptions: () =>
        api.get('/ai/subscriptions').then(r => r.data),

    cancelSubscription: (companionId) =>
        api.delete(`/ai/subscribe/${companionId}`).then(r => r.data),

    getPlans: () =>
        api.get('/ai/plans').then(r => r.data),

    getWebSocketUrl: (companionId) =>
        api.get('/ai/ws-url', { params: { companionId } }).then(r => r.data),
};

export default aiService;

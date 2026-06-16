const API_URL = '/api/rooms';

// Called when server returns 401 — clears stale session without causing a reload loop
window._handleUnauthorized = () => {
    localStorage.removeItem('rentify_token');
    localStorage.removeItem('rentify_user');
    localStorage.removeItem('rentify_pro');
    // Show landing page without a full page reload
    const app = document.getElementById('appContainer');
    const landing = document.getElementById('landingPage');
    if (app) app.style.display = 'none';
    if (landing) landing.style.display = '';
};

const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('rentify_token');
    return {
        ...extraHeaders,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const api = {
    async getRooms() {
        const res = await fetch(API_URL, { headers: getAuthHeaders() });
        if (res.status === 401) window._handleUnauthorized();
        return res.json();
    },

    async createRoom(data) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async updateRoom(id, data) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async deleteRoom(id) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return res.json();
    },

    async uploadImage(roomId, file) {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_URL}/${roomId}/images`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        return res.json();
    },

    async addVideo(roomId, url) {
        const res = await fetch(`${API_URL}/${roomId}/videos`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ url })
        });
        return res.json();
    },

    // ===== BILLS =====
    async getBills() {
        const res = await fetch('/api/bills', { headers: getAuthHeaders() });
        if (res.status === 401) window._handleUnauthorized();
        return res.json();
    },

    async createBill(data) {
        const res = await fetch('/api/bills', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async updateBill(id, data) {
        const res = await fetch(`/api/bills/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async deleteBill(id) {
        const res = await fetch(`/api/bills/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return res.json();
    },

    async deleteBillsBatch(ids) {
        const res = await fetch('/api/bills/batch', {
            method: 'DELETE',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ ids })
        });
        return res.json();
    },

    // ===== PRESETS =====
    async getPresets() {
        const res = await fetch('/api/presets', { headers: getAuthHeaders() });
        if (res.status === 401) window._handleUnauthorized();
        return res.json();
    },

    async createPreset(data) {
        const res = await fetch('/api/presets', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async updatePreset(id, data) {
        const res = await fetch(`/api/presets/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async deletePreset(id) {
        const res = await fetch(`/api/presets/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return res.json();
    },

    // ===== SUBSCRIPTIONS =====
    async getSubscription() {
        const res = await fetch('/api/subscriptions', { headers: getAuthHeaders() });
        if (res.status === 401) window._handleUnauthorized();
        return res.json();
    },

    async createOrUpdateSubscription(data) {
        const res = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async getProRequests() {
        const res = await fetch('/api/pro-requests', { headers: getAuthHeaders() });
        if (res.status === 401) window._handleUnauthorized();
        return res.json();
    },

    async createProRequest(data) {
        const res = await fetch('/api/pro-requests', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async updateProRequest(id, data) {
        const res = await fetch(`/api/pro-requests/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async markProRequestSeen(id) {
        const res = await fetch(`/api/pro-requests/${id}/seen`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        return res.json();
    },

    async revokeProSubscription(userId, reason) {
        const res = await fetch(`/api/subscriptions/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ reason })
        });
        return res.json();
    },

    async getUserNotifications() {
        const res = await fetch('/api/notifications', { headers: getAuthHeaders() });
        if (res.status === 401) window._handleUnauthorized();
        return res.json();
    },

    async markNotificationRead(id) {
        const res = await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        return res.json();
    }
};

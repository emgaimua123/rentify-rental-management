const API_URL = '/api/rooms';

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
        if (res.status === 401) window.location.href = '/login.html';
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
    }
};

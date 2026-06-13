const API_URL = '/api/rooms';

const api = {
    async getRooms() {
        const res = await fetch(API_URL);
        return res.json();
    },

    async createRoom(data) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async updateRoom(id, data) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async deleteRoom(id) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    async uploadImage(roomId, file) {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_URL}/${roomId}/images`, {
            method: 'POST',
            body: formData
        });
        return res.json();
    },

    async addVideo(roomId, url) {
        const res = await fetch(`${API_URL}/${roomId}/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        return res.json();
    }
};

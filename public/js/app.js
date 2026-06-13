const app = {
    rooms: [],

    async init() {
        await this.loadRooms();
    },

    async loadRooms() {
        try {
            const res = await api.getRooms();
            if (res.success) {
                this.rooms = res.data;
                this.renderRooms();
            } else {
                this.showToast('Lỗi tải danh sách phòng', 'error');
            }
        } catch (e) {
            this.showToast('Mất kết nối server', 'error');
        }
    },

    renderRooms() {
        const grid = document.getElementById('roomGrid');
        grid.innerHTML = '';

        this.rooms.forEach(room => {
            // Lấy ảnh đầu tiên nếu có
            const imgMedia = room.medias && room.medias.find(m => m.type === 'IMAGE');
            const imgSrc = imgMedia ? imgMedia.url : '';

            const card = document.createElement('div');
            card.className = 'room-card';
            
            let imgHTML = '';
            if (imgSrc) {
                imgHTML = `<img src="${imgSrc}" alt="${room.name}">`;
            } else {
                imgHTML = `<div class="room-img-placeholder"><i class='bx bx-image'></i></div>`;
            }

            card.innerHTML = `
                <div class="room-img-container">
                    ${imgHTML}
                    <div class="status-badge status-${room.status}">${room.status}</div>
                </div>
                <div class="room-info">
                    <div class="room-header">
                        <div class="room-title">${room.name}</div>
                    </div>
                    <div class="room-price">${room.price.toLocaleString('vi-VN')} VNĐ</div>
                    <div class="room-meta">
                        <span><i class='bx bx-area'></i> ${room.area || 0} m²</span>
                        <span><i class='bx bx-building-house'></i> ${room.type}</span>
                    </div>
                    <div class="room-actions">
                        <div class="media-count" onclick="app.openMediaModal(${room.id})">
                            <i class='bx bx-camera'></i> ${room.medias ? room.medias.length : 0} Media
                        </div>
                        <div>
                            <button class="btn-icon" onclick="app.openEditModal(${room.id})"><i class='bx bx-edit-alt'></i></button>
                            <button class="btn-icon delete" onclick="app.deleteRoom(${room.id})"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    openCreateModal() {
        document.getElementById('modalTitle').innerText = 'Thêm phòng mới';
        document.getElementById('roomIdInput').value = '';
        document.getElementById('roomForm').reset();
        document.getElementById('roomModal').classList.add('active');
    },

    openEditModal(id) {
        const room = this.rooms.find(r => r.id === id);
        if (!room) return;

        document.getElementById('modalTitle').innerText = 'Chỉnh sửa phòng';
        document.getElementById('roomIdInput').value = room.id;
        document.getElementById('roomName').value = room.name;
        document.getElementById('roomPrice').value = room.price;
        document.getElementById('roomArea').value = room.area;
        document.getElementById('roomType').value = room.type;
        document.getElementById('roomStatus').value = room.status;

        document.getElementById('roomModal').classList.add('active');
    },

    openMediaModal(id) {
        document.getElementById('mediaRoomId').value = id;
        document.getElementById('imageForm').reset();
        document.getElementById('videoForm').reset();
        document.getElementById('mediaModal').classList.add('active');
    },

    closeModals() {
        document.getElementById('roomModal').classList.remove('active');
        document.getElementById('mediaModal').classList.remove('active');
    },

    switchMediaTab(type) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        if (type === 'image') {
            document.querySelectorAll('.tab-btn')[0].classList.add('active');
            document.getElementById('tabImage').classList.add('active');
        } else {
            document.querySelectorAll('.tab-btn')[1].classList.add('active');
            document.getElementById('tabVideo').classList.add('active');
        }
    },

    async handleRoomSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('roomIdInput').value;
        const data = {
            name: document.getElementById('roomName').value,
            price: Number(document.getElementById('roomPrice').value),
            area: Number(document.getElementById('roomArea').value),
            type: document.getElementById('roomType').value,
            status: document.getElementById('roomStatus').value
        };

        try {
            let res;
            if (id) {
                res = await api.updateRoom(id, data);
            } else {
                res = await api.createRoom(data);
            }

            if (res.success) {
                this.showToast(id ? 'Cập nhật thành công!' : 'Tạo phòng thành công!', 'success');
                this.closeModals();
                this.loadRooms();
            } else {
                this.showToast(res.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (err) {
            this.showToast('Lỗi kết nối', 'error');
        }
    },

    async handleImageUpload(e) {
        e.preventDefault();
        const id = document.getElementById('mediaRoomId').value;
        const fileInput = document.getElementById('roomImage');
        
        if (fileInput.files.length === 0) return;

        try {
            const res = await api.uploadImage(id, fileInput.files[0]);
            if (res.success) {
                this.showToast('Tải ảnh lên thành công', 'success');
                this.closeModals();
                this.loadRooms();
            } else {
                this.showToast(res.message, 'error');
            }
        } catch (err) {
            this.showToast('Lỗi kết nối', 'error');
        }
    },

    async handleVideoSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('mediaRoomId').value;
        const url = document.getElementById('videoUrl').value;

        try {
            const res = await api.addVideo(id, url);
            if (res.success) {
                this.showToast('Thêm link video thành công', 'success');
                this.closeModals();
                this.loadRooms();
            } else {
                this.showToast(res.message, 'error');
            }
        } catch (err) {
            this.showToast('Lỗi kết nối', 'error');
        }
    },

    async deleteRoom(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
        
        try {
            const res = await api.deleteRoom(id);
            if (res.success) {
                this.showToast('Đã xóa phòng', 'success');
                this.loadRooms();
            } else {
                this.showToast(res.message, 'error');
            }
        } catch (err) {
            this.showToast('Lỗi kết nối', 'error');
        }
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 'error-circle';
        
        toast.innerHTML = `
            <i class='bx bx-${icon}'></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Khởi tạo app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

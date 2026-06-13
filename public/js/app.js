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
            const imgMedia = room.medias && room.medias.find(m => m.type === 'IMAGE');
            const imgSrc = imgMedia ? imgMedia.url : '';

            const card = document.createElement('div');
            card.className = 'room-card';
            // Bấm vào card sẽ mở preview
            card.onclick = () => this.openPreviewModal(room.id);
            
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
                        <div class="media-count">
                            <i class='bx bx-camera'></i> ${room.medias ? room.medias.length : 0} Media
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
        document.getElementById('saveRoomBtn').disabled = false;
        document.getElementById('saveRoomBtn').innerText = 'Lưu phòng';
    },

    openEditModal(id) {
        // Đóng preview modal trước nếu đang mở
        this.closeModals();
        
        const room = this.rooms.find(r => r.id === id);
        if (!room) return;

        setTimeout(() => {
            document.getElementById('modalTitle').innerText = 'Chỉnh sửa phòng';
            document.getElementById('roomIdInput').value = room.id;
            document.getElementById('roomName').value = room.name;
            document.getElementById('roomPrice').value = room.price;
            document.getElementById('roomArea').value = room.area;
            document.getElementById('roomType').value = room.type;
            document.getElementById('roomStatus').value = room.status;

            document.getElementById('roomModal').classList.add('active');
        }, 100); // Wait for fadeout
    },

    openPreviewModal(id) {
        const room = this.rooms.find(r => r.id === id);
        if (!room) return;

        document.getElementById('previewName').innerText = room.name;
        document.getElementById('previewPrice').innerText = `${room.price.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('previewArea').innerText = `${room.area} m²`;
        document.getElementById('previewType').innerText = room.type;
        
        const badge = document.getElementById('previewStatus');
        badge.innerText = room.status;
        badge.className = `status-badge status-${room.status}`;

        // Render Media
        const gallery = document.getElementById('previewGallery');
        gallery.innerHTML = '';
        
        if (room.medias && room.medias.length > 0) {
            room.medias.forEach(media => {
                if (media.type === 'IMAGE') {
                    gallery.innerHTML += `<img src="${media.url}" class="media-item">`;
                } else if (media.type === 'VIDEO') {
                    // Đơn giản hóa: Hiện link. Có thể đổi thành iframe youtube sau
                    gallery.innerHTML += `
                        <div class="media-item" style="background:#333; display:flex; align-items:center; justify-content:center; color:white;">
                            <a href="${media.url}" target="_blank" style="color:white; text-decoration:none;"><i class='bx bx-play-circle' style="font-size:3rem"></i></a>
                        </div>
                    `;
                }
            });
        } else {
            gallery.innerHTML = `<div style="grid-column: span 2; display:flex; align-items:center; justify-content:center; color:#6b7280; font-size:4rem;"><i class='bx bx-image'></i></div>`;
        }

        // Setup Buttons
        document.getElementById('btnEditRoom').onclick = () => this.openEditModal(room.id);
        document.getElementById('btnDeleteRoom').onclick = () => this.deleteRoom(room.id);

        document.getElementById('previewModal').classList.add('active');
    },

    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    },

    async handleRoomSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('saveRoomBtn');
        btn.disabled = true;
        btn.innerText = 'Đang xử lý...';
        
        const id = document.getElementById('roomIdInput').value;
        const data = {
            name: document.getElementById('roomName').value,
            price: Number(document.getElementById('roomPrice').value),
            area: Number(document.getElementById('roomArea').value),
            type: document.getElementById('roomType').value,
            status: document.getElementById('roomStatus').value
        };

        try {
            // Bước 1: Lưu Room
            let res;
            if (id) {
                res = await api.updateRoom(id, data);
            } else {
                res = await api.createRoom(data);
            }

            if (!res.success) {
                this.showToast(res.message || 'Lỗi lưu phòng', 'error');
                btn.disabled = false;
                btn.innerText = 'Lưu phòng';
                return;
            }

            const roomId = id || res.data.id; // Nếu tạo mới, lấy ID từ response

            // Bước 2: Tải lên Ảnh
            const files = document.getElementById('roomImages').files;
            if (files && files.length > 0) {
                this.showToast('Đang tải ảnh lên...', 'success');
                for (let i = 0; i < files.length; i++) {
                    await api.uploadImage(roomId, files[i]);
                }
            }

            // Bước 3: Lưu Video URL
            const videoUrl = document.querySelector('.video-url-input').value;
            if (videoUrl && videoUrl.trim() !== '') {
                await api.addVideo(roomId, videoUrl.trim());
            }

            this.showToast('Thao tác thành công!', 'success');
            this.closeModals();
            this.loadRooms();
        } catch (err) {
            this.showToast('Lỗi kết nối', 'error');
            btn.disabled = false;
            btn.innerText = 'Lưu phòng';
        }
    },

    async deleteRoom(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
        
        try {
            const res = await api.deleteRoom(id);
            if (res.success) {
                this.showToast('Đã xóa phòng', 'success');
                this.closeModals();
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

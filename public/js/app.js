window.logout = () => {
    localStorage.removeItem('rentify_token');
    localStorage.removeItem('rentify_user');
    window.location.reload();
};

const app = {
    originalRooms: [],
    rooms: [],
    currentSort: 'default',
    captchaCode: '',

    async init() {
        if (!localStorage.getItem('rentify_token')) {
            document.getElementById('landingPage').style.display = 'flex';
            document.getElementById('appContainer').style.display = 'none';
            if (window.i18n) window.i18n.init();
            return;
        }
        document.getElementById('landingPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Theme init
        const savedTheme = localStorage.getItem('rentify_theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('rentify_theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('rentify_theme', 'dark');
            }
        });

        // Language init
        window.addEventListener('languageChanged', () => {
            this.renderRooms();
            this.updateGreeting();
        });
        
        // initialize i18n
        if (window.i18n) {
            window.i18n.init();
        }
        
        // Cập nhật thông tin User trên Topbar
        try {
            const userStr = localStorage.getItem('rentify_user');
            if (userStr) {
                const u = JSON.parse(userStr);
                if (u.avatar) document.getElementById('topbarAvatar').src = u.avatar;
                if (u.name) document.getElementById('topbarName').textContent = u.name;
            }
        } catch(e) {}

        this.updateGreeting();
        await this.loadRooms();

        // Event listener cho dropdown Trạng thái phòng
        document.getElementById('roomStatus').addEventListener('change', (e) => {
            const contractSection = document.getElementById('contractSection');
            if (e.target.value === 'Occupied') {
                contractSection.style.display = 'block';
            } else {
                contractSection.style.display = 'none';
            }
        });

        // Setup menu navigation
        const menuItems = document.querySelectorAll('#sidebarMenu a[data-section]');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class
                menuItems.forEach(i => i.classList.remove('active'));
                // Add active class
                item.classList.add('active');
                
                // Hide all sections
                document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
                
                // Show target section
                const targetId = item.getAttribute('data-section');
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
        });

        // Event listeners for multi-room preview
        ['multiPrefix', 'letterFrom', 'letterTo', 'numberFrom', 'numberTo'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', () => this.updateMultiRoomPreview());
        });
    },

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Chào bạn';
        let icon = "<i class='bx bx-sun'></i>";
        
        if (hour >= 5 && hour < 12) {
            greeting = 'Chào buổi sáng';
            icon = "<i class='bx bx-sun'></i>";
        } else if (hour >= 12 && hour < 18) {
            greeting = 'Chào buổi chiều';
            icon = "<i class='bx bx-cloud'></i>";
        } else {
            greeting = 'Chào buổi tối';
            icon = "<i class='bx bx-moon'></i>";
        }

        const userName = 'Admin'; // Hardcoded for now, can be fetched from profile
        const greetingElement = document.getElementById('greetingTitle');
        if (greetingElement) {
            if (window.i18n && window.i18n.lang === 'en') {
                if (hour >= 5 && hour < 12) greeting = 'Good morning';
                else if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
                else greeting = 'Good evening';
            }
            greetingElement.innerHTML = `${greeting} ${icon} ${userName}!`;
        }
    },

    switchTab(tabId) {
        document.getElementById('roomDashboard').style.display = 'none';
        document.getElementById('billDashboard').style.display = 'none';
        
        document.getElementById(tabId).style.display = 'block';

        // Update active class on menu
        document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
        if (tabId === 'roomDashboard') {
            document.getElementById('menuOverview').classList.add('active');
        } else if (tabId === 'billDashboard') {
            document.getElementById('menuBills').classList.add('active');
            if(window.billApp) window.billApp.renderBills();
        }
    },

    async loadRooms() {
        try {
            const res = await api.getRooms();
            if (res.success) {
                this.originalRooms = [...res.data];
                this.rooms = [...res.data];
                this.applySort();
                this.renderRooms();
            } else {
                this.showToast('Lỗi tải danh sách phòng', 'error');
            }
        } catch (e) {
            this.showToast('Mất kết nối server', 'error');
        }
    },

    sortRooms(order) {
        this.currentSort = order;
        this.applySort();
        this.renderRooms();
    },

    applySort() {
        if (!this.currentSort || this.currentSort === 'default') {
            if (this.originalRooms) {
                this.rooms = [...this.originalRooms];
            }
            return;
        }

        const extractIdentifier = (name) => {
            // Remove common prefixes like "Phòng", "Room", "Phong"
            return name.replace(/^(phòng|phong|room)\s*/i, '').trim();
        };

        this.rooms.sort((a, b) => {
            const idA = extractIdentifier(a.name);
            const idB = extractIdentifier(b.name);
            
            // numeric: true allows natural sorting (e.g. 2 before 10)
            const cmp = idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
            return this.currentSort === 'name_asc' ? cmp : -cmp;
        });
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
                    <input type="checkbox" class="room-checkbox" data-id="${room.id}" onclick="event.stopPropagation(); app.updateSelection()" style="position: absolute; top: 10px; left: 10px; z-index: 10; width: 20px; height: 20px; cursor: pointer;">
                    ${imgHTML}
                    <div class="status-badge status-${room.status}">${window.i18n ? window.i18n.t('status.' + room.status) : room.status}</div>
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
        this.updateSelection();
    },

    openCreateModal() {
        document.getElementById('modalTitle').innerText = 'Thêm phòng mới';
        document.getElementById('roomIdInput').value = '';
        document.getElementById('roomForm').reset();
        
        document.getElementById('contractSection').style.display = 'none';

        document.getElementById('roomModal').classList.add('active');
        document.getElementById('saveRoomBtn').disabled = false;
        document.getElementById('saveRoomBtn').innerText = 'Lưu phòng';
    },

    openCreateMultipleModal() {
        document.getElementById('multiRoomForm').reset();
        document.getElementById('letterRangeInputs').style.display = 'none';
        document.getElementById('numberRangeInputs').style.display = 'flex';
        document.getElementById('useLetterRange').checked = false;
        document.getElementById('useNumberRange').checked = true;
        document.getElementById('multiRoomPreview').innerText = 'Nhập thông tin để xem trước...';
        
        document.getElementById('multiRoomModal').classList.add('active');
        document.getElementById('saveMultiRoomBtn').disabled = false;
        document.getElementById('saveMultiRoomBtn').innerText = 'Tạo danh sách phòng';
    },

    toggleLetterRange(checked) {
        document.getElementById('letterRangeInputs').style.display = checked ? 'flex' : 'none';
        this.updateMultiRoomPreview();
    },

    toggleNumberRange(checked) {
        document.getElementById('numberRangeInputs').style.display = checked ? 'flex' : 'none';
        this.updateMultiRoomPreview();
    },

    generateRoomNames() {
        const prefix = document.getElementById('multiPrefix').value || '';
        const useLetter = document.getElementById('useLetterRange').checked;
        const useNumber = document.getElementById('useNumberRange').checked;
        
        let letters = [''];
        if (useLetter) {
            let from = document.getElementById('letterFrom').value.toUpperCase();
            let to = document.getElementById('letterTo').value.toUpperCase();
            if (from && to && from <= to) {
                letters = [];
                for (let i = from.charCodeAt(0); i <= to.charCodeAt(0); i++) {
                    letters.push(String.fromCharCode(i));
                }
            } else {
                return [];
            }
        }
        
        let numbers = [''];
        if (useNumber) {
            let from = parseInt(document.getElementById('numberFrom').value);
            let to = parseInt(document.getElementById('numberTo').value);
            if (!isNaN(from) && !isNaN(to) && from <= to) {
                numbers = [];
                for (let i = from; i <= to; i++) {
                    numbers.push(i.toString());
                }
            } else {
                return [];
            }
        }
        
        let names = [];
        for (let l of letters) {
            for (let n of numbers) {
                names.push(`${prefix}${l}${n}`.trim());
            }
        }
        return names.filter(n => n !== '');
    },

    updateMultiRoomPreview() {
        const names = this.generateRoomNames();
        const preview = document.getElementById('multiRoomPreview');
        if (!document.getElementById('multiPrefix').value) {
            preview.innerText = 'Vui lòng nhập tiền tố...';
            return;
        }
        if (names.length === 0) {
            preview.innerText = 'Phạm vi chữ cái hoặc số không hợp lệ.';
            return;
        }
        if (names.length > 50) {
            preview.innerText = `Sẽ tạo ${names.length} phòng: ${names.slice(0, 10).join(', ')}... (và ${names.length - 10} phòng khác)`;
        } else {
            preview.innerText = `Sẽ tạo ${names.length} phòng: ${names.join(', ')}`;
        }
    },

    async handleMultiRoomSubmit(e) {
        e.preventDefault();
        const names = this.generateRoomNames();
        if (names.length === 0) {
            this.showToast('Không có phòng nào được tạo. Kiểm tra lại thông tin.', 'error');
            return;
        }

        const btn = document.getElementById('saveMultiRoomBtn');
        btn.disabled = true;
        btn.innerText = 'Đang xử lý...';

        const price = Number(document.getElementById('multiRoomPrice').value);
        const area = Number(document.getElementById('multiRoomArea').value);
        const type = document.getElementById('multiRoomType').value;

        let successCount = 0;
        let errorCount = 0;

        for (const name of names) {
            const data = {
                name: name,
                price: price,
                area: area,
                type: type,
                status: 'Available'
            };
            try {
                const res = await api.createRoom(data);
                if (res.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (err) {
                errorCount++;
            }
        }

        this.showToast(`Đã tạo thành công ${successCount} phòng. Lỗi: ${errorCount}`, successCount > 0 ? 'success' : 'error');
        this.closeModals();
        this.loadRooms();
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

            if (room.status === 'Occupied' && room.contracts && room.contracts.length > 0) {
                document.getElementById('contractSection').style.display = 'block';
                const c = room.contracts[0];
                document.getElementById('tenantName').value = c.tenantName;
                document.getElementById('tenantCount').value = c.tenantCount;
                document.getElementById('contractStart').value = c.startDate.split('T')[0];
                document.getElementById('contractEnd').value = c.endDate.split('T')[0];
            } else {
                document.getElementById('contractSection').style.display = 'none';
                document.getElementById('tenantName').value = '';
                document.getElementById('tenantCount').value = '1';
                document.getElementById('contractStart').value = '';
                document.getElementById('contractEnd').value = '';
            }

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

        if (room.status === 'Occupied' && room.contracts && room.contracts.length > 0) {
            const c = room.contracts[0];
            document.getElementById('previewContractSection').style.display = 'block';
            document.getElementById('previewTenantName').innerText = c.tenantName;
            document.getElementById('previewTenantCount').innerText = c.tenantCount + ' người';
            document.getElementById('previewStartDate').innerText = new Date(c.startDate).toLocaleDateString('vi-VN');
            document.getElementById('previewEndDate').innerText = new Date(c.endDate).toLocaleDateString('vi-VN');
        } else {
            document.getElementById('previewContractSection').style.display = 'none';
        }

        // Render Media
        const gallery = document.getElementById('previewGallery');
        gallery.innerHTML = '';
        
        if (room.medias && room.medias.length > 0) {
            room.medias.forEach(media => {
                if (media.type === 'IMAGE') {
                    gallery.innerHTML += `<img src="${media.url}" class="media-item">`;
                } else if (media.type === 'VIDEO') {
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

        if (data.status === 'Occupied') {
            data.tenantName = document.getElementById('tenantName').value;
            data.tenantCount = Number(document.getElementById('tenantCount').value);
            data.startDate = document.getElementById('contractStart').value;
            data.endDate = document.getElementById('contractEnd').value;
        }

        try {
            // Bước 1: Lưu Room & Contract
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

            const roomId = id || res.data.id; 

            // Bước 2: Tải lên Ảnh
            const files = document.getElementById('roomImages').files;
            if (files && files.length > 0) {
                this.showToast('Đang tải ảnh/video lên...', 'success');
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

    updateSelection() {
        const checkboxes = document.querySelectorAll('.room-checkbox:checked');
        const count = checkboxes.length;
        const btn = document.getElementById('btnDeleteSelected');
        const countSpan = document.getElementById('selectedCount');
        
        if (count > 0) {
            btn.style.display = 'inline-flex';
            countSpan.innerText = count;
        } else {
            btn.style.display = 'none';
        }
    },

    async deleteSelectedRooms() {
        const checkboxes = document.querySelectorAll('.room-checkbox:checked');
        if (checkboxes.length === 0) return;
        
        if (!confirm(`Bạn có chắc chắn muốn xóa ${checkboxes.length} phòng đã chọn?`)) return;
        
        let successCount = 0;
        let errorCount = 0;
        
        const btn = document.getElementById('btnDeleteSelected');
        btn.disabled = true;
        btn.innerText = 'Đang xóa...';
        
        for (const cb of checkboxes) {
            const id = cb.getAttribute('data-id');
            try {
                const res = await api.deleteRoom(id);
                if (res.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (err) {
                errorCount++;
            }
        }
        
        this.showToast(`Đã xóa ${successCount} phòng. Lỗi: ${errorCount}`, successCount > 0 ? 'success' : 'error');
        btn.disabled = false;
        btn.innerHTML = `<i class='bx bx-trash'></i> Xóa đã chọn (<span id="selectedCount">0</span>)`;
        btn.style.display = 'none';
        this.loadRooms();
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
    },

    // --- AUTH LOGIC ---
    openLoginModal() {
        this.closeAuthModals();
        document.getElementById('authLoginModal').classList.add('active');
    },
    openRegisterModal() {
        this.closeAuthModals();
        document.getElementById('authRegisterModal').classList.add('active');
        this.generateCaptcha();
    },
    closeAuthModals() {
        document.getElementById('authLoginModal').classList.remove('active');
        document.getElementById('authRegisterModal').classList.remove('active');
    },
    generateCaptcha() {
        const canvas = document.getElementById('captchaCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let captcha = '';
        for (let i = 0; i < 5; i++) captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        this.captchaCode = captcha;
        
        // Background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Text
        ctx.font = '24px Inter';
        ctx.fillStyle = '#4f46e5';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // Draw with some noise
        for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.translate(20 + i * 20, 20);
            const rot = (Math.random() - 0.5) * 0.4;
            ctx.rotate(rot);
            ctx.fillText(captcha[i], 0, 0);
            ctx.restore();
        }
    },
    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('rentify_token', data.data.token);
                localStorage.setItem('rentify_user', JSON.stringify(data.data));
                window.location.reload();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (err) {
            this.showToast('Lỗi kết nối', 'error');
        }
    },
    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const email = document.getElementById('regEmail').value;
        const captchaInput = document.getElementById('regCaptcha').value;

        if (captchaInput.toLowerCase() !== this.captchaCode.toLowerCase()) {
            this.showToast('Mã CAPTCHA không chính xác!', 'error');
            this.generateCaptcha();
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, name: username })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('rentify_token', data.data.token);
                localStorage.setItem('rentify_user', JSON.stringify(data.data));
                
                // Show profile required popup
                this.closeAuthModals();
                document.getElementById('landingPage').style.display = 'none';
                document.getElementById('appContainer').style.display = 'flex';
                document.getElementById('profileRequiredModal').classList.add('active');
                
                // Initialize app to load sidebar and layout
                this.init();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (err) {
            this.showToast('Lỗi kết nối', 'error');
        }
    },
    goToProfile() {
        document.getElementById('profileRequiredModal').classList.remove('active');
        document.querySelector('[data-section="appSectionSettings"]').click();
        this.showToast('Mời bạn cập nhật hồ sơ cá nhân.', 'success');
    }
};

// Khởi tạo app
window.app = app;
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

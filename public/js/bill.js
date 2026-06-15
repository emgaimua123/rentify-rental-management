const billApp = {
    presets: [],
    bills: [],
    selectedBills: new Set(),

    init() {
        // Load data from localStorage
        const storedPresets = localStorage.getItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_presets_temp' : 'rentify_presets'));
        if (storedPresets) this.presets = JSON.parse(storedPresets);

        const storedBills = localStorage.getItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills'));
        if (storedBills) this.bills = JSON.parse(storedBills);

        this.renderBills();
    },

    /* --- PRESETS --- */
    openPresetModal() {
        if (window.app && !window.app.isPro()) {
            window.app.openPlanModal();
            window.app.showToast('Tính năng preset giá chỉ dành cho Pro!', 'error');
            return;
        }
        this.renderPresets();
        this.resetPresetForm();
        document.getElementById('pricePresetModal').classList.add('active');
    },

    renderPresets() {
        const list = document.getElementById('presetList');
        list.innerHTML = '';
        this.presets.forEach(p => {
            const div = document.createElement('div');
            div.className = 'preset-card';
            div.innerHTML = `${p.name} <i class='bx bx-x' style="margin-left:5px; cursor:pointer;" onclick="event.stopPropagation(); billApp.deletePreset('${p.id}')"></i>`;
            div.onclick = () => this.editPreset(p.id);
            list.appendChild(div);
        });
    },

    resetPresetForm() {
        document.getElementById('presetId').value = '';
        document.getElementById('presetForm').reset();
        document.getElementById('extraFeesContainer').innerHTML = '';
    },

    addExtraFeeRow(name = '', price = '') {
        const container = document.getElementById('extraFeesContainer');
        const idx = container.children.length;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
        row.innerHTML = `
            <input type="text" placeholder="Tên khoản phí (VD: Phí vệ sinh)" value="${name}"
                style="flex:2; padding:0.5rem 0.75rem; border:1px solid var(--border-color); border-radius:8px; background:var(--card-bg); color:var(--text-color); font-size:0.875rem;" class="extra-fee-name">
            <input type="number" placeholder="Giá (VNĐ)" value="${price}" min="0"
                style="flex:1; padding:0.5rem 0.75rem; border:1px solid var(--border-color); border-radius:8px; background:var(--card-bg); color:var(--text-color); font-size:0.875rem;" class="extra-fee-price">
            <button type="button" onclick="this.parentElement.remove()" style="background:var(--danger); border:none; color:#fff; border-radius:8px; padding:0.4rem 0.6rem; cursor:pointer;">
                <i class='bx bx-trash'></i>
            </button>
        `;
        container.appendChild(row);
    },

    collectExtraFees() {
        const rows = document.querySelectorAll('#extraFeesContainer > div');
        const fees = [];
        rows.forEach(row => {
            const nameEl = row.querySelector('.extra-fee-name');
            const priceEl = row.querySelector('.extra-fee-price');
            const name = nameEl ? nameEl.value.trim() : '';
            const price = priceEl ? Number(priceEl.value) || 0 : 0;
            if (name) fees.push({ name, price });
        });
        return fees;
    },

    editPreset(id) {
        const p = this.presets.find(x => x.id === id);
        if (!p) return;
        document.getElementById('presetId').value = p.id;
        document.getElementById('presetName').value = p.name;
        document.getElementById('presetElectricPrice').value = p.electricPrice;
        document.getElementById('presetWaterPrice').value = p.waterPrice;
        document.getElementById('presetManagementFee').value = p.managementFee;
        document.getElementById('presetInternetFee').value = p.internetFee;
        document.getElementById('presetParkingFee').value = p.parkingFee;
        // Restore extra fees
        document.getElementById('extraFeesContainer').innerHTML = '';
        (p.extraFees || []).forEach(f => this.addExtraFeeRow(f.name, f.price));
    },

    savePreset(e) {
        e.preventDefault();
        const id = document.getElementById('presetId').value;
        const presetData = {
            id: id || 'preset_' + Date.now(),
            name: document.getElementById('presetName').value,
            electricPrice: Number(document.getElementById('presetElectricPrice').value) || 0,
            waterPrice: Number(document.getElementById('presetWaterPrice').value) || 0,
            managementFee: Number(document.getElementById('presetManagementFee').value) || 0,
            internetFee: Number(document.getElementById('presetInternetFee').value) || 0,
            parkingFee: Number(document.getElementById('presetParkingFee').value) || 0,
            extraFees: this.collectExtraFees()
        };

        if (id) {
            const idx = this.presets.findIndex(x => x.id === id);
            if(idx > -1) this.presets[idx] = presetData;
        } else {
            this.presets.push(presetData);
        }

        localStorage.setItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_presets_temp' : 'rentify_presets'), JSON.stringify(this.presets));
        if (window.app && window.app.showToast) {
            window.app.showToast('Lưu Preset thành công!');
        }
        this.closeModals();
        this.renderPresets();
        this.resetPresetForm();
    },

    deletePreset(id) {
        const doDelete = () => {
            this.presets = this.presets.filter(x => x.id !== id);
            localStorage.setItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_presets_temp' : 'rentify_presets'), JSON.stringify(this.presets));
            this.renderPresets();
        };
        if (window.app && window.app.showConfirmDialog) {
            window.app.showConfirmDialog('Xóa preset này?', 'Xóa Preset', doDelete);
        } else {
            if (confirm('Xóa preset này?')) doDelete();
        }
    },

    /* --- BILL CREATION --- */
    async openBillModal() {
        // Reset form
        const t = key => window.i18n ? window.i18n.t(key) : null;
        document.getElementById('billRoomSelect').innerHTML = `<option value="">${t('bill.loading_rooms') || '-- Đang tải phòng... --'}</option>`;
        document.getElementById('billPresetSelect').innerHTML = `<option value="">${t('bill.preset_placeholder') || '-- Tự nhập tay --'}</option>`;

        // Fetch fresh rooms from API
        try {
            const res = await api.getRooms();
            if (res.success && window.app) {
                window.app.rooms = res.data;
            }
        } catch(e) {}

        // Populate Rooms (Occupied only)
        document.getElementById('billRoomSelect').innerHTML = `<option value="">${t('bill.select_room_placeholder') || '-- Chọn phòng --'}</option>`;
        const allRooms = (window.app && window.app.rooms) ? window.app.rooms : [];
        const occupiedRooms = allRooms.filter(r => r.status === 'Occupied');
        if (occupiedRooms.length === 0) {
            document.getElementById('billRoomSelect').innerHTML = `<option value="">${t('bill.no_occupied_rooms') || '-- Không có phòng đang thuê --'}</option>`;
        } else {
            occupiedRooms.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                let tenant = r.contracts && r.contracts.length > 0 ? r.contracts[0].tenantName : '';
                opt.text = `${r.name} ${tenant ? '(' + tenant + ')' : ''}`;
                document.getElementById('billRoomSelect').appendChild(opt);
            });
        }

        // Populate Presets
        this.presets.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.text = p.name;
            document.getElementById('billPresetSelect').appendChild(opt);
        });

        // Set default Month
        const now = new Date();
        document.getElementById('bpMonth').innerText = i18n ? i18n.t('bill.month_year_format').replace('{month}', now.getMonth() + 1).replace('{year}', now.getFullYear()) : `Tháng ${now.getMonth() + 1} Năm ${now.getFullYear()}`;

        // Reset values
        document.querySelectorAll('.bill-form-side input[type="number"]').forEach(el => el.value = '');
        document.querySelectorAll('.bill-form-side input[type="checkbox"]').forEach(el => el.checked = false);
        document.getElementById('billElectricNum').value = '0';
        document.getElementById('billWaterTotal').value = '0';
        document.getElementById('billWaterVolume').value = '0';
        document.getElementById('billParkingCount').value = '1';
        const rcField = document.getElementById('billRoomCharge');
        if (rcField) rcField.value = '';

        document.getElementById('waterModeTotal').checked = true;
        this.toggleWaterMode();

        this.calculateBill();
        document.getElementById('billModal').classList.add('active');
    },

    onRoomSelect() {
        const roomId = document.getElementById('billRoomSelect').value;
        if (roomId && window.app && window.app.rooms) {
            const r = window.app.rooms.find(x => String(x.id) === String(roomId));
            if (r) {
                // Tự động điền tiền phòng từ giá phòng đã cài
                const rcField = document.getElementById('billRoomCharge');
                if (rcField) {
                    rcField.value = r.price || 0;
                }
            }
        }
        this.calculateBill();
    },

    onPresetSelect() {
        const pid = document.getElementById('billPresetSelect').value;
        if (!pid) return;
        const p = this.presets.find(x => x.id === pid);
        if (p) {
            // Không đụng vào tiền phòng - giữ nguyên giá phòng đã chọn
            document.getElementById('billElectricPrice').value = p.electricPrice;
            document.getElementById('billWaterPrice').value = p.waterPrice;
            document.getElementById('billManagementFee').value = p.managementFee;
            document.getElementById('billInternetFee').value = p.internetFee;
            document.getElementById('billParkingFee').value = p.parkingFee;
            
            // Auto check checkboxes if value > 0
            document.getElementById('chkManagement').checked = p.managementFee > 0;
            document.getElementById('chkInternet').checked = p.internetFee > 0;
            document.getElementById('chkParking').checked = p.parkingFee > 0;
            
            this.calculateBill();
        }
    },

    toggleWaterMode() {
        const isTotal = document.getElementById('waterModeTotal').checked;
        document.getElementById('waterTotalDiv').style.display = isTotal ? 'flex' : 'none';
        document.getElementById('waterVolumeDiv').style.display = isTotal ? 'none' : 'flex';
        this.calculateBill();
    },

    calculateBill() {
        // Room
        const roomId = document.getElementById('billRoomSelect').value;
        let roomPrice = 0;
        let roomName = '...';
        let tenantName = '...';

        if (roomId && window.app && window.app.rooms) {
            const r = window.app.rooms.find(x => String(x.id) === String(roomId));
            if (r) {
                roomPrice = r.price || 0;
                roomName = r.name;
                tenantName = r.contracts && r.contracts.length > 0 ? r.contracts[0].tenantName : 'N/A';
            }
        }
        
        document.getElementById('bpRoomName').innerText = roomName;
        document.getElementById('bpTenantName').innerText = tenantName;
        
        // Tiền phòng: đọc trực tiếp từ ô nhập
        const finalRoomPrice = Number(document.getElementById('billRoomCharge').value) || 0;
        document.getElementById('bpRoomPrice').innerText = finalRoomPrice.toLocaleString('vi-VN') + 'đ';
        roomPrice = finalRoomPrice;

        // Electric
        const eNum = Number(document.getElementById('billElectricNum').value) || 0;
        const ePrice = Number(document.getElementById('billElectricPrice').value) || 0;
        const eTotal = eNum * ePrice;
        const eUnit = window.i18n ? window.i18n.t('bill.electric_unit') : 'số';
        document.getElementById('bpElectricDesc').innerText = `${eNum} ${eUnit} x ${ePrice.toLocaleString('vi-VN')}đ`;
        document.getElementById('bpElectricTotal').innerText = eTotal.toLocaleString('vi-VN') + 'đ';

        // Water
        const isTotalWater = document.getElementById('waterModeTotal').checked;
        let wTotal = 0;
        if (isTotalWater) {
            wTotal = Number(document.getElementById('billWaterTotal').value) || 0;
            document.getElementById('bpWaterDesc').innerText = window.i18n ? window.i18n.t('bill.water_flat') : 'Khoán / Tự nhập';
        } else {
            const wVol = Number(document.getElementById('billWaterVolume').value) || 0;
            const wPrice = Number(document.getElementById('billWaterPrice').value) || 0;
            wTotal = wVol * wPrice;
            const wUnit = window.i18n ? window.i18n.t('bill.water_unit') : 'khối';
            document.getElementById('bpWaterDesc').innerText = `${wVol} ${wUnit} x ${wPrice.toLocaleString('vi-VN')}đ`;
        }
        document.getElementById('bpWaterTotal').innerText = wTotal.toLocaleString('vi-VN') + 'đ';

        // Services
        let mTotal = 0;
        if (document.getElementById('chkManagement').checked) {
            mTotal = Number(document.getElementById('billManagementFee').value) || 0;
            document.getElementById('trManagement').style.display = 'table-row';
            document.getElementById('bpManagementFee').innerText = mTotal.toLocaleString('vi-VN') + 'đ';
        } else {
            document.getElementById('trManagement').style.display = 'none';
        }

        let iTotal = 0;
        if (document.getElementById('chkInternet').checked) {
            iTotal = Number(document.getElementById('billInternetFee').value) || 0;
            document.getElementById('trInternet').style.display = 'table-row';
            document.getElementById('bpInternetFee').innerText = iTotal.toLocaleString('vi-VN') + 'đ';
        } else {
            document.getElementById('trInternet').style.display = 'none';
        }

        let pTotal = 0;
        if (document.getElementById('chkParking').checked) {
            const pCount = Number(document.getElementById('billParkingCount').value) || 0;
            const pPrice = Number(document.getElementById('billParkingFee').value) || 0;
            pTotal = pCount * pPrice;
            document.getElementById('trParking').style.display = 'table-row';
            const vUnit = window.i18n ? window.i18n.t('bill.vehicle_unit') : 'xe';
            document.getElementById('bpParkingDesc').innerText = `${pCount} ${vUnit} x ${pPrice.toLocaleString('vi-VN')}đ`;
            document.getElementById('bpParkingTotal').innerText = pTotal.toLocaleString('vi-VN') + 'đ';
        } else {
            document.getElementById('trParking').style.display = 'none';
        }

        // Grand Total
        const grandTotal = roomPrice + eTotal + wTotal + mTotal + iTotal + pTotal;
        document.getElementById('bpGrandTotal').innerText = grandTotal.toLocaleString('vi-VN') + 'đ';

        // Update VietQR
        const qrImg = document.getElementById('bpVietQR');
        if (grandTotal > 0 && roomName !== '...') {
            const bankId = 'MB'; // Hardcode for demo
            const accountNo = '0123456789';
            const template = 'compact';
            const accountName = 'NGUYEN VAN A';
            const description = `Thanh toan tien nha ${roomName.replace(/\s+/g, '')}`;
            
            const baseUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png`;
            const queryParams = new URLSearchParams({
                amount: grandTotal.toString(),
                addInfo: description,
                accountName: accountName
            });
            qrImg.src = `${baseUrl}?${queryParams.toString()}`;
            qrImg.style.display = 'block';
        } else {
            qrImg.style.display = 'none';
        }
    },

    saveBill() {
        // Check bill limit for free users
        if (window.app && !window.app.isPro()) {
            const bills = JSON.parse(localStorage.getItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills')) || '[]');
            if (bills.length >= 5) {
                window.app.openPlanModal();
                window.app.showToast('Bản Free tối đa 5 hóa đơn. Nâng cấp Pro!', 'error');
                return;
            }
        }
        const roomId = document.getElementById('billRoomSelect').value;
        if (!roomId) {
            alert('Vui lòng chọn phòng!');
            return;
        }

        // Capture HTML of the bill
        const htmlContent = document.getElementById('billPaperPreview').innerHTML;
        const grandTotalText = document.getElementById('bpGrandTotal').innerText;
        const roomName = document.getElementById('bpRoomName').innerText;
        
        const now = new Date();
        const monthText = i18n ? i18n.t('bill.month_year_format').replace('{month}', now.getMonth() + 1).replace('{year}', now.getFullYear()) : `Tháng ${now.getMonth() + 1} Năm ${now.getFullYear()}`;

        const newBill = {
            id: 'bill_' + Date.now(),
            roomId,
            roomName,
            month: monthText,
            total: grandTotalText,
            paid: false,
            dateCreated: new Date().toISOString(),
            html: htmlContent
        };

        this.bills.push(newBill);
        localStorage.setItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills'), JSON.stringify(this.bills));

        if (window.app && window.app.showToast) {
            window.app.showToast('Đã lưu hóa đơn!', 'success');
        }
        this.closeModals();
        this.renderBills();
        // Highlight newly created bill
        if (window.app && window.app.highlightBill) {
            window.app.highlightBill(newBill.id);
        }
    },

    /* --- BILL LIST & ACTIONS --- */
    renderBills(billsToRender) {
        const grid = document.getElementById('billGrid');
        grid.innerHTML = '';

        const source = billsToRender || this.bills;

        if (source.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color:var(--text-muted)">${i18n.t('bill.no_bills')}</div>`;
            this.updateMultiSelectUI();
            return;
        }

        // Group by month
        const groups = {};
        [...source]
            .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
            .forEach(bill => {
                const key = bill.month || 'Không xác định';
                if (!groups[key]) groups[key] = [];
                groups[key].push(bill);
            });

        Object.entries(groups).forEach(([month, bills]) => {
            // Month header
            const header = document.createElement('div');
            header.style.cssText = 'grid-column: 1/-1; display:flex; align-items:center; gap:0.75rem; margin-top:1.5rem; margin-bottom:0.25rem;';
            const unpaidCount = bills.filter(b => !b.paid).length;
            const unpaidBadge = unpaidCount > 0
                ? `<span style="background:var(--danger); color:#fff; font-size:0.7rem; padding:2px 8px; border-radius:99px; font-weight:600">${unpaidCount} ${i18n.t('bill.unpaid')}</span>`
                : `<span style="background:#10b981; color:#fff; font-size:0.7rem; padding:2px 8px; border-radius:99px; font-weight:600">✔ ${i18n.t('bill.done')}</span>`;
            header.innerHTML = `
                <span style="font-weight:700; font-size:1rem; color:var(--text-color)">${month}</span>
                ${unpaidBadge}
                <div style="flex:1; height:1px; background:var(--border-color);"></div>
            `;
            grid.appendChild(header);

            // Bill cards
            bills.forEach(bill => {
                const card = document.createElement('div');
                card.className = 'room-card bill-card';
                card.setAttribute('data-bill-id', bill.id);

                const isChecked = this.selectedBills.has(bill.id) ? 'checked' : '';
                const paidStyle = bill.paid
                    ? 'background:#10b981; color:#fff;'
                    : 'background:var(--danger); color:#fff;';
                const paidLabel = bill.paid ? `✔ ${i18n.t('bill.paid')}` : `⏳ ${i18n.t('bill.unpaid')}`;

                card.innerHTML = `
                    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; background:var(--card-header-bg, rgba(0,0,0,0.04));">
                        <div style="display:flex; align-items:center; gap:0.5rem;" onclick="event.stopPropagation()">
                            <input type="checkbox" class="bill-checkbox" data-id="${bill.id}" ${isChecked}
                                onchange="billApp.toggleBillSelection(event, '${bill.id}')" style="transform:scale(1.2)">
                            <strong>${bill.roomName}</strong>
                        </div>
                        <span
                            onclick="event.stopPropagation(); billApp.togglePaid('${bill.id}')"
                            style="${paidStyle} font-size:0.72rem; padding:3px 10px; border-radius:99px; font-weight:600; cursor:pointer; user-select:none;"
                            title="${i18n.t('bill.click_to_toggle')}"
                        >${paidLabel}</span>
                    </div>
                    <div class="room-info" onclick="billApp.viewBill('${bill.id}')" style="cursor:pointer;">
                        <div class="room-price" style="margin-bottom:0.5rem; text-align:center; font-size:1.5rem;">${bill.total}</div>
                        <div style="text-align:center; color:var(--text-muted); font-size:0.875rem;">
                            ${i18n.t('bill.created_at')} ${new Date(bill.dateCreated).toLocaleString('vi-VN')}
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        });

        this.updateMultiSelectUI();
        if (window.app && window.app.renderCharts) window.app.renderCharts();
    },

    togglePaid(id) {
        const bill = this.bills.find(b => b.id === id);
        if (!bill) return;
        bill.paid = !bill.paid;
        localStorage.setItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills'), JSON.stringify(this.bills));
        this.renderBills();
        const label = bill.paid ? (i18n ? i18n.t('bill.marked_paid') : 'Đã đánh dấu là Đã trả') : (i18n ? i18n.t('bill.marked_unpaid') : 'Đã đánh dấu là Còn nợ');
        if (window.app && window.app.showToast) window.app.showToast(label, 'success');
    },


    toggleBillSelection(e, id) {
        if (e.target.checked) {
            this.selectedBills.add(id);
        } else {
            this.selectedBills.delete(id);
        }
        this.updateMultiSelectUI();
    },

    updateMultiSelectUI() {
        const btn = document.getElementById('btnDeleteSelectedBills');
        const countSpan = document.getElementById('selectedBillCount');
        if (this.selectedBills.size > 0) {
            btn.style.display = 'inline-flex';
            countSpan.innerText = this.selectedBills.size;
        } else {
            btn.style.display = 'none';
        }
    },

    deleteSelectedBills() {
        if (this.selectedBills.size === 0) return;
        const doDelete = () => {
            this.bills = this.bills.filter(b => !this.selectedBills.has(b.id));
            localStorage.setItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills'), JSON.stringify(this.bills));
            this.selectedBills.clear();
            if (window.app && window.app.showToast) window.app.showToast('Đã xóa các hóa đơn được chọn', 'success');
            this.renderBills();
        };
        const msg = `Bạn có chắc chắn muốn xóa ${this.selectedBills.size} hóa đơn đã chọn?`;
        if (window.app && window.app.showConfirmDialog) {
            window.app.showConfirmDialog(msg, 'Xóa hóa đơn', doDelete);
        } else {
            if (confirm(msg)) doDelete();
        }
    },

    viewBill(id) {
        const bill = this.bills.find(x => x.id === id);
        if (!bill) return;

        document.getElementById('billExportTarget').innerHTML = bill.html;
        // Keep the id in a global variable for delete/export reference
        this.currentViewBillId = id;

        document.getElementById('billDetailModal').classList.add('active');
    },

    deleteBill() {
        if (!this.currentViewBillId) return;
        const doDelete = () => {
            this.bills = this.bills.filter(b => b.id !== this.currentViewBillId);
            localStorage.setItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills'), JSON.stringify(this.bills));
            if (window.app && window.app.showToast) window.app.showToast('Đã xóa hóa đơn', 'success');
            this.closeModals();
            this.renderBills();
        };
        if (window.app && window.app.showConfirmDialog) {
            window.app.showConfirmDialog('Xóa hóa đơn này?', 'Xóa hóa đơn', doDelete);
        } else {
            if (confirm('Xóa hóa đơn này?')) doDelete();
        }
    },

    async editBill() {
        if (!this.currentViewBillId) return;
        const bill = this.bills.find(b => b.id === this.currentViewBillId);
        if (!bill) return;

        // Đóng detail modal
        this.closeModals();

        // Mở lại bill modal như khi tạo mới
        await this.openBillModal();

        // Đánh dấu đây là chế độ sửa
        this._editingBillId = bill.id;

        // Chọn lại phòng
        const roomSelect = document.getElementById('billRoomSelect');
        if (roomSelect && bill.roomId) {
            roomSelect.value = bill.roomId;
            this.onRoomSelect();
        }

        // Thông báo cho người dùng
        if (window.app && window.app.showToast) {
            window.app.showToast('Đang chỉnh sửa hóa đơn. Điều chỉnh rồi nhấn Lưu.', 'success');
        }

        // Patch saveBill để ghi đè thay vì tạo mới
        const originalSave = this.saveBill.bind(this);
        this.saveBill = () => {
            const roomId = document.getElementById('billRoomSelect').value;
            if (!roomId) { alert('Vui lòng chọn phòng!'); return; }

            const htmlContent = document.getElementById('billPaperPreview').innerHTML;
            const grandTotalText = document.getElementById('bpGrandTotal').innerText;
            const roomName = document.getElementById('bpRoomName').innerText;
            const now = new Date();
            const monthText = i18n ? i18n.t('bill.month_year_format').replace('{month}', now.getMonth() + 1).replace('{year}', now.getFullYear()) : `Tháng ${now.getMonth() + 1} Năm ${now.getFullYear()}`;

            // Ghi đè hóa đơn cũ
            const idx = this.bills.findIndex(b => b.id === this._editingBillId);
            if (idx > -1) {
                this.bills[idx] = {
                    ...this.bills[idx],
                    roomId, roomName, month: monthText,
                    total: grandTotalText,
                    dateCreated: new Date().toISOString(),
                    html: htmlContent
                };
                localStorage.setItem((window.app && !window.app.isPro() && window.app.isTestUser && window.app.isTestUser() ? 'rentify_bills_temp' : 'rentify_bills'), JSON.stringify(this.bills));
                if (window.app && window.app.showToast) {
                    window.app.showToast('Đã cập nhật hóa đơn!', 'success');
                }
            }
            // Khôi phục saveBill gốc
            this.saveBill = originalSave;
            this._editingBillId = null;
            this.closeModals();
            this.renderBills();
        };
    },

    exportPDF() {
        if (window.app && !window.app.isPro()) {
            window.app.openPlanModal();
            window.app.showToast('Xuất PDF chỉ dành cho Pro!', 'error');
            return;
        }
        const element = document.getElementById('billExportTarget');
        const bill = this.bills.find(x => x.id === this.currentViewBillId);
        const filename = bill ? `Hoa_Don_${bill.roomName.replace(/\s+/g, '_')}_${new Date(bill.dateCreated).getTime()}.pdf` : 'Hoa_Don.pdf';

        const opt = {
            margin:       0.5,
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, allowTaint: false },
            jsPDF:        { unit: 'in', format: 'a5', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            if (window.app && window.app.showToast) {
                window.app.showToast('Đã xuất file PDF thành công!', 'success');
            }
        });
    },


    filterBills(query) {
        const q = (query || '').trim().toLowerCase();
        const filtered = !q
            ? this.bills
            : this.bills.filter(b => b.roomName.toLowerCase().includes(q));
        this.renderBills(filtered);
    },

    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    billApp.init();
});

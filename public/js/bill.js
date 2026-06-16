const billApp = {
    presets: [],
    bills: [],
    selectedBills: new Set(),

    async init() {
        // Load data from API
        try {
            const [billsRes, presetsRes] = await Promise.all([
                api.getBills(),
                api.getPresets()
            ]);
            if (billsRes.success) this.bills = billsRes.data || [];
            if (presetsRes.success) this.presets = presetsRes.data || [];
        } catch (e) {
            console.error('billApp.init error:', e);
            this.bills = [];
            this.presets = [];
        }

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
            div.innerHTML = `${p.name} <i class='bx bx-x' style="margin-left:5px; cursor:pointer;" onclick="event.stopPropagation(); billApp.deletePreset(${p.id})"></i>`;
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

    async savePreset(e) {
        e.preventDefault();
        const idVal = document.getElementById('presetId').value;
        const presetData = {
            name: document.getElementById('presetName').value,
            electricPrice: Number(document.getElementById('presetElectricPrice').value) || 0,
            waterPrice: Number(document.getElementById('presetWaterPrice').value) || 0,
            managementFee: Number(document.getElementById('presetManagementFee').value) || 0,
            internetFee: Number(document.getElementById('presetInternetFee').value) || 0,
            parkingFee: Number(document.getElementById('presetParkingFee').value) || 0,
            extraFees: this.collectExtraFees()
        };

        try {
            let res;
            if (idVal) {
                res = await api.updatePreset(parseInt(idVal), presetData);
            } else {
                res = await api.createPreset(presetData);
            }

            if (res.success) {
                // Reload presets from API
                const presetsRes = await api.getPresets();
                if (presetsRes.success) this.presets = presetsRes.data || [];

                if (window.app && window.app.showToast) {
                    window.app.showToast('Lưu Preset thành công!');
                }
                this.closeModals();
                this.renderPresets();
                this.resetPresetForm();
            } else {
                if (window.app && window.app.showToast) {
                    window.app.showToast(res.message || 'Lỗi lưu preset', 'error');
                }
            }
        } catch (err) {
            console.error('savePreset error:', err);
            if (window.app && window.app.showToast) {
                window.app.showToast('Lỗi kết nối server', 'error');
            }
        }
    },

    deletePreset(id) {
        const doDelete = async () => {
            try {
                const res = await api.deletePreset(id);
                if (res.success) {
                    this.presets = this.presets.filter(x => x.id !== id);
                    this.renderPresets();
                    if (window.app && window.app.showToast) {
                        window.app.showToast('Đã xóa preset', 'success');
                    }
                } else {
                    if (window.app && window.app.showToast) {
                        window.app.showToast(res.message || 'Lỗi xóa preset', 'error');
                    }
                }
            } catch (err) {
                console.error('deletePreset error:', err);
                if (window.app && window.app.showToast) {
                    window.app.showToast('Lỗi kết nối server', 'error');
                }
            }
        };
        if (window.app && window.app.showConfirmDialog) {
            window.app.showConfirmDialog('Xóa preset này?', 'Xóa Preset', doDelete, 'Xóa');
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
        const p = this.presets.find(x => String(x.id) === String(pid));
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

    async saveBill() {
        // Check bill limit for free users
        if (window.app && !window.app.isPro()) {
            if (this.bills.length >= 5) {
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

        // Parse total amount from formatted string
        const totalAmount = parseFloat(grandTotalText.replace(/[^\d]/g, '')) || 0;

        // If editing existing bill
        if (this._editingBillId) {
            try {
                const res = await api.updateBill(this._editingBillId, {
                    roomId: String(roomId),
                    roomName,
                    month: monthText,
                    total: grandTotalText,
                    totalAmount,
                    html: htmlContent,
                    dateCreated: new Date().toISOString()
                });

                if (res.success) {
                    // Reload bills from API
                    const billsRes = await api.getBills();
                    if (billsRes.success) this.bills = billsRes.data || [];

                    if (window.app && window.app.showToast) {
                        window.app.showToast('Đã cập nhật hóa đơn!', 'success');
                    }
                } else {
                    if (window.app && window.app.showToast) {
                        window.app.showToast(res.message || 'Lỗi cập nhật hóa đơn', 'error');
                    }
                }
            } catch (err) {
                console.error('updateBill error:', err);
                if (window.app && window.app.showToast) {
                    window.app.showToast('Lỗi kết nối server', 'error');
                }
            }
            this._editingBillId = null;
            this.closeModals();
            this.renderBills();
            return;
        }

        // Creating new bill
        try {
            const res = await api.createBill({
                roomId: String(roomId),
                roomName,
                month: monthText,
                total: grandTotalText,
                totalAmount,
                paid: false,
                html: htmlContent,
                dateCreated: now.toISOString()
            });

            if (res.success) {
                this.bills.push(res.data);

                if (window.app && window.app.showToast) {
                    window.app.showToast('Đã lưu hóa đơn!', 'success');
                }
                this.closeModals();
                this.renderBills();
                // Highlight newly created bill
                if (window.app && window.app.highlightBill) {
                    window.app.highlightBill(res.data.id);
                }
            } else {
                if (window.app && window.app.showToast) {
                    window.app.showToast(res.message || 'Lỗi lưu hóa đơn', 'error');
                }
            }
        } catch (err) {
            console.error('saveBill error:', err);
            if (window.app && window.app.showToast) {
                window.app.showToast('Lỗi kết nối server', 'error');
            }
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
            // Month header (DOM-based to support checkbox)
            const header = document.createElement('div');
            header.style.cssText = 'grid-column: 1/-1; display:flex; align-items:center; gap:0.75rem; margin-top:1.5rem; margin-bottom:0.25rem;';

            const monthChk = document.createElement('input');
            monthChk.type = 'checkbox';
            monthChk.dataset.monthCheckbox = month;
            const allInMonth = bills.every(b => this.selectedBills.has(b.id));
            const someInMonth = bills.some(b => this.selectedBills.has(b.id));
            monthChk.checked = allInMonth;
            monthChk.indeterminate = !allInMonth && someInMonth;
            monthChk.style.cssText = 'transform:scale(1.2); cursor:pointer; flex-shrink:0;';
            monthChk.addEventListener('change', (ev) => billApp.toggleMonthSelection(month, ev.target.checked));
            header.appendChild(monthChk);

            const labelSpan = document.createElement('span');
            labelSpan.style.cssText = 'font-weight:700; font-size:1rem; color:var(--text-color)';
            labelSpan.textContent = month;
            header.appendChild(labelSpan);

            const unpaidCount = bills.filter(b => !b.paid).length;
            const badge = document.createElement('span');
            if (unpaidCount > 0) {
                badge.style.cssText = 'background:var(--danger); color:#fff; font-size:0.7rem; padding:2px 8px; border-radius:99px; font-weight:600';
                badge.textContent = `${unpaidCount} ${i18n.t('bill.unpaid')}`;
            } else {
                badge.style.cssText = 'background:#10b981; color:#fff; font-size:0.7rem; padding:2px 8px; border-radius:99px; font-weight:600';
                badge.textContent = `✔ ${i18n.t('bill.done')}`;
            }
            header.appendChild(badge);

            const divider = document.createElement('div');
            divider.style.cssText = 'flex:1; height:1px; background:var(--border-color);';
            header.appendChild(divider);

            grid.appendChild(header);

            const safeMonth = month.replace(/"/g, '&quot;');

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
                            <input type="checkbox" class="bill-checkbox" data-id="${bill.id}" data-month="${safeMonth}" ${isChecked}
                                onchange="billApp.toggleBillSelection(event, ${bill.id})" style="transform:scale(1.2)">
                            <strong>${bill.roomName}</strong>
                        </div>
                        <span
                            onclick="event.stopPropagation(); billApp.togglePaid(${bill.id})"
                            style="${paidStyle} font-size:0.72rem; padding:3px 10px; border-radius:99px; font-weight:600; cursor:pointer; user-select:none;"
                            title="${i18n.t('bill.click_to_toggle')}"
                        >${paidLabel}</span>
                    </div>
                    <div class="room-info" onclick="billApp.viewBill(${bill.id})" style="cursor:pointer;">
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

    async togglePaid(id) {
        const bill = this.bills.find(b => b.id === id);
        if (!bill) return;

        const newPaid = !bill.paid;
        try {
            const res = await api.updateBill(id, { paid: newPaid });
            if (res.success) {
                bill.paid = newPaid;
                this.renderBills();
                const label = newPaid
                    ? (i18n ? i18n.t('bill.marked_paid') : 'Đã đánh dấu là Đã trả')
                    : (i18n ? i18n.t('bill.marked_unpaid') : 'Đã đánh dấu là Còn nợ');
                if (window.app && window.app.showToast) window.app.showToast(label, 'success');
            } else {
                if (window.app && window.app.showToast) window.app.showToast(res.message || 'Lỗi cập nhật', 'error');
            }
        } catch (err) {
            console.error('togglePaid error:', err);
            if (window.app && window.app.showToast) window.app.showToast('Lỗi kết nối server', 'error');
        }
    },

    toggleBillSelection(e, id) {
        if (e.target.checked) {
            this.selectedBills.add(id);
        } else {
            this.selectedBills.delete(id);
        }
        const month = e.target.dataset.month;
        if (month) this._syncMonthCheckbox(month);
        this.updateMultiSelectUI();
    },

    toggleMonthSelection(month, checked) {
        this.bills.filter(b => b.month === month).forEach(b => {
            if (checked) this.selectedBills.add(b.id);
            else this.selectedBills.delete(b.id);
        });
        document.querySelectorAll('.bill-checkbox[data-month]').forEach(chk => {
            if (chk.dataset.month === month) chk.checked = checked;
        });
        this.updateMultiSelectUI();
    },

    _syncMonthCheckbox(month) {
        const monthBills = this.bills.filter(b => b.month === month);
        if (!monthBills.length) return;
        const allChecked = monthBills.every(b => this.selectedBills.has(b.id));
        const someChecked = monthBills.some(b => this.selectedBills.has(b.id));
        document.querySelectorAll('[data-month-checkbox]').forEach(chk => {
            if (chk.dataset.monthCheckbox === month) {
                chk.checked = allChecked;
                chk.indeterminate = !allChecked && someChecked;
            }
        });
    },

    updateMultiSelectUI() {
        const btn = document.getElementById('btnDeleteSelectedBills');
        const countSpan = document.getElementById('selectedBillCount');
        const btnPaid = document.getElementById('btnMarkSelectedPaid');
        const paidCountSpan = document.getElementById('selectedPaidCount');
        const btnUnpaid = document.getElementById('btnMarkSelectedUnpaid');
        const unpaidCountSpan = document.getElementById('selectedUnpaidCount');
        if (this.selectedBills.size > 0) {
            btn.style.display = 'inline-flex';
            countSpan.innerText = this.selectedBills.size;
            let unpaidCount = 0, paidCount = 0;
            [...this.selectedBills].forEach(id => {
                const b = this.bills.find(x => x.id === id);
                if (b && !b.paid) unpaidCount++;
                if (b && b.paid) paidCount++;
            });
            if (btnPaid) {
                btnPaid.style.display = unpaidCount > 0 ? 'inline-flex' : 'none';
                if (paidCountSpan) paidCountSpan.innerText = unpaidCount;
            }
            if (btnUnpaid) {
                btnUnpaid.style.display = paidCount > 0 ? 'inline-flex' : 'none';
                if (unpaidCountSpan) unpaidCountSpan.innerText = paidCount;
            }
        } else {
            btn.style.display = 'none';
            if (btnPaid) btnPaid.style.display = 'none';
            if (btnUnpaid) btnUnpaid.style.display = 'none';
        }
    },

    async markSelectedAsPaid() {
        const unpaidIds = [...this.selectedBills].filter(id => {
            const b = this.bills.find(x => x.id === id);
            return b && !b.paid;
        });
        if (unpaidIds.length === 0) return;
        const doMark = async () => {
            try {
                await Promise.all(unpaidIds.map(id => api.updateBill(id, { paid: true })));
                unpaidIds.forEach(id => {
                    const b = this.bills.find(x => x.id === id);
                    if (b) b.paid = true;
                });
                this.selectedBills.clear();
                if (window.app && window.app.showToast) window.app.showToast(`Đã đánh dấu ${unpaidIds.length} hóa đơn là Đã thanh toán`, 'success');
                this.renderBills();
            } catch (err) {
                console.error('markSelectedAsPaid error:', err);
                if (window.app && window.app.showToast) window.app.showToast('Lỗi kết nối server', 'error');
            }
        };
        const msg = `Đánh dấu ${unpaidIds.length} hóa đơn chưa thanh toán thành Đã thanh toán?`;
        if (window.app && window.app.showConfirmDialog) {
            window.app.showConfirmDialog(msg, 'Xác nhận thanh toán', doMark);
        } else {
            if (confirm(msg)) doMark();
        }
    },

    async markSelectedAsUnpaid() {
        const paidIds = [...this.selectedBills].filter(id => {
            const b = this.bills.find(x => x.id === id);
            return b && b.paid;
        });
        if (paidIds.length === 0) return;
        const doMark = async () => {
            try {
                await Promise.all(paidIds.map(id => api.updateBill(id, { paid: false })));
                paidIds.forEach(id => {
                    const b = this.bills.find(x => x.id === id);
                    if (b) b.paid = false;
                });
                this.selectedBills.clear();
                if (window.app && window.app.showToast) window.app.showToast(`Đã đánh dấu ${paidIds.length} hóa đơn là Chưa thanh toán`, 'success');
                this.renderBills();
            } catch (err) {
                console.error('markSelectedAsUnpaid error:', err);
                if (window.app && window.app.showToast) window.app.showToast('Lỗi kết nối server', 'error');
            }
        };
        const msg = `Đánh dấu ${paidIds.length} hóa đơn đã thanh toán thành Chưa thanh toán?`;
        if (window.app && window.app.showConfirmDialog) {
            window.app.showConfirmDialog(msg, 'Xác nhận', doMark);
        } else {
            if (confirm(msg)) doMark();
        }
    },

    deleteSelectedBills() {
        if (this.selectedBills.size === 0) return;
        const doDelete = async () => {
            try {
                const ids = [...this.selectedBills];
                const res = await api.deleteBillsBatch(ids);
                if (res.success) {
                    this.bills = this.bills.filter(b => !this.selectedBills.has(b.id));
                    this.selectedBills.clear();
                    if (window.app && window.app.showToast) window.app.showToast('Đã xóa các hóa đơn được chọn', 'success');
                    this.renderBills();
                } else {
                    if (window.app && window.app.showToast) window.app.showToast(res.message || 'Lỗi xóa hóa đơn', 'error');
                }
            } catch (err) {
                console.error('deleteSelectedBills error:', err);
                if (window.app && window.app.showToast) window.app.showToast('Lỗi kết nối server', 'error');
            }
        };
        const msg = `Bạn có chắc chắn muốn xóa ${this.selectedBills.size} hóa đơn đã chọn?`;
        if (window.app && window.app.showConfirmDialog) {
            window.app.showConfirmDialog(msg, 'Xóa hóa đơn', doDelete, 'Xóa');
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
        const doDelete = async () => {
            try {
                const res = await api.deleteBill(this.currentViewBillId);
                if (res.success) {
                    this.bills = this.bills.filter(b => b.id !== this.currentViewBillId);
                    if (window.app && window.app.showToast) window.app.showToast('Đã xóa hóa đơn', 'success');
                    this.closeModals();
                    this.renderBills();
                } else {
                    if (window.app && window.app.showToast) window.app.showToast(res.message || 'Lỗi xóa hóa đơn', 'error');
                }
            } catch (err) {
                console.error('deleteBill error:', err);
                if (window.app && window.app.showToast) window.app.showToast('Lỗi kết nối server', 'error');
            }
        };
        if (window.app && window.app.showConfirmDialog) {
            window.app.showConfirmDialog('Xóa hóa đơn này?', 'Xóa hóa đơn', doDelete, 'Xóa');
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

        // Đánh dấu đây là chế độ sửa
        this._editingBillId = bill.id;

        // Mở lại bill modal như khi tạo mới
        await this.openBillModal();

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
    },

    exportPDF() {
        if (window.app && !window.app.isPro()) {
            window.app.openPlanModal();
            window.app.showToast('Xuất PDF chỉ dành cho Pro!', 'error');
            return;
        }
        document.getElementById('exportPDFOptionsModal').classList.add('active');
    },

    closeExportOptionsModal() {
        document.getElementById('exportPDFOptionsModal').classList.remove('active');
    },

    _extractBillAndQr(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html');
        let qrSrc = '';
        const qrImg = doc.querySelector('img[src*="vietqr.io"]') || doc.querySelector('#bpVietQR');
        if (qrImg) {
            qrSrc = qrImg.getAttribute('src') || '';
            const qrSection = qrImg.closest('tr') || qrImg.closest('.qr-section') || qrImg.parentElement;
            if (qrSection && qrSection !== doc.body) qrSection.remove();
            else if (qrImg.parentElement) qrImg.remove();
        }
        return { billOnlyHtml: doc.querySelector('div').innerHTML, qrSrc };
    },

    _makePdfWrapper(innerHtml) {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;width:794px;background:#fff;font-family:"Inter",sans-serif;opacity:0;pointer-events:none;z-index:99999;';
        el.innerHTML = innerHtml;
        document.body.appendChild(el);
        return el;
    },

    exportPDFBill() {
        this.closeExportOptionsModal();
        const bill = this.bills.find(x => x.id === this.currentViewBillId);
        if (!bill) return;
        const { billOnlyHtml } = this._extractBillAndQr(bill.html);
        const filename = `HoaDon_${bill.roomName.replace(/\s+/g, '_')}_${bill.month.replace(/[\/\s]+/g, '_')}.pdf`;
        const wrapper = this._makePdfWrapper(`<div style="padding:20px;">${billOnlyHtml}</div>`);
        html2pdf().set({
            margin: [10, 12, 10, 12],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(wrapper).save().then(() => {
            document.body.removeChild(wrapper);
            if (window.app && window.app.showToast) window.app.showToast('Đã xuất hóa đơn PDF!', 'success');
        });
    },

    exportPDFQR() {
        this.closeExportOptionsModal();
        const bill = this.bills.find(x => x.id === this.currentViewBillId);
        if (!bill) return;
        const { qrSrc } = this._extractBillAndQr(bill.html);
        if (!qrSrc) {
            if (window.app && window.app.showToast) window.app.showToast('Không tìm thấy mã QR cho hóa đơn này!', 'error');
            return;
        }
        const filename = `QR_${bill.roomName.replace(/\s+/g, '_')}_${bill.month.replace(/[\/\s]+/g, '_')}.pdf`;
        const wrapper = this._makePdfWrapper(`
            <div style="padding:40px 20px; text-align:center;">
                <h2 style="color:#4f46e5; margin-bottom:8px;">MÃ QR THANH TOÁN</h2>
                <p style="color:#6b7280; margin-bottom:4px; font-size:14px;">${bill.roomName} — ${bill.month}</p>
                <p style="color:#6b7280; margin-bottom:24px; font-size:16px; font-weight:600;">Tổng: ${bill.total}</p>
                <img src="${qrSrc}" style="max-width:320px; width:100%; border:2px solid #e5e7eb; border-radius:12px; padding:12px;" crossorigin="anonymous">
                <p style="color:#6b7280; margin-top:16px; font-size:12px;">Quét mã để thanh toán qua ngân hàng</p>
            </div>`);
        html2pdf().set({
            margin: [20, 20, 20, 20],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(wrapper).save().then(() => {
            document.body.removeChild(wrapper);
            if (window.app && window.app.showToast) window.app.showToast('Đã xuất mã QR PDF!', 'success');
        });
    },

    exportPDFBoth() {
        this.closeExportOptionsModal();
        const bill = this.bills.find(x => x.id === this.currentViewBillId);
        if (!bill) return;
        const { billOnlyHtml, qrSrc } = this._extractBillAndQr(bill.html);
        const filename = `HoaDon+QR_${bill.roomName.replace(/\s+/g, '_')}_${bill.month.replace(/[\/\s]+/g, '_')}.pdf`;
        const qrPage = qrSrc ? `
            <div style="page-break-before:always; padding:40px 20px; text-align:center;">
                <h2 style="color:#4f46e5; margin-bottom:8px;">MÃ QR THANH TOÁN</h2>
                <p style="color:#6b7280; margin-bottom:4px; font-size:14px;">${bill.roomName} — ${bill.month}</p>
                <p style="color:#6b7280; margin-bottom:24px; font-size:16px; font-weight:600;">Tổng: ${bill.total}</p>
                <img src="${qrSrc}" style="max-width:320px; width:100%; border:2px solid #e5e7eb; border-radius:12px; padding:12px;" crossorigin="anonymous">
                <p style="color:#6b7280; margin-top:16px; font-size:12px;">Quét mã để thanh toán qua ngân hàng</p>
            </div>` : '';
        const wrapper = this._makePdfWrapper(`<div style="padding:20px;">${billOnlyHtml}</div>${qrPage}`);
        html2pdf().set({
            margin: [10, 12, 10, 12],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        }).from(wrapper).save().then(() => {
            document.body.removeChild(wrapper);
            if (window.app && window.app.showToast) window.app.showToast('Đã xuất hóa đơn + QR PDF!', 'success');
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

document.addEventListener('DOMContentLoaded', async () => {
    await billApp.init();
});

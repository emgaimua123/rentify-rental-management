const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const replacements = {
    '<h1>Lịch sử Hợp đồng</h1>': '<h1 data-i18n="contract.history_title">Lịch sử Hợp đồng</h1>',
    '<h3>Chi tiết Hợp đồng Lịch sử</h3>': '<h3 data-i18n="contract.history_detail_title">Chi tiết Hợp đồng Lịch sử</h3>',
    '<h2 id="previewName">Tên Phòng</h2>': '<h2 id="previewName" data-i18n="rooms.detail_name">Tên Phòng</h2>',
    '<span>Diện tích</span>': '<span data-i18n="rooms.detail_area">Diện tích</span>',
    '<span>Loại phòng</span>': '<span data-i18n="rooms.detail_type">Loại phòng</span>',
    '<h4 style="margin-bottom: 1rem; color: var(--primary-color);">Hợp đồng hiện tại</h4>': '<h4 style="margin-bottom: 1rem; color: var(--primary-color);" data-i18n="rooms.detail_current_contract">Hợp đồng hiện tại</h4>',
    '<span style="color: var(--text-muted)">Người thuê:</span>': '<span style="color: var(--text-muted)" data-i18n="rooms.detail_tenant">Người thuê:</span>',
    '<span style="color: var(--text-muted)">Số người ở:</span>': '<span style="color: var(--text-muted)" data-i18n="rooms.detail_tenant_count">Số người ở:</span>',
    '<span style="color: var(--text-muted)">Từ ngày:</span>': '<span style="color: var(--text-muted)" data-i18n="rooms.detail_start_date">Từ ngày:</span>',
    '<span style="color: var(--text-muted)">Đến ngày:</span>': '<span style="color: var(--text-muted)" data-i18n="rooms.detail_end_date">Đến ngày:</span>',
    '<h3>Điều chỉnh giá (Presets)</h3>': '<h3 data-i18n="bill.preset_title">Điều chỉnh giá (Presets)</h3>',
    '<label>Tên Preset</label>': '<label data-i18n="bill.preset_name">Tên Preset</label>',
    '<label>Nhập theo khối</label>': '<label data-i18n="bill.water_block">Nhập theo khối</label>',
    '<label>Nhập tổng tiền</label>': '<label data-i18n="bill.water_total">Nhập tổng tiền</label>',
    '<span>Các khoản phí tự chọn</span>': '<span data-i18n="bill.other_services_label">Các khoản phí tự chọn</span>',
    '<button type="button" class="btn-secondary" onclick="billApp.resetPresetForm()">Tạo mới trắng</button>': '<button type="button" class="btn-secondary" onclick="billApp.resetPresetForm()" data-i18n="bill.preset_new_btn">Tạo mới trắng</button>',
    '<button type="submit" class="btn-primary">Lưu Preset</button>': '<button type="submit" class="btn-primary" data-i18n="bill.preset_save_btn">Lưu Preset</button>'
};

for (const [k, v] of Object.entries(replacements)) {
    html = html.replace(k, v);
}

fs.writeFileSync('public/index.html', html);
console.log('index.html updated');

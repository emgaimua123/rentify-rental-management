const translations = {
    vi: {
        // Sidebar & Menu
        "menu.overview": "Tổng quan",
        "menu.rooms": "Danh sách phòng",
        "menu.bills": "Hóa đơn",
        "menu.contracts": "Hợp đồng",
        "menu.logout": "Đăng xuất",

        // Topbar
        "topbar.search": "Tìm kiếm phòng...",

        // Overview
        "overview.greeting": "Chào bạn!",
        "overview.subtitle": "Chào mừng bạn quay trở lại. Dưới đây là một số gợi ý cho bạn hôm nay.",
        "overview.quick_access": "Gợi ý truy cập nhanh",
        "overview.manage_rooms": "Quản lý phòng trọ",
        "overview.manage_rooms_desc": "Truy cập gần đây. Xem danh sách, thêm phòng mới và cập nhật trạng thái phòng nhanh chóng.",
        "overview.manage_contracts": "Quản lý Hợp đồng",
        "overview.manage_contracts_desc": "Tạo hợp đồng thuê mới, gia hạn hoặc xem các hợp đồng sắp hết hạn trong tháng này.",

        // Room List
        "rooms.title": "Danh sách phòng",
        "rooms.add_btn": "Thêm phòng mới",
        "rooms.all": "Tất cả",
        "rooms.available": "Trống",
        "rooms.occupied": "Đang thuê",
        "rooms.maintenance": "Bảo trì",
        "rooms.table.room": "Phòng",
        "rooms.table.type": "Loại phòng",
        "rooms.table.price": "Giá thuê",
        "rooms.table.status": "Trạng thái",
        "rooms.table.tenant": "Người thuê",
        "rooms.table.action": "Thao tác",

        // Status Map
        "status.Available": "Trống",
        "status.Occupied": "Đang thuê",
        "status.Maintenance": "Bảo trì",

        // Landing Page
        "landing.login": "Đăng nhập",
        "landing.register": "Đăng ký",
        "landing.title": "Quản lý trọ dễ dàng hơn bao giờ hết",
        "landing.desc": "Nền tảng quản lý phòng trọ toàn diện, hiện đại, và nhanh chóng. Bắt đầu ngay hôm nay để trải nghiệm sự khác biệt.",
        "landing.start": "Bắt đầu ngay",

        // Auth Modals
        "auth.login": "Đăng nhập",
        "auth.username": "Tên đăng nhập",
        "auth.password": "Mật khẩu",
        "auth.login_btn": "Đăng nhập",
        "auth.no_account": "Chưa có tài khoản?",
        "auth.register_now": "Đăng ký ngay",
        "auth.register": "Đăng ký",
        "auth.email": "Email",
        "auth.captcha": "Xác minh CAPTCHA",
        "auth.register_btn": "Đăng ký",
        "auth.has_account": "Đã có tài khoản?",
        "auth.login_now": "Đăng nhập ngay",

        // Profile Modals
        "profile.required": "Cập nhật thông tin",
        "profile.required_desc": "Vui lòng cập nhật Tên hiển thị và Avatar để tiếp tục sử dụng hệ thống.",
        "profile.name": "Tên hiển thị",
        "profile.avatar_url": "Đường dẫn Avatar (Tùy chọn)",
        "profile.save": "Lưu thông tin",
        "profile.update": "Cập nhật thông tin"
    },
    en: {
        // Sidebar & Menu
        "menu.overview": "Overview",
        "menu.rooms": "Rooms",
        "menu.bills": "Invoices",
        "menu.contracts": "Contracts",
        "menu.logout": "Logout",

        // Topbar
        "topbar.search": "Search rooms...",

        // Overview
        "overview.greeting": "Welcome!",
        "overview.subtitle": "Welcome back. Here are some suggestions for you today.",
        "overview.quick_access": "Quick Access",
        "overview.manage_rooms": "Manage Rooms",
        "overview.manage_rooms_desc": "Recently accessed. View list, add new rooms, and update status quickly.",
        "overview.manage_contracts": "Manage Contracts",
        "overview.manage_contracts_desc": "Create new contracts, renew or view contracts expiring this month.",

        // Room List
        "rooms.title": "Room List",
        "rooms.add_btn": "Add Room",
        "rooms.all": "All",
        "rooms.available": "Available",
        "rooms.occupied": "Occupied",
        "rooms.maintenance": "Maintenance",
        "rooms.table.room": "Room",
        "rooms.table.type": "Type",
        "rooms.table.price": "Price",
        "rooms.table.status": "Status",
        "rooms.table.tenant": "Tenant",
        "rooms.table.action": "Action",

        // Status Map
        "status.Available": "Available",
        "status.Occupied": "Occupied",
        "status.Maintenance": "Maintenance",

        // Landing Page
        "landing.login": "Login",
        "landing.register": "Register",
        "landing.title": "Manage rentals easier than ever",
        "landing.desc": "A comprehensive, modern, and fast rental management platform. Start today to experience the difference.",
        "landing.start": "Start Now",

        // Auth Modals
        "auth.login": "Login",
        "auth.username": "Username",
        "auth.password": "Password",
        "auth.login_btn": "Log In",
        "auth.no_account": "Don't have an account?",
        "auth.register_now": "Register now",
        "auth.register": "Register",
        "auth.email": "Email",
        "auth.captcha": "Verify CAPTCHA",
        "auth.register_btn": "Sign Up",
        "auth.has_account": "Already have an account?",
        "auth.login_now": "Log in now",

        // Profile Modals
        "profile.required": "Update Profile",
        "profile.required_desc": "Please update your Display Name and Avatar to continue using the system.",
        "profile.name": "Display Name",
        "profile.avatar_url": "Avatar URL (Optional)",
        "profile.save": "Save Information",
        "profile.update": "Update Profile"
    }
};

class I18nManager {
    constructor() {
        this.lang = localStorage.getItem('rentify_lang') || 'vi';
    }

    setLanguage(lang) {
        this.lang = lang;
        localStorage.setItem('rentify_lang', lang);
        this.updateDOM();
        // Cập nhật giao diện cờ
        const btns = ['langEnBtnLanding', 'langViBtnLanding', 'langEnBtnTopbar', 'langViBtnTopbar'];
        btns.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id.includes('EnBtn')) el.style.opacity = lang === 'en' ? '1' : '0.5';
                if (id.includes('ViBtn')) el.style.opacity = lang === 'vi' ? '1' : '0.5';
            }
        });

        // Trigger event cho app.js biết mà render lại data table
        window.dispatchEvent(new Event('languageChanged'));
    }

    t(key) {
        return translations[this.lang][key] || key;
    }

    updateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = this.t(key);
            } else {
                // Nếu HTML có icon (ví dụ: <i class="bx..."></i> Text)
                // ta cần giữ lại icon. Cách tốt nhất là bọc text trong <span> có data-i18n.
                // Nếu element không có thẻ con, set trực tiếp textContent.
                el.textContent = this.t(key);
            }
        });
    }

    init() {
        this.setLanguage(this.lang);
    }
}

window.i18n = new I18nManager();

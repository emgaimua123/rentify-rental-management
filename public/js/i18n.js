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
        "rooms.page_title": "Quản lý Phòng trọ",
        "rooms.page_subtitle": "Theo dõi và quản lý các phòng trọ của bạn dễ dàng.",
        "rooms.add_btn": "Thêm phòng mới",
        "rooms.bulk_create": "Tạo nhiều phòng",
        "rooms.delete_selected": "Xóa đã chọn",
        "rooms.sort_default": "Sắp xếp mặc định",
        "rooms.sort_asc": "Tên: Tăng dần (A-Z)",
        "rooms.sort_desc": "Tên: Giảm dần (Z-A)",
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

        // Room Modal
        "room.status": "Trạng thái",
        "room.modal_add": "Thêm phòng mới",
        "room.modal_edit": "Chỉnh sửa phòng",
        "room.cancel": "Hủy",
        "room.save": "Lưu phòng",
        "room.search_placeholder": "Tìm kiếm theo tên phòng...",

        // Bill Section
        "bill.title": "Quản lý Hóa đơn",
        "bill.subtitle": "Tạo hóa đơn và thiết lập giá dịch vụ.",
        "bill.search_placeholder": "Tìm kiếm theo tên phòng...",
        "bill.create_btn": "Tạo hóa đơn mới",
        "bill.price_preset_btn": "Điều chỉnh giá",
        "bill.modal_title": "Tạo hóa đơn mới",
        "bill.select_room": "Chọn phòng (Đang thuê)",
        "bill.select_preset": "Chọn Preset giá (Tùy chọn)",
        "bill.room_charge": "Tiền phòng (VNĐ)",
        "bill.electric": "Điện",
        "bill.electric_num": "Số điện tiêu thụ",
        "bill.electric_price": "Giá 1 số điện (VNĐ)",
        "bill.water": "Nước",
        "bill.water_total_label": "Nhập tổng tiền",
        "bill.water_volume_label": "Nhập theo khối",
        "bill.water_total_field": "Tổng tiền nước (VNĐ)",
        "bill.water_volume_field": "Số khối nước",
        "bill.water_price": "Giá 1 khối (VNĐ)",
        "bill.other_services": "Các dịch vụ khác",
        "bill.management_fee": "Phí quản lý",
        "bill.internet_fee": "Tiền Internet",
        "bill.parking_fee": "Phí gửi xe",
        "bill.save_btn": "Lưu hóa đơn",
        "bill.preview_title": "HÓA ĐƠN TIỀN NHÀ",
        "bill.preview_room": "Phòng:",
        "bill.preview_tenant": "Người thuê:",
        "bill.preview_room_charge": "Tiền phòng",
        "bill.preview_electric": "Tiền điện",
        "bill.preview_water": "Tiền nước",
        "bill.preview_management": "Phí quản lý",
        "bill.preview_internet": "Tiền Internet",
        "bill.preview_parking": "Phí gửi xe",
        "bill.preview_total": "TỔNG CỘNG",
        "bill.no_bills": "Chưa có hóa đơn nào được tạo.",
        "bill.delete_selected": "Xóa mục đã chọn",

        // Greeting
        "greeting.morning": "Chào buổi sáng",
        "greeting.afternoon": "Chào buổi chiều",
        "greeting.evening": "Chào buổi tối",
        "greeting.default": "Chào bạn",

        // Missing Translations
        "rooms.delete_title": "Xóa phòng",
        "rooms.delete_occupied_title": "⚠️ Cảnh báo - Phòng có người thuê",
        "rooms.delete_confirm": "Bạn có chắc chắn muốn xóa phòng này?",
        "rooms.delete_occupied_confirm": "Phòng này đang có người thuê. Xóa sẽ kết thúc hợp đồng. Bạn có chắc chắn?",
        "rooms.delete_success": "Đã xóa phòng",
        "rooms.delete_selected_confirm": "Bạn có chắc chắn muốn xóa",
        "rooms.delete_selected_unit": "phòng đã chọn?",
        "rooms.detail_name": "Tên Phòng",
        "rooms.detail_area": "Diện tích",
        "rooms.detail_type": "Loại phòng",
        "rooms.detail_current_contract": "Hợp đồng hiện tại",
        "rooms.detail_tenant": "Người thuê:",
        "rooms.detail_tenant_count": "Số người ở:",
        "rooms.detail_start_date": "Từ ngày:",
        "rooms.detail_end_date": "Đến ngày:",
        "contract.history_title": "Lịch sử hợp đồng",
        "contract.history_detail_title": "Chi tiết Hợp đồng Lịch sử",
        "contract.room_info": "Thông tin phòng",
        "contract.tenant_rep": "Người đại diện thuê",
        "contract.contract_period": "Thời hạn hợp đồng",
        "contract.start": "Bắt đầu:",
        "contract.end": "Kết thúc:",
        "contract.accompanying_list": "Danh sách người ở kèm",
        "contract.no_data": "Không có dữ liệu",
        "contract.created_date": "Ngày tạo:",
        "bill.print_btn": "In hóa đơn",
        "bill.preset_title": "Điều chỉnh giá (Presets)",
        "bill.preset_name": "Tên Preset",
        "bill.water_block": "Nhập theo khối",
        "bill.water_total": "Nhập tổng tiền",
        "bill.other_services_label": "Các khoản phí tự chọn",
        "bill.preset_new_btn": "Tạo mới trắng",
        "bill.preset_save_btn": "Lưu Preset",
        "bill.unpaid": "còn nợ",
        "bill.done": "Xong",
        "bill.paid": "Đã trả",
        "bill.created_at": "Tạo lúc:",
        "bill.click_to_toggle": "Click để đổi trạng thái",
        "bill.unknown_month": "Không xác định",

        // Overview additional
        "overview.profile": "Thông tin cá nhân",
        "overview.profile_desc": "Quản lý thông tin tài khoản, thay đổi ảnh đại diện, mật khẩu và thông tin liên hệ của bạn.",
        "overview.manage_bills": "Quản lý Hóa đơn",
        "overview.manage_bills_desc": "Tạo và theo dõi hóa đơn tiền nhà hàng tháng. Xuất PDF, đánh dấu đã thu tiền.",
        "overview.manage_presets": "Thiết lập Bảng giá",
        "overview.manage_presets_desc": "Tạo các preset giá điện, nước, internet để tự động điền vào hóa đơn nhanh hơn.",
        "overview.stats": "Thống kê Kinh doanh",
        "overview.chart_bar": "Biểu đồ Cột (Bar)",
        "overview.chart_line": "Biểu đồ Đường (Line)",
        "overview.by_week": "Theo Tuần",
        "overview.by_month": "Theo Tháng",
        "overview.by_quarter": "Theo Quý",
        "overview.by_year": "Theo Năm",
        "overview.occupied_chart_title": "Số lượng phòng có khách",
        "overview.revenue": "Doanh thu từ hóa đơn",
        "overview.occupied_dataset": "Số phòng có khách",
        "overview.revenue_dataset": "Doanh thu (VNĐ)",
        "overview.week_prefix": "Tuần",
        "overview.month_prefix": "Tháng",
        "overview.quarter_prefix": "Quý",

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
        "profile.update": "Cập nhật thông tin",
        
        // Dropdown Menu
        "dropdown.profile": "Thông tin cá nhân",
        "dropdown.language": "Ngôn ngữ",
        "dropdown.theme": "Giao diện",
        "dropdown.theme_color": "Màu sắc",
        "dropdown.dark_mode": "Chế độ tối",
        "dropdown.upgrade": "Nâng cấp Pro",
        "dropdown.manage_pro": "Quản lý gói Pro",
        "dropdown.pro_active": "✓ Đang dùng",
        "dropdown.admin": "Quản trị Hệ thống",
        "dropdown.logout": "Đăng xuất",

        // Contract specific
        "contract.contracts_count": "hợp đồng",
        "contract.newest": "Mới nhất",
        "contract.no_data": "Không có",
        "contract.start_short": "Từ:",
        "contract.end_short": "Đến:",
        
        // Rooms specific additions
        "rooms.detail_tenant": "SĐT:",
        "rooms.add_media_note": "Thêm ghi chú cho ảnh/video này...",
        "rooms.edit_room_btn": "Sửa phòng",
        "rooms.delete_room_btn": "Xóa",
        
        // Bill specific additions
        "bill.month_year_format": "Tháng {month} Năm {year}",
        "bill.marked_paid": "Đã đánh dấu là Đã trả",
        "bill.marked_unpaid": "Đã đánh dấu là Còn nợ",

        // Profile Modal
        "profile.modal_title": "Thông tin cá nhân",
        "profile.avatar_click": "Click vào ảnh để thay đổi avatar",
        "profile.account_info": "Thông tin tài khoản",
        "profile.display_name": "Tên hiển thị",
        "profile.username_label": "Tên đăng nhập",
        "profile.username_readonly": "(không thể chỉnh)",
        "profile.change_password": "Đổi mật khẩu",
        "profile.password_hint": "(để trống nếu không muốn đổi)",
        "profile.new_password_placeholder": "Mật khẩu mới...",
        "profile.contact_info": "Thông tin liên lạc",
        "profile.phone": "Số điện thoại",
        "profile.address": "Địa chỉ",
        "profile.save_changes": "Lưu thay đổi",

        // Contract History
        "contract.history_subtitle": "Tra cứu lại lịch sử cho thuê của từng phòng.",

        // Bill Detail Modal
        "bill.detail_title": "Chi tiết Hóa đơn",
        "bill.edit_btn": "Sửa hóa đơn",
        "bill.export_pdf_btn": "Xuất PDF",
        "bill.qr_scan_label": "Quét mã QR để thanh toán",
        "bill.water_flat": "Khoán / Tự nhập",

        // Common & Pagination
        "common.add": "Thêm",
        "common.close": "Đóng",
        "common.edit": "Sửa",
        "common.delete": "Xóa",
        "common.save_changes": "Lưu thay đổi",
        "common.cancel": "Hủy",
        "pagination.prev": "Trang trước",
        "pagination.next": "Trang sau",
        
        // Export PDF modal
        "bill.export_pdf_title": "Chọn nội dung xuất PDF",
        "bill.export_bill": "Xuất Hóa đơn",
        "bill.export_bill_desc": "Chỉ nội dung hóa đơn, không kèm mã QR",
        "bill.export_qr": "Xuất Mã QR",
        "bill.export_qr_desc": "Chỉ mã QR thanh toán, hiển thị lớn trên A4",
        "bill.export_both": "Xuất cả hai",
        "bill.export_both_desc": "Hóa đơn trang 1 · Mã QR trang 2 (2 trang A4)",
        
        // Free limit
        "bill.free_limit": "Bản free là giới hạn tối đa 5 hóa đơn/tháng. Đăng ký PRO để tạo không giới hạn!",
        "rooms.free_limit": "Bản free là giới hạn tối đa 5 phòng. Đăng ký PRO để tạo không giới hạn!",

        // Contract Edit
        "contract.edit_title": "Chỉnh sửa Hợp đồng",
        "contract.start_date": "Ngày Bắt đầu",
        "contract.end_date": "Ngày Kết thúc",
        "contract.fullname": "Họ và tên",
        "contract.phone": "Số điện thoại",
        "contract.roommates": "Người ở ghép",
        "contract.update_success": "Cập nhật hợp đồng thành công",
        "contract.delete_confirm_msg": "Bạn có chắc chắn muốn xóa bản ghi hợp đồng này không?",
        "contract.delete_confirm_title": "Xóa hợp đồng",
        "contract.delete_success": "Đã xóa hợp đồng",

        // Topbar Search
        "topbar.search_rooms": "Tìm theo tên phòng...",
        "topbar.search_bills": "Tìm theo tên phòng/hóa đơn...",

        // Preview Modal
        "preview.tenant_count_unit": " người",

        // Profile Notification Popup
        "notify.title": "Thông báo",
        "notify.profile_heading": "Cập nhật hồ sơ cá nhân",
        "notify.profile_desc": "Bạn chưa cập nhật thông tin hiển thị. Vui lòng cập nhật để trải nghiệm tốt nhất.",
        "notify.update_btn": "Cập nhật ngay",

        // Pro Plan Labels (used dynamically in JS)
        "pro.bubble_title": "Nâng cấp Pro",
        "pro.manage_label": "Quản lý gói Pro",
        "pro.upgrade_label": "Nâng cấp Pro",
        "pro.free_plan_current": "Gói hiện tại",
        "pro.free_plan_old": "Gói cũ của bạn",
        "pro.plan_btn_active": "✓ Đang dùng Pro",
        "pro.plan_btn_upgrade": "👑 Nâng cấp Pro ngay",
        "pro.plan_modal_title": "✨ Chọn gói phù hợp với bạn",
        "pro.plan_modal_subtitle": "Nâng cấp Pro để mở khóa toàn bộ tính năng và quản lý không giới hạn",

        // Bill modal dropdown placeholders
        "bill.select_room_placeholder": "-- Chọn phòng --",
        "bill.preset_placeholder": "-- Tự nhập tay --",
        "bill.loading_rooms": "-- Đang tải phòng... --",
        "bill.no_occupied_rooms": "-- Không có phòng đang thuê --",
        "bill.electric_unit": "số",
        "bill.water_unit": "khối",
        "bill.vehicle_unit": "xe",
        "bill.price_amount": "Giá tiền",
        "bill.price_per_vehicle": "Giá 1 xe",
        "bill.vehicle_count": "Số lượng xe",

        // Room deletion confirmations
        "rooms.delete_confirm": "Bạn có chắc chắn muốn xóa phòng này?",
        "rooms.delete_occupied_confirm": "Phòng này đang có người thuê. Xóa sẽ kết thúc hợp đồng. Bạn có chắc chắn?"
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
        "rooms.page_title": "Room Management",
        "rooms.page_subtitle": "Track and manage your rental rooms easily.",
        "rooms.add_btn": "Add Room",
        "rooms.bulk_create": "Bulk Create",
        "rooms.delete_selected": "Delete Selected",
        "rooms.sort_default": "Default Sort",
        "rooms.sort_asc": "Name: A→Z",
        "rooms.sort_desc": "Name: Z→A",
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

        // Room Modal
        "room.status": "Status",
        "room.modal_add": "Add New Room",
        "room.modal_edit": "Edit Room",
        "room.cancel": "Cancel",
        "room.save": "Save Room",
        "room.search_placeholder": "Search by room name...",

        // Bill Section
        "bill.title": "Invoice Management",
        "bill.subtitle": "Create invoices and set up service prices.",
        "bill.search_placeholder": "Search by room name...",
        "bill.create_btn": "Create New Invoice",
        "bill.price_preset_btn": "Adjust Prices",
        "bill.modal_title": "Create New Invoice",
        "bill.select_room": "Select Room (Occupied)",
        "bill.select_preset": "Select Price Preset (Optional)",
        "bill.room_charge": "Room Charge (VND)",
        "bill.electric": "Electricity",
        "bill.electric_num": "Units Consumed",
        "bill.electric_price": "Price per Unit (VND)",
        "bill.water": "Water",
        "bill.water_total_label": "Enter total amount",
        "bill.water_volume_label": "Enter by volume",
        "bill.water_total_field": "Total Water Bill (VND)",
        "bill.water_volume_field": "Water Volume (m³)",
        "bill.water_price": "Price per m³ (VND)",
        "bill.other_services": "Other Services",
        "bill.management_fee": "Management Fee",
        "bill.internet_fee": "Internet Fee",
        "bill.parking_fee": "Parking Fee",
        "bill.save_btn": "Save Invoice",
        "bill.preview_title": "RENTAL INVOICE",
        "bill.preview_room": "Room:",
        "bill.preview_tenant": "Tenant:",
        "bill.preview_room_charge": "Room Charge",
        "bill.preview_electric": "Electricity",
        "bill.preview_water": "Water",
        "bill.preview_management": "Management Fee",
        "bill.preview_internet": "Internet Fee",
        "bill.preview_parking": "Parking Fee",
        "bill.preview_total": "GRAND TOTAL",
        "bill.no_bills": "No invoices have been created yet.",
        "bill.delete_selected": "Delete Selected",

        // Greeting
        "greeting.morning": "Good morning",
        "greeting.afternoon": "Good afternoon",
        "greeting.evening": "Good evening",
        "greeting.default": "Hello",

        // Missing Translations
        "rooms.detail_name": "Room Name",
        "rooms.detail_area": "Area",
        "rooms.detail_type": "Room Type",
        "rooms.detail_current_contract": "Current Contract",
        "rooms.detail_tenant": "Tenant:",
        "rooms.detail_tenant_count": "People:",
        "rooms.detail_start_date": "From:",
        "rooms.detail_end_date": "To:",
        "contract.history_title": "Contract History",
        "contract.history_detail_title": "Contract History Detail",
        "contract.room_info": "Room Info",
        "contract.tenant_rep": "Representative Tenant",
        "contract.contract_period": "Contract Period",
        "contract.start": "Start:",
        "contract.end": "End:",
        "contract.accompanying_list": "Accompanying People",
        "contract.no_data": "No data",
        "contract.created_date": "Created Date:",
        "bill.print_btn": "Print Bill",
        "bill.preset_title": "Price Presets",
        "bill.preset_name": "Preset Name",
        "bill.water_block": "Per cubic meter",
        "bill.water_total": "Total amount",
        "bill.other_services_label": "Optional Fees",
        "bill.preset_new_btn": "Create New",
        "bill.preset_save_btn": "Save Preset",
        "bill.unpaid": "unpaid",
        "bill.done": "Done",
        "bill.paid": "Paid",
        "bill.created_at": "Created at:",
        "bill.click_to_toggle": "Click to toggle status",
        "bill.unknown_month": "Unknown",

        // Overview additional
        "overview.profile": "Personal Information",
        "overview.profile_desc": "Manage account information, change avatar, password and contact details.",
        "overview.manage_bills": "Invoice Management",
        "overview.manage_bills_desc": "Create and track monthly rent invoices. Export PDF, mark as paid.",
        "overview.manage_presets": "Price Presets",
        "overview.manage_presets_desc": "Create presets for electricity, water, internet prices to auto-fill invoices faster.",
        "overview.stats": "Business Statistics",
        "overview.chart_bar": "Bar Chart",
        "overview.chart_line": "Line Chart",
        "overview.by_week": "By Week",
        "overview.by_month": "By Month",
        "overview.by_quarter": "By Quarter",
        "overview.by_year": "By Year",
        "overview.occupied_chart_title": "Occupied Rooms",
        "overview.revenue": "Revenue from Invoices",
        "overview.occupied_dataset": "Rooms with tenants",
        "overview.revenue_dataset": "Revenue (VND)",
        "overview.week_prefix": "Week",
        "overview.month_prefix": "Month",
        "overview.quarter_prefix": "Q",

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
        "profile.update": "Update Profile",
        
        // Dropdown Menu
        "dropdown.profile": "Profile Info",
        "dropdown.language": "Language",
        "dropdown.theme": "Theme",
        "dropdown.theme_color": "Colors",
        "dropdown.dark_mode": "Dark Mode",
        "dropdown.upgrade": "Upgrade Pro",
        "dropdown.manage_pro": "Manage Pro",
        "dropdown.pro_active": "✓ Active",
        "dropdown.admin": "System Admin",
        "dropdown.logout": "Logout",

        // Contract specific
        "contract.contracts_count": "contract(s)",
        "contract.newest": "Newest",
        "contract.no_data": "N/A",
        "contract.start_short": "From:",
        "contract.end_short": "To:",
        
        // Rooms specific additions
        "rooms.detail_tenant": "Phone:",
        "rooms.add_media_note": "Add note for this media...",
        "rooms.edit_room_btn": "Edit Room",
        "rooms.delete_room_btn": "Delete",
        
        // Bill specific additions
        "bill.month_year_format": "Month {month} Year {year}",
        "bill.marked_paid": "Marked as Paid",
        "bill.marked_unpaid": "Marked as Unpaid",

        // Profile Modal
        "profile.modal_title": "Personal Profile",
        "profile.avatar_click": "Click photo to change avatar",
        "profile.account_info": "Account Information",
        "profile.display_name": "Display Name",
        "profile.username_label": "Username",
        "profile.username_readonly": "(read-only)",
        "profile.change_password": "Change Password",
        "profile.password_hint": "(leave blank to keep current)",
        "profile.new_password_placeholder": "New password...",
        "profile.contact_info": "Contact Information",
        "profile.phone": "Phone Number",
        "profile.address": "Address",
        "profile.save_changes": "Save Changes",

        // Contract History
        "contract.history_subtitle": "Look up the rental history for each room.",

        // Bill Detail Modal
        "bill.detail_title": "Invoice Details",
        "bill.edit_btn": "Edit Invoice",
        "bill.export_pdf_btn": "Export PDF",
        "bill.qr_scan_label": "Scan QR code to pay",
        "bill.water_flat": "Flat / Manual",

        // Common & Pagination
        "common.add": "Add",
        "common.close": "Close",
        "common.edit": "Edit",
        "common.delete": "Delete",
        "common.save_changes": "Save Changes",
        "common.cancel": "Cancel",
        "pagination.prev": "Previous",
        "pagination.next": "Next",
        
        // Export PDF modal
        "bill.export_pdf_title": "Select PDF Export Content",
        "bill.export_bill": "Export Bill",
        "bill.export_bill_desc": "Bill content only, without QR code",
        "bill.export_qr": "Export QR",
        "bill.export_qr_desc": "Large QR code on A4 paper",
        "bill.export_both": "Export Both",
        "bill.export_both_desc": "Bill on page 1 · QR code on page 2 (2 pages A4)",
        
        // Free limit
        "bill.free_limit": "Free plan is limited to 5 bills/month. Upgrade to PRO to create unlimited bills!",
        "rooms.free_limit": "Free plan is limited to 5 rooms. Upgrade to PRO to create unlimited rooms!",

        // Contract Edit
        "contract.edit_title": "Edit Contract",
        "contract.start_date": "Start Date",
        "contract.end_date": "End Date",
        "contract.fullname": "Full Name",
        "contract.phone": "Phone Number",
        "contract.roommates": "Roommates",
        "contract.update_success": "Contract updated successfully",
        "contract.delete_confirm_msg": "Are you sure you want to delete this contract record?",
        "contract.delete_confirm_title": "Delete Contract",
        "contract.delete_success": "Contract deleted",

        // Topbar Search
        "topbar.search_rooms": "Search by room name...",
        "topbar.search_bills": "Search by room/invoice...",

        // Preview Modal
        "preview.tenant_count_unit": " people",

        // Profile Notification Popup
        "notify.title": "Notification",
        "notify.profile_heading": "Update Your Profile",
        "notify.profile_desc": "You haven't updated your display info yet. Please update for the best experience.",
        "notify.update_btn": "Update Now",

        // Pro Plan Labels (used dynamically in JS)
        "pro.bubble_title": "Upgrade to Pro",
        "pro.manage_label": "Manage Pro",
        "pro.upgrade_label": "Upgrade Pro",
        "pro.free_plan_current": "Current Plan",
        "pro.free_plan_old": "Your Previous Plan",
        "pro.plan_btn_active": "✓ Active Pro",
        "pro.plan_btn_upgrade": "👑 Upgrade to Pro",
        "pro.plan_modal_title": "✨ Choose the right plan for you",
        "pro.plan_modal_subtitle": "Upgrade to Pro to unlock all features and manage without limits",

        // Bill modal dropdown placeholders
        "bill.select_room_placeholder": "-- Select Room --",
        "bill.preset_placeholder": "-- Enter Manually --",
        "bill.loading_rooms": "-- Loading rooms... --",
        "bill.no_occupied_rooms": "-- No occupied rooms --",
        "bill.electric_unit": "units",
        "bill.water_unit": "m³",
        "bill.vehicle_unit": "vehicle(s)",
        "bill.price_amount": "Amount",
        "bill.price_per_vehicle": "Price per vehicle",
        "bill.vehicle_count": "Number of vehicles",

        // Room deletion confirmations
        "rooms.delete_title": "Delete Room",
        "rooms.delete_occupied_title": "⚠️ Warning - Occupied Room",
        "rooms.delete_confirm": "Are you sure you want to delete this room?",
        "rooms.delete_occupied_confirm": "This room has an active tenant. Deleting will end the contract. Are you sure?",
        "rooms.delete_success": "Room deleted",
        "rooms.delete_selected_confirm": "Are you sure you want to delete",
        "rooms.delete_selected_unit": "selected room(s)?"
    }
};

class I18nManager {
    constructor() {
        this.lang = localStorage.getItem('rentify_lang') || 'vi';
    }

    get currentLang() { return this.lang; }

    setLanguage(lang) {
        this.lang = lang;
        localStorage.setItem('rentify_lang', lang);
        this.updateDOM();
        // Update flag opacity for landing page
        const landingVi = document.getElementById('langViBtnLanding');
        const landingEn = document.getElementById('langEnBtnLanding');
        if (landingVi) landingVi.style.opacity = lang === 'vi' ? '1' : '0.5';
        if (landingEn) landingEn.style.opacity = lang === 'en' ? '1' : '0.5';
        // Update dropdown flag buttons
        const dropVi = document.getElementById('langViBtnDrop');
        const dropEn = document.getElementById('langEnBtnDrop');
        if (dropVi) dropVi.classList.toggle('inactive', lang !== 'vi');
        if (dropEn) dropEn.classList.toggle('inactive', lang !== 'en');

        // Trigger event for app.js
        window.dispatchEvent(new Event('languageChanged'));
    }

    t(key) {
        return (translations[this.lang] && translations[this.lang][key]) || key;
    }

    updateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = this.t(key);

            if (el.tagName === 'INPUT' && !['checkbox', 'radio', 'hidden'].includes(el.type)) {
                el.placeholder = translated;
            } else if (el.tagName === 'TEXTAREA') {
                el.placeholder = translated;
            } else if (el.tagName === 'OPTION') {
                // Translate option text but preserve the value attribute
                el.textContent = translated;
            } else {
                el.textContent = translated;
            }
        });

        // Update search placeholders (dynamic inputs added via JS)
        const roomSearch = document.getElementById('roomSearchInput');
        if (roomSearch) roomSearch.placeholder = this.t('room.search_placeholder');

        const billSearch = document.getElementById('billSearchInput');
        if (billSearch) billSearch.placeholder = this.t('bill.search_placeholder');

        // Update topbar search placeholder based on current section
        const topbarInput = document.getElementById('topbarSearchInput');
        if (topbarInput && window.app && window.app._topbarSearchSection) {
            if (window.app._topbarSearchSection === 'rooms') {
                topbarInput.placeholder = this.t('topbar.search_rooms');
            } else if (window.app._topbarSearchSection === 'bills') {
                topbarInput.placeholder = this.t('topbar.search_bills');
            }
        }

        // Update greeting
        if (window.app && window.app.updateGreeting) {
            window.app.updateGreeting();
        }

        // Re-render rooms so status badges use updated translations
        if (window.app && window.app.renderRooms) {
            window.app.renderRooms();
        }

        // Re-render bills if visible
        if (window.billApp && window.billApp.renderBills) {
            window.billApp.renderBills();
        }
    }

    init() {
        this.setLanguage(this.lang);
    }
}

window.i18n = new I18nManager();

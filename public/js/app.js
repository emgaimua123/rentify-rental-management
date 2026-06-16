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
        // Clear legacy localStorage data (migrated to DB)
        try {
            const legacyKeys = ['rentify_bills', 'rentify_bills_temp', 'rentify_presets',
                'rentify_presets_temp', 'rentify_subscriptions', 'rentify_pro_requests',
                'rentify_contract_history', 'rentify_global_pro_reset_v1'];
            legacyKeys.forEach(k => localStorage.removeItem(k));
        } catch (e) {}

        if (!localStorage.getItem('rentify_token')) {
            document.getElementById('landingPage').style.display = 'flex';
            document.getElementById('appContainer').style.display = 'none';
            const bubble = document.getElementById('proBubble');
            if (bubble) bubble.style.display = 'none';
            if (window.i18n) window.i18n.init();
            return;
        }
        document.getElementById('landingPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Theme init (dark mode)
        const savedTheme = localStorage.getItem('rentify_theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.checked = true;
        }

        // Sync Pro status BEFORE applying color (gradient is Pro-only — must know status first)
        try {
            const uStr = localStorage.getItem('rentify_user');
            if (uStr) {
                const u = JSON.parse(uStr);
                if (u.role !== 'ADMIN') await this.syncProStatus(u.id);
            }
        } catch(e) {}

        // Color theme init (syncProStatus above sanitizes gradient for free users)
        const savedColor = localStorage.getItem('rentify_color') || 'indigo';
        const savedColorName = localStorage.getItem('rentify_color_name') || 'Indigo';
        this.applyColor(savedColor, savedColorName);

        // Update Pro UI state on load
        this.updateProUI();

        // Language init
        window.addEventListener('languageChanged', () => {
            this.renderRooms();
            this.updateGreeting();
            this.updateLangFlags();
            this.updateProUI();
            this.renderCharts();
        });
        
        // initialize i18n
        if (window.i18n) {
            window.i18n.init();
        }
        this.updateLangFlags();
        
        // Cập nhật thông tin User trên Topbar & DB
        try {
            const token = localStorage.getItem('rentify_token');
            if (token) {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        localStorage.setItem('rentify_user', JSON.stringify(data.data));
                    }
                }
            }
            
            const userStr = localStorage.getItem('rentify_user');
            if (userStr) {
                const u = JSON.parse(userStr);
                if (u.avatar) {
                    document.getElementById('topbarAvatar').src = u.avatar;
                    document.getElementById('avatarDropMenuImg').src = u.avatar;
                }
                if (u.name) document.getElementById('avatarDropName').textContent = u.name;
                if (u.username) document.getElementById('avatarDropUsername').textContent = '@' + u.username;

                const profileDone = localStorage.getItem(`rentify_profile_setup_${u.id}`);
                if (!profileDone && (!u.name || u.name === u.username)) {
                    setTimeout(() => {
                        this.openUpdateProfilePromptModal();
                    }, 1000);
                }
            }
            this.updateAuthUI();
        } catch(e) {}

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const wrap = document.getElementById('avatarDropdownWrap');
            if (wrap && !wrap.contains(e.target)) {
                document.getElementById('avatarDropdown')?.classList.remove('open');
            }
        });

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
                const targetId = item.getAttribute('data-section');
                this.switchSection(targetId);
                this.closeSidebar(); // close drawer on mobile after nav
            });
        });

        // Initialize topbar search for current section
        this.updateTopbarSearch('appSectionRoomList');

        // Event listeners for multi-room preview
        ['multiPrefix', 'letterFrom', 'letterTo', 'numberFrom', 'numberTo'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', () => this.updateMultiRoomPreview());
        });
        
        // Charts rendered on-demand: when navigating to Overview (switchSection)
        // and after bills load (renderBills → renderCharts). No premature call here.
    },

    switchSection(sectionId) {
        // Remove active class from all sidebar menu items
        const menuItems = document.querySelectorAll('#sidebarMenu a[data-section]');
        menuItems.forEach(i => {
            if (i.getAttribute('data-section') === sectionId) {
                i.classList.add('active');
            } else {
                i.classList.remove('active');
            }
        });
        
        // Hide all sections
        document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Update topbar search bar
        this.updateTopbarSearch(sectionId);
        
        // If switching to admin section, initialize the tab
        if (sectionId === 'appSectionAdmin') {
            this.switchAdminTab('users');
        }
        
        // Render charts if overview
        if (sectionId === 'appSectionOverview') {
            this.renderCharts();
        }
    },

    isPro() {
        try {
            const uStr = localStorage.getItem('rentify_user');
            if (uStr) {
                const u = JSON.parse(uStr);
                if (u.role === 'ADMIN') return true;
            }
        } catch(e) {}
        return localStorage.getItem('rentify_pro') === 'true';
    },

    _GRADIENT_COLORS: new Set(['sunset','ocean','aurora','candy','forest','midnight','flame','nebula','sakura','cyber','solar']),

    _sanitizeColor() {
        const color = localStorage.getItem('rentify_color') || 'indigo';
        if (this._GRADIENT_COLORS.has(color)) {
            localStorage.setItem('rentify_color', 'indigo');
            localStorage.setItem('rentify_color_name', 'Indigo');
            this.applyColor('indigo', 'Indigo');
        }
    },

    async syncProStatus(userId) {
        try {
            const res = await api.getSubscription();
            if (res.success && res.data && res.data.status === 'active') {
                const expires = new Date(res.data.expiresAt);
                if (expires > new Date()) {
                    localStorage.setItem('rentify_pro', 'true');
                    return;
                }
            }
        } catch(e) {}
        localStorage.removeItem('rentify_pro');
        this._sanitizeColor();
    },

    isTestUser() {
        try {
            const uStr = localStorage.getItem('rentify_user');
            if (uStr) {
                const u = JSON.parse(uStr);
                if (u.role !== 'ADMIN') return true;
            }
        } catch(e) {}
        return false;
    },

    updateProUI() {
        const pro = this.isPro();
        const loggedIn = !!localStorage.getItem('rentify_token');
        // Bubble — only show for logged-in free users
        const bubble = document.getElementById('proBubble');
        if (bubble) {
            if (!loggedIn || pro) {
                bubble.style.display = 'none';
            } else {
                bubble.style.display = 'flex';
                bubble.classList.remove('is-pro');
                bubble.textContent = '👑';
                bubble.title = window.i18n ? window.i18n.t('pro.bubble_title') : 'Nâng cấp Pro';
            }
        }
        // Avatar dropdown Pro badge
        const proBadge = document.getElementById('avatarProBadge');
        const subLabel = document.getElementById('subscriptionMenuLabel');
        const subBadge = document.getElementById('subscriptionMenuBadge');
        if (proBadge) proBadge.style.display = pro ? 'block' : 'none';
        if (subLabel) subLabel.textContent = window.i18n ? window.i18n.t(pro ? 'pro.manage_label' : 'pro.upgrade_label') : (pro ? 'Quản lý gói Pro' : 'Nâng cấp Pro');
        if (subBadge) subBadge.style.display = pro ? 'inline-flex' : 'none';

        // Update dropdown menu item action based on pro status
        const subMenuItem = document.getElementById('subscriptionMenuItem');
        if (subMenuItem) {
            if (pro) {
                subMenuItem.onclick = () => {
                    document.getElementById('avatarDropdown').classList.remove('open');
                    this.openSubscriptionManageModal();
                };
                subMenuItem.style.color = '#f59e0b';
            } else {
                subMenuItem.onclick = () => {
                    document.getElementById('avatarDropdown').classList.remove('open');
                    this.openPlanModal();
                };
                subMenuItem.style.color = '';
            }
        }

        // Crown icons (hide when Pro)
        const crowns = ['crownBulkCreate','crownPresetPrice','crownExportPDF','crownMediaUpload'];
        crowns.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = pro ? 'none' : '';
        });

        // Media upload lock
        const mediaInput = document.getElementById('roomImages');
        const mediaLocked = document.getElementById('mediaUploadLocked');
        if (mediaInput && mediaLocked) {
            mediaInput.style.display = pro ? 'block' : 'none';
            mediaLocked.style.display = pro ? 'none' : 'block';
        }

        // Plan modal buttons
        const freePlanBtn = document.getElementById('freePlanBtn');
        const proPlanBtn = document.getElementById('proPlanBtn');
        if (freePlanBtn && proPlanBtn) {
            const t = (key, fallback) => window.i18n ? window.i18n.t(key) : fallback;
            if (pro) {
                freePlanBtn.textContent = t('pro.free_plan_old', 'Gói cũ của bạn');
                freePlanBtn.className = 'plan-btn free-btn';
                proPlanBtn.textContent = t('pro.plan_btn_active', '✓ Đang dùng Pro');
                proPlanBtn.className = 'plan-btn current-btn';
                proPlanBtn.onclick = null;
            } else {
                freePlanBtn.textContent = t('pro.free_plan_current', 'Gói hiện tại');
                freePlanBtn.className = 'plan-btn current-btn';
                proPlanBtn.textContent = t('pro.plan_btn_upgrade', '👑 Nâng cấp Pro ngay');
                proPlanBtn.className = 'plan-btn pro-btn';
                proPlanBtn.onclick = () => this.openQRModal('1_month', 99000);
            }
        }

        // Gradient locks
        const gradLocks = ['lockSunset','lockOcean','lockAurora','lockCandy','lockForest','lockMidnight','lockFlame','lockNebula','lockSakura','lockCyber','lockSolar'];
        gradLocks.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = pro ? 'none' : 'flex';
        });
        const gradNote = document.getElementById('gradientProNote');
        if (gradNote) gradNote.style.display = pro ? 'none' : 'inline-flex';
    },

    openPlanModal() {
        document.getElementById('avatarDropdown')?.classList.remove('open');
        this.updateProUI();
        if (this.isPro()) {
            const userStr = localStorage.getItem('rentify_user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (user && user.role === 'ADMIN') {
                this.showToast('Bạn là Admin, sở hữu tài khoản Pro vĩnh viễn!', 'info');
                return;
            }
            this.openSubscriptionManageModal();
        } else {
            document.getElementById('planCompareModal').classList.add('active');
        }
    },

    closePlanModal() {
        document.getElementById('planCompareModal').classList.remove('active');
    },

    openUpdateProfilePromptModal() {
        const modal = document.getElementById('updateProfilePromptModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
    },

    closeUpdateProfilePromptModal() {
        const modal = document.getElementById('updateProfilePromptModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = ''; }, 300);
        }
    },

    async activatePro() {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        try {
            await api.createOrUpdateSubscription({
                plan: '1_month',
                status: 'active',
                expiresAt: expiresAt.toISOString(),
                autoRenew: true
            });
        } catch(e) {
            console.error('activatePro error:', e);
        }
        localStorage.setItem('rentify_pro', 'true');
        this.updateProUI();
        this.closePlanModal();
        this.showToast('🎉 Chúc mừng! Bạn đã nâng cấp lên Pro thành công!', 'success');
    },

    async openSubscriptionManageModal() {
        const userStr = localStorage.getItem('rentify_user');
        if (!userStr) return;

        let sub = null;
        try {
            const res = await api.getSubscription();
            if (res.success && res.data) {
                sub = res.data;
            }
        } catch(e) {}

        // If no sub found for this pro user, create a default monthly one starting now
        if (!sub) {
            const expires = new Date();
            expires.setDate(expires.getDate() + 30);
            try {
                const res = await api.createOrUpdateSubscription({
                    plan: '1_month',
                    expiresAt: expires.toISOString(),
                    autoRenew: true,
                    status: 'active'
                });
                if (res.success) sub = res.data;
            } catch(e) {}
            if (!sub) {
                sub = { plan: '1_month', expiresAt: expires.toISOString(), autoRenew: true, status: 'active' };
            }
        }

        // Render subscription details
        const subPlanName = document.getElementById('subPlanName');
        const subExpiresAt = document.getElementById('subExpiresAt');
        const subAutoRenewStatus = document.getElementById('subAutoRenewStatus');
        const btnSwitchToYearly = document.getElementById('btnSwitchToYearly');
        const btnToggleAutoRenew = document.getElementById('btnToggleAutoRenew');
        const btnCancelSub = document.getElementById('btnCancelSub');
        
        if (subPlanName) {
            subPlanName.textContent = sub.plan === '1_year' ? 'Gói Năm (849,000 VNĐ)' : 'Gói Tháng (99,000 VNĐ)';
            subPlanName.style.background = sub.plan === '1_year' 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'var(--theme-gradient)';
            subPlanName.style.webkitBackgroundClip = 'text';
            subPlanName.style.webkitTextFillColor = 'transparent';
            subPlanName.style.backgroundClip = 'text';
        }
        
        if (subExpiresAt) {
            const date = new Date(sub.expiresAt);
            subExpiresAt.textContent = date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Days left countdown
        const subDaysLeft = document.getElementById('subDaysLeft');
        if (subDaysLeft) {
            const now = new Date();
            const exp = new Date(sub.expiresAt);
            const diffMs = exp - now;
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                subDaysLeft.textContent = diffDays + ' ngày';
                subDaysLeft.style.color = diffDays <= 7 ? '#ef4444' : diffDays <= 14 ? '#f59e0b' : 'var(--primary-color)';
            } else {
                subDaysLeft.textContent = 'Đã hết hạn';
                subDaysLeft.style.color = '#ef4444';
            }
        }
        
        if (subAutoRenewStatus) {
            if (sub.status === 'cancelled') {
                subAutoRenewStatus.textContent = 'Sắp hết hạn (Đã hủy)';
                subAutoRenewStatus.style.background = 'rgba(239, 68, 68, 0.12)';
                subAutoRenewStatus.style.color = '#ef4444';
            } else if (sub.autoRenew) {
                subAutoRenewStatus.textContent = 'Tự động gia hạn';
                subAutoRenewStatus.style.background = 'rgba(16, 185, 129, 0.12)';
                subAutoRenewStatus.style.color = '#10b981';
            } else {
                subAutoRenewStatus.textContent = 'Không gia hạn';
                subAutoRenewStatus.style.background = 'rgba(245, 158, 11, 0.12)';
                subAutoRenewStatus.style.color = '#f59e0b';
            }
        }
        
        if (btnSwitchToYearly) {
            btnSwitchToYearly.style.display = (sub.plan === '1_month' && sub.status !== 'cancelled') ? 'flex' : 'none';
        }
        
        if (btnToggleAutoRenew) {
            btnToggleAutoRenew.style.display = sub.status !== 'cancelled' ? 'flex' : 'none';
            btnToggleAutoRenew.innerHTML = sub.autoRenew 
                ? `<i class='bx bx-refresh'></i> Tắt tự động gia hạn`
                : `<i class='bx bx-refresh'></i> Bật tự động gia hạn`;
        }
        
        if (btnCancelSub) {
            btnCancelSub.style.display = sub.status !== 'cancelled' ? 'flex' : 'none';
        }
        
        document.getElementById('subscriptionManageModal').classList.add('active');
    },

    closeSubscriptionManageModal() {
        document.getElementById('subscriptionManageModal').classList.remove('active');
    },

    switchToYearlyPlan() {
        const userStr = localStorage.getItem('rentify_user');
        if (!userStr) return;
        // Close subscription modal first
        this.closeSubscriptionManageModal();
        // Open QR payment modal with yearly plan
        this.currentProPlan = 'upgrade_to_yearly';
        document.getElementById('qrAmountDisplay').textContent = '849,000 VNĐ';
        const user = JSON.parse(userStr);
        document.getElementById('qrContentDisplay').textContent = 'UPGRADE YEARLY ' + (user ? user.username : 'khach');
        document.getElementById('qrPaymentModal').classList.add('active');
    },

    async toggleAutoRenew() {
        try {
            const res = await api.getSubscription();
            if (res.success && res.data) {
                const sub = res.data;
                const newAutoRenew = !sub.autoRenew;
                const updateRes = await api.createOrUpdateSubscription({
                    plan: sub.plan,
                    status: sub.status,
                    expiresAt: sub.expiresAt,
                    autoRenew: newAutoRenew
                });
                if (updateRes.success) {
                    const msg = newAutoRenew ? 'Đã bật tự động gia hạn!' : 'Đã tắt tự động gia hạn!';
                    this.showToast(msg, 'success');
                    this.openSubscriptionManageModal(); // Refresh UI
                }
            }
        } catch(e) {
            this.showToast('Lỗi cập nhật', 'error');
        }
    },

    async cancelSubscription() {
        if (!confirm('Bạn có chắc chắn muốn hủy gia hạn gói đăng ký Pro không? Bạn vẫn có thể sử dụng các tính năng Pro cho tới khi hết hạn.')) {
            return;
        }

        try {
            const res = await api.getSubscription();
            if (res.success && res.data) {
                const sub = res.data;
                const updateRes = await api.createOrUpdateSubscription({
                    plan: sub.plan,
                    status: 'cancelled',
                    expiresAt: sub.expiresAt,
                    autoRenew: false
                });
                if (updateRes.success) {
                    this.showToast('Đã hủy đăng ký thành công!', 'success');
                    this.openSubscriptionManageModal(); // Refresh UI
                }
            }
        } catch(e) {
            this.showToast('Lỗi hủy đăng ký', 'error');
        }
    },

    openQRModal(plan, amount) {
        this.currentProPlan = plan;
        document.getElementById('qrAmountDisplay').textContent = new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
        
        const userStr = localStorage.getItem('rentify_user');
        const user = userStr ? JSON.parse(userStr) : null;
        document.getElementById('qrContentDisplay').textContent = 'PRO ' + (user ? user.username : 'khach');
        
        document.getElementById('qrPaymentModal').classList.add('active');
    },

    async sendProRequest() {
        const userStr = localStorage.getItem('rentify_user');
        if (!userStr) {
            this.showToast('Vui lòng đăng nhập trước!', 'error');
            return;
        }
        const user = JSON.parse(userStr);
        const plan = this.currentProPlan;
        const type = plan === 'upgrade_to_yearly' ? 'upgrade_to_yearly' : 'new_subscription';
        const amount = plan === '1_year' || plan === 'upgrade_to_yearly' ? 849000 : 99000;

        try {
            const res = await api.createProRequest({
                plan,
                type,
                amount,
                username: user.username
            });

            if (res.success) {
                document.getElementById('qrPaymentModal').classList.remove('active');
                this.closePlanModal();
                this.closeSubscriptionManageModal();
                this.showToast('Đã gửi yêu cầu! Admin sẽ duyệt sớm nhất.', 'success');
            } else {
                this.showToast(res.message || 'Lỗi gửi yêu cầu', 'error');
                document.getElementById('qrPaymentModal').classList.remove('active');
            }
        } catch(e) {
            console.error('sendProRequest error:', e);
            this.showToast('Lỗi kết nối server', 'error');
        }
    },


    checkRoomLimit() {
        if (this.isPro()) return true;
        const count = this.rooms ? this.rooms.length : 0;
        if (count >= 5) {
            this.openPlanModal();
            this.showToast('Bản Free tối đa 5 phòng. Nâng cấp Pro để không giới hạn!', 'error');
            return false;
        }
        return true;
    },

    checkBilllimit() {
        if (this.isPro()) return true;
        const bills = (window.billApp && window.billApp.bills) ? window.billApp.bills : [];
        if (bills.length >= 5) {
            this.openPlanModal();
            this.showToast('Bản Free tối đa 5 hóa đơn. Nâng cấp Pro để không giới hạn!', 'error');
            return false;
        }
        return true;
    },

    // ===== THEME COLOR =====
    applyColor(color, name) {
        if (color === 'indigo') {
            document.documentElement.removeAttribute('data-color');
        } else {
            document.documentElement.setAttribute('data-color', color);
        }
        const nameEl = document.getElementById('currentThemeName');
        if (nameEl) nameEl.textContent = name;
        // Update active swatch
        document.querySelectorAll('.theme-swatch').forEach(s => {
            s.classList.toggle('active', s.getAttribute('data-color') === color);
        });
    },

    setThemeColor(color, name, isGradient = false) {
        if (isGradient && !this.isPro()) {
            this.openPlanModal();
            this.showToast('Gradient theme chỉ dành cho Pro!', 'error');
            return;
        }
        localStorage.setItem('rentify_color', color);
        localStorage.setItem('rentify_color_name', name);
        this.applyColor(color, name);
    },

    toggleDarkMode(isDark) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('rentify_theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('rentify_theme', 'light');
        }
    },

    toggleThemePanel() {
        const panel = document.getElementById('themePanel');
        const chevron = document.getElementById('themePanelChevron');
        if (!panel) return;
        panel.classList.toggle('open');
        if (chevron) chevron.style.transform = panel.classList.contains('open') ? 'rotate(180deg)' : '';
    },

    // ===== LANGUAGE FLAGS =====
    updateLangFlags() {
        const lang = (window.i18n && window.i18n.currentLang) || localStorage.getItem('rentify_lang') || 'vi';
        const viBtn = document.getElementById('langViBtnDrop');
        const enBtn = document.getElementById('langEnBtnDrop');
        if (viBtn) viBtn.classList.toggle('inactive', lang !== 'vi');
        if (enBtn) enBtn.classList.toggle('inactive', lang !== 'en');
        // Landing flags
        const viLanding = document.getElementById('langViBtnLanding');
        const enLanding = document.getElementById('langEnBtnLanding');
        if (viLanding) viLanding.style.opacity = lang === 'vi' ? '1' : '0.4';
        if (enLanding) enLanding.style.opacity = lang === 'en' ? '1' : '0.4';
    },

    updateTopbarSearch(sectionId) {
        const bar = document.getElementById('topbarSearchBar');
        const input = document.getElementById('topbarSearchInput');
        if (!bar || !input) return;
        
        // Always flex so layout holds
        bar.style.display = 'flex';
        
        if (sectionId === 'appSectionRoomList') {
            bar.style.visibility = 'visible';
            input.placeholder = window.i18n ? window.i18n.t('topbar.search_rooms') : 'Tìm theo tên phòng...';
            input.value = '';
            this._topbarSearchSection = 'rooms';
        } else if (sectionId === 'appSectionBill') {
            bar.style.visibility = 'visible';
            input.placeholder = window.i18n ? window.i18n.t('topbar.search_bills') : 'Tìm theo tên phòng/hóa đơn...';
            input.value = '';
            this._topbarSearchSection = 'bills';
        } else {
            bar.style.visibility = 'hidden';
            input.value = '';
            this._topbarSearchSection = null;
        }
    },

    handleTopbarSearch(value) {
        if (this._topbarSearchSection === 'rooms') {
            this.filterRooms(value);
        } else if (this._topbarSearchSection === 'bills') {
            if (window.billApp) billApp.filterBills(value);
        }
    },

    highlightRoom(roomId) {
        setTimeout(() => {
            const cards = document.querySelectorAll('.room-card');
            cards.forEach(card => {
                if (card.getAttribute('data-id') === String(roomId)) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('highlight-flash');
                    setTimeout(() => card.classList.remove('highlight-flash'), 2000);
                }
            });
        }, 400);
    },

    highlightBill(billId) {
        setTimeout(() => {
            const cards = document.querySelectorAll('.bill-card');
            cards.forEach(card => {
                if (card.getAttribute('data-bill-id') === String(billId)) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('highlight-flash');
                    setTimeout(() => card.classList.remove('highlight-flash'), 2000);
                }
            });
        }, 400);
    },

    updateGreeting() {
        const hour = new Date().getHours();
        let greetingKey = 'greeting.default';
        let icon = "<i class='bx bx-sun'></i>";

        if (hour >= 5 && hour < 12) {
            greetingKey = 'greeting.morning';
            icon = "<i class='bx bx-sun'></i>";
        } else if (hour >= 12 && hour < 18) {
            greetingKey = 'greeting.afternoon';
            icon = "<i class='bx bx-cloud'></i>";
        } else {
            greetingKey = 'greeting.evening';
            icon = "<i class='bx bx-moon'></i>";
        }

        const greeting = window.i18n ? window.i18n.t(greetingKey) : greetingKey;

        // Lấy tên người dùng từ localStorage
        let userName = 'Admin';
        try {
            const userStr = localStorage.getItem('rentify_user');
            if (userStr) {
                const u = JSON.parse(userStr);
                if (u.name) userName = u.name;
            }
        } catch(e) {}

        const greetingElement = document.getElementById('greetingTitle');
        if (greetingElement) {
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
                const searchEl = document.getElementById('roomSearchInput');
                if (searchEl) searchEl.value = '';
                this.applySort();
                this.renderRooms();
            }
            // Silently ignore failures — server may still be warming up
        } catch (e) {
            // Network/parse error — ignore on initial load
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

    filterRooms(query) {
        const q = (query || '').trim().toLowerCase();
        if (!q) {
            this.rooms = [...this.originalRooms];
        } else {
            this.rooms = this.originalRooms.filter(r =>
                r.name.toLowerCase().includes(q)
            );
        }
        this.applySort();
        this.renderRooms();
    },

    renderRooms() {
        const grid = document.getElementById('roomGrid');
        grid.innerHTML = '';

        this.rooms.forEach(room => {
            const imgMedia = room.medias && room.medias.find(m => m.type === 'IMAGE');
            const imgSrc = imgMedia ? imgMedia.url : '';

            const card = document.createElement('div');
            card.className = 'room-card';
            card.setAttribute('data-id', room.id);
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
        if (!this.checkRoomLimit()) return;
        document.getElementById('modalTitle').innerText = 'Thêm phòng mới';
        document.getElementById('roomIdInput').value = '';
        document.getElementById('roomForm').reset();
        
        document.getElementById('contractSection').style.display = 'none';

        // Apply media lock state
        this.updateProUI();

        document.getElementById('roomModal').classList.add('active');
        document.getElementById('saveRoomBtn').disabled = false;
        document.getElementById('saveRoomBtn').innerText = 'Lưu phòng';
    },

    openCreateMultipleModal() {
        if (!this.isPro()) {
            this.openPlanModal();
            this.showToast('Tạo nhiều phòng cùng lúc chỉ dành cho Pro!', 'error');
            return;
        }
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
            // Reset button state
            const btn = document.getElementById('saveRoomBtn');
            btn.disabled = false;
            btn.innerText = 'Lưu phòng';

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
                document.getElementById('tenantName').value = c.tenantName || '';
                document.getElementById('tenantCount').value = c.tenantCount || 1;
                document.getElementById('tenantPhone').value = c.tenantPhone || '';
                document.getElementById('tenantEmail').value = c.tenantEmail || '';
                document.getElementById('contractStart').value = c.startDate ? c.startDate.split('T')[0] : '';
                document.getElementById('contractEnd').value = c.endDate ? c.endDate.split('T')[0] : '';
                // Restore per-tenant fields
                this.renderTenantFields();
                if (c.tenantList && c.tenantList.length > 0) {
                    c.tenantList.forEach((t, i) => {
                        const ni = document.getElementById(`tenant_name_${i + 2}`);
                        const pi = document.getElementById(`tenant_phone_${i + 2}`);
                        if (ni) ni.value = t.name || '';
                        if (pi) pi.value = t.phone || '';
                    });
                }
            } else {
                document.getElementById('contractSection').style.display = 'none';
                document.getElementById('tenantName').value = '';
                document.getElementById('tenantCount').value = '1';
                document.getElementById('tenantPhone').value = '';
                document.getElementById('tenantEmail').value = '';
                document.getElementById('contractStart').value = '';
                document.getElementById('contractEnd').value = '';
                document.getElementById('tenantFieldsContainer').innerHTML = '';
            }

            document.getElementById('roomModal').classList.add('active');
        }, 100); // Wait for fadeout
    },

    openPreviewModal(id) {
        const room = this.rooms.find(r => r.id === id);
        if (!room) return;

        this._slideshowRoomId = id;
        this._slideIndex = 0;

        document.getElementById('previewName').innerText = room.name;
        document.getElementById('previewPrice').innerText = `${room.price.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('previewArea').innerText = `${room.area} m²`;
        document.getElementById('previewType').innerText = room.type;

        const badge = document.getElementById('previewStatus');
        const statusLabel = window.i18n ? window.i18n.t(`status.${room.status}`) : room.status;
        badge.innerText = statusLabel;
        badge.className = `status-badge status-${room.status}`;

        if (room.status === 'Occupied' && room.contracts && room.contracts.length > 0) {
            const c = room.contracts[0];
            document.getElementById('previewContractSection').style.display = 'block';
            document.getElementById('previewTenantName').innerText = c.tenantName;
            const tenantUnit = window.i18n ? window.i18n.t('preview.tenant_count_unit') : ' người';
            document.getElementById('previewTenantCount').innerText = c.tenantCount + tenantUnit;
            document.getElementById('previewStartDate').innerText = new Date(c.startDate).toLocaleDateString('vi-VN');
            document.getElementById('previewEndDate').innerText = new Date(c.endDate).toLocaleDateString('vi-VN');
        } else {
            document.getElementById('previewContractSection').style.display = 'none';
        }

        // Build slideshow slides
        const track = document.getElementById('slideshowTrack');
        track.innerHTML = '';
        this._slides = [];

        if (room.medias && room.medias.length > 0) {
            room.medias.forEach(media => {
                const slide = document.createElement('div');
                slide.className = 'slide-item';
                if (media.type === 'IMAGE') {
                    slide.innerHTML = `<img src="${media.url}" alt="ảnh phòng">`;
                } else {
                    slide.innerHTML = `<video src="${media.url}" controls></video>`;
                }
                track.appendChild(slide);
                this._slides.push({ mediaId: media.id || media.url });
            });
        } else {
            const empty = document.createElement('div');
            empty.className = 'slide-item';
            empty.innerHTML = `<i class='bx bx-image' style="font-size:5rem; color:#555;"></i>`;
            track.appendChild(empty);
            this._slides = [{ mediaId: '__empty__' }];
        }

        this.updateSlideUI();

        document.getElementById('btnEditRoom').onclick = () => this.openEditModal(room.id);
        document.getElementById('btnDeleteRoom').onclick = () => this.deleteRoom(room.id);
        document.getElementById('previewModal').classList.add('active');
    },

    updateSlideUI() {
        const total = this._slides.length;
        const idx = this._slideIndex;
        const track = document.getElementById('slideshowTrack');
        track.style.transform = `translateX(-${idx * 100}%)`;
        document.getElementById('slideCounter').textContent = `${idx + 1} / ${total}`;
        document.getElementById('slidePrev').disabled = idx === 0;
        document.getElementById('slideNext').disabled = idx === total - 1;

        // Load note for this slide
        const notes = JSON.parse(localStorage.getItem(`rentify_media_notes_${this._slideshowRoomId}`) || '{}');
        const mediaId = this._slides[idx]?.mediaId || '';
        document.getElementById('slideNoteInput').value = notes[mediaId] || '';
    },

    slideNext() {
        if (this._slideIndex < this._slides.length - 1) {
            this._slideIndex++;
            this.updateSlideUI();
        }
    },

    slidePrev() {
        if (this._slideIndex > 0) {
            this._slideIndex--;
            this.updateSlideUI();
        }
    },

    saveSlideNote() {
        const roomId = this._slideshowRoomId;
        const mediaId = this._slides[this._slideIndex]?.mediaId;
        if (!roomId || !mediaId || mediaId === '__empty__') return;
        const key = `rentify_media_notes_${roomId}`;
        const notes = JSON.parse(localStorage.getItem(key) || '{}');
        notes[mediaId] = document.getElementById('slideNoteInput').value;
        localStorage.setItem(key, JSON.stringify(notes));
    },

    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    },

    onContractStartChange() {
        const start = document.getElementById('contractStart').value;
        const endInput = document.getElementById('contractEnd');
        if (start) endInput.min = start;
    },

    renderTenantFields() {
        const count = parseInt(document.getElementById('tenantCount').value) || 1;
        const container = document.getElementById('tenantFieldsContainer');
        container.innerHTML = '';
        if (count <= 1) return;
        const title = document.createElement('div');
        title.className = 'form-section-title';
        title.textContent = `Thông tin ${count - 1} người ở cùng`;
        container.appendChild(title);
        for (let i = 2; i <= count; i++) {
            const row = document.createElement('div');
            row.className = 'form-group-row';
            row.innerHTML = `
                <div class="form-group">
                    <label>Người ${i} - Họ tên</label>
                    <input type="text" id="tenant_name_${i}" placeholder="Nguyễn Văn ${String.fromCharCode(64 + i)}" style="width:100%">
                </div>
                <div class="form-group">
                    <label>Người ${i} - SĐT</label>
                    <input type="tel" id="tenant_phone_${i}" placeholder="09xx xxx xxx" style="width:100%">
                </div>
            `;
            container.appendChild(row);
        }
    },

    collectTenantList() {
        const count = parseInt(document.getElementById('tenantCount').value) || 1;
        const list = [];
        for (let i = 2; i <= count; i++) {
            const nameEl = document.getElementById(`tenant_name_${i}`);
            const phoneEl = document.getElementById(`tenant_phone_${i}`);
            list.push({
                name: nameEl ? nameEl.value : '',
                phone: phoneEl ? phoneEl.value : ''
            });
        }
        return list;
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
            if (!data.tenantName.trim()) {
                this.showToast('Vui lòng nhập Tên khách thuê!', 'error');
                btn.disabled = false;
                btn.innerText = 'Lưu phòng';
                return;
            }
            data.tenantCount = Number(document.getElementById('tenantCount').value);
            data.tenantPhone = document.getElementById('tenantPhone').value;
            data.tenantEmail = document.getElementById('tenantEmail').value;
            data.tenantList = this.collectTenantList();
            data.startDate = document.getElementById('contractStart').value;
            data.endDate = document.getElementById('contractEnd').value;

            // Validate contract dates
            if (data.startDate && data.endDate && data.endDate <= data.startDate) {
                this.showToast('Ngày kết thúc phải sau ngày bắt đầu!', 'error');
                btn.disabled = false;
                btn.innerText = 'Lưu phòng';
                return;
            }
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
            
            // LƯU LỊCH SỬ HỢP ĐỒNG (Contract History)
            if (data.status === 'Occupied') {
                this.saveContractHistory(roomId, data.name, data);
            }

            // Bước 2: Tải lên Ảnh/Video
            const files = document.getElementById('roomImages').files;
            if (files && files.length > 0) {
                this.showToast('Đang tải ảnh/video lên...', 'success');
                for (let i = 0; i < files.length; i++) {
                    await api.uploadImage(roomId, files[i]);
                }
            }

            this.showToast('Thao tác thành công!', 'success');
            this.closeModals();
            await this.loadRooms();
            this.highlightRoom(roomId);
        } catch (err) {
            this.showToast('Lỗi kết nối', 'error');
            btn.disabled = false;
            btn.innerText = 'Lưu phòng';
        }
    },

    deleteRoom(id) {
        const room = this.rooms.find(r => String(r.id) === String(id));
        const isOccupied = room && room.status === 'Occupied';
        const t = key => window.i18n ? window.i18n.t(key) : null;
        const msg = isOccupied
            ? (t('rooms.delete_occupied_confirm') || 'Phòng này đang có người thuê. Xóa sẽ kết thúc hợp đồng. Bạn có chắc chắn?')
            : (t('rooms.delete_confirm') || 'Bạn có chắc chắn muốn xóa phòng này?');
        const title = isOccupied
            ? (t('rooms.delete_occupied_title') || '⚠️ Cảnh báo - Phòng có người thuê')
            : (t('rooms.delete_title') || 'Xóa phòng');

        this.showConfirmDialog(msg, title, async () => {
            try {
                const res = await api.deleteRoom(id);
                if (res.success) {
                    this.showToast(t('rooms.delete_success') || 'Đã xóa phòng', 'success');
                    this.closeModals();
                    this.loadRooms();
                } else {
                    this.showToast(res.message, 'error');
                }
            } catch (err) {
                this.showToast('Lỗi kết nối', 'error');
            }
        }, 'Xóa');
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

    deleteSelectedRooms() {
        const checkboxes = document.querySelectorAll('.room-checkbox:checked');
        if (checkboxes.length === 0) return;
        const t = key => window.i18n ? window.i18n.t(key) : null;
        const msg = `${t('rooms.delete_selected_confirm') || 'Bạn có chắc chắn muốn xóa'} ${checkboxes.length} ${t('rooms.delete_selected_unit') || 'phòng đã chọn?'}`;
        this.showConfirmDialog(msg, t('rooms.delete_title') || 'Xóa phòng', async () => {
            let successCount = 0;
            let errorCount = 0;

            const btn = document.getElementById('btnDeleteSelected');
            btn.disabled = true;
            btn.innerText = 'Đang xóa...';

            for (const cb of checkboxes) {
                const id = cb.getAttribute('data-id');
                try {
                    const res = await api.deleteRoom(id);
                    if (res.success) { successCount++; } else { errorCount++; }
                } catch (err) { errorCount++; }
            }

            this.showToast(`Đã xóa ${successCount} phòng. Lỗi: ${errorCount}`, successCount > 0 ? 'success' : 'error');
            btn.disabled = false;
            btn.innerHTML = `<i class='bx bx-trash'></i> Xóa đã chọn (<span id="selectedCount">0</span>)`;
            btn.style.display = 'none';
            this.loadRooms();
        }, 'Xóa');
    },

    showConfirmDialog(message, title, onConfirm, confirmLabel) {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmModalTitle').textContent = title || 'Xác nhận';
        document.getElementById('confirmModalMessage').textContent = message;
        document.getElementById('confirmModalCancel').textContent = 'Hủy';
        document.getElementById('confirmModalConfirm').textContent = confirmLabel || 'Xác nhận';

        // Clone buttons to remove old event listeners
        const oldConfirm = document.getElementById('confirmModalConfirm');
        const oldCancel = document.getElementById('confirmModalCancel');
        const newConfirm = oldConfirm.cloneNode(true);
        const newCancel = oldCancel.cloneNode(true);
        oldConfirm.parentNode.replaceChild(newConfirm, oldConfirm);
        oldCancel.parentNode.replaceChild(newCancel, oldCancel);

        newConfirm.onclick = () => { modal.classList.remove('active'); onConfirm(); };
        newCancel.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

        modal.classList.add('active');
    },

    showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : (type === 'info' ? 'info-circle' : 'error-circle');
        
        toast.innerHTML = `
            <i class='bx bx-${icon}'></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // --- AUTH LOGIC ---
    toggleAvatarDropdown() {
        document.getElementById('avatarDropdown').classList.toggle('open');
    },

    openProfileDropdown() {
        document.getElementById('avatarDropdown').classList.remove('open');
        this.openProfileModal();
    },

    openProfileModal() {
        try {
            const userStr = localStorage.getItem('rentify_user');
            if (userStr) {
                const u = JSON.parse(userStr);
                const avatarSrc = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=4F46E5&color=fff`;
                document.getElementById('profilePreview').src = avatarSrc;
                document.getElementById('profilePreviewName').textContent = u.name || '';
                document.getElementById('profileName').value = u.name || '';
                document.getElementById('profileUsername').value = u.username || '';
                document.getElementById('profileAvatar').value = u.avatar || '';
                document.getElementById('profilePhone').value = u.phone || '';
                document.getElementById('profileEmail').value = u.email || '';
                document.getElementById('profileAddress').value = u.address || '';
                document.getElementById('profilePassword').value = '';
            }
        } catch(e) {}
        document.getElementById('profileModal').classList.add('active');
    },

    closeProfileModal() {
        document.getElementById('profileModal').classList.remove('active');
    },

    previewProfileAvatar(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profilePreview').src = e.target.result;
            document.getElementById('profilePreviewName').textContent = document.getElementById('profileName').value || 'User';
            // Store base64 in avatar input
            document.getElementById('profileAvatar').value = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    onProfileAvatarUrlChange(url) {
        if (url) {
            document.getElementById('profilePreview').src = url;
        }
    },

    async handleProfileUpdate(e) {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('rentify_user');
            const u = userStr ? JSON.parse(userStr) : {};
            u.name    = document.getElementById('profileName')?.value || u.name;
            u.avatar  = document.getElementById('profileAvatar')?.value || u.avatar;
            u.phone   = document.getElementById('profilePhone')?.value || '';
            u.email   = document.getElementById('profileEmail')?.value || '';
            u.address = document.getElementById('profileAddress')?.value || '';

            // Avatar fallback
            const avatarSrc = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=4F46E5&color=fff`;

            // Always save to DB
            const newPass = document.getElementById('profilePassword')?.value;
            const token = localStorage.getItem('rentify_token');
            const apiRes = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: u.name, avatar: u.avatar, email: u.email, ...(newPass ? { password: newPass } : {}) })
            });
            const apiData = await apiRes.json();
            if (apiData.success) {
                // Merge server response back so name/avatar are always up-to-date from DB
                Object.assign(u, apiData.data);
                // Mark profile as completed so popup doesn't show again
                localStorage.setItem(`rentify_profile_setup_${u.id}`, 'true');
            }

            localStorage.setItem('rentify_user', JSON.stringify(u));

            // Update topbar
            const finalAvatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=4F46E5&color=fff`;
            document.getElementById('topbarAvatar').src = finalAvatar;
            document.getElementById('avatarDropMenuImg').src = finalAvatar;
            document.getElementById('avatarDropName').textContent = u.name || '';

            // Update greeting
            this.updateGreeting();
            this.showToast('Cập nhật thông tin thành công!', 'success');
            this.closeProfileModal();
        } catch(err) {
            this.showToast('Lưu thông tin thất bại', 'error');
        }
    },

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar || !overlay) return;
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    },
    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar || !overlay) return;
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    },

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
                if (data.data.role !== 'ADMIN') await this.syncProStatus(data.data.id);
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
                localStorage.removeItem('rentify_pro'); // New account always starts without Pro
                this._sanitizeColor(); // Free account cannot use gradient theme

                // Show profile update notification
                this.closeAuthModals();
                document.getElementById('landingPage').style.display = 'none';
                document.getElementById('appContainer').style.display = 'flex';
                
                const profileDoneKey = `rentify_profile_setup_${data.data.id}`;
                if (!localStorage.getItem(profileDoneKey) && (!data.data.name || data.data.name === data.data.username)) {
                    this.openUpdateProfilePromptModal();
                }
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
        this.openProfileModal();
        this.showToast('Mời bạn cập nhật hồ sơ cá nhân.', 'success');
    },

    updateAuthUI() {
        const userStr = localStorage.getItem('rentify_user');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userProfileBtn = document.getElementById('userProfileBtn');
        const userNameSpan = document.getElementById('userNameSpan');
        const userAvatar = document.getElementById('userAvatar');
        const adminPanelLink = document.getElementById('adminPanelLink');

        if (userStr) {
            const user = JSON.parse(userStr);
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (userProfileBtn) userProfileBtn.style.display = 'flex';
            if (userNameSpan) userNameSpan.textContent = user.name;
            if (userAvatar) userAvatar.src = user.avatar;
            if (adminPanelLink) adminPanelLink.style.display = user.username === 'admin' ? 'flex' : 'none';
            
            // Show notifications
            this.checkNotifications(user.id);
            this.checkProRequestNotifications();
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
            if (userProfileBtn) userProfileBtn.style.display = 'none';
            if (adminPanelLink) adminPanelLink.style.display = 'none';
        }
    },
    
    // ===== ADMIN SYSTEM =====
    switchAdminTab(tab) {
        document.getElementById('btnTabUsers').classList.toggle('active', tab === 'users');
        document.getElementById('btnTabRequests').classList.toggle('active', tab === 'requests');
        document.getElementById('adminTabUsers').style.display = tab === 'users' ? 'block' : 'none';
        document.getElementById('adminTabRequests').style.display = tab === 'requests' ? 'block' : 'none';
        
        if(tab === 'users') this.renderAdminUsers();
        if(tab === 'requests') this.renderAdminRequests();
    },

    async renderAdminUsers() {
        try {
            const token = localStorage.getItem('rentify_token');
            const res = await fetch('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if(data.success) {
                const search = document.getElementById('adminUserSearch').value.toLowerCase();
                const users = data.data.filter(u => u.username.toLowerCase().includes(search) || u.name.toLowerCase().includes(search));

                const grid = document.getElementById('adminUsersGrid');
                grid.innerHTML = users.map(u => {
                    const sub = u.subscription;
                    const hasPro = sub && sub.status === 'active' && new Date(sub.expiresAt) > new Date();
                    const planLabel = hasPro
                        ? (sub.plan === '1_year' ? 'Pro Năm' : 'Pro Tháng')
                        : null;
                    const expiresLabel = hasPro
                        ? new Date(sub.expiresAt).toLocaleDateString('vi-VN')
                        : null;
                    return `
                    <div style="background:var(--bg-color); padding:1rem; border-radius:12px; border:1px solid ${hasPro ? 'rgba(245,158,11,0.4)' : 'var(--border-color)'}; display:flex; flex-direction:column; gap:0.5rem;">
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <img src="${u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||'User')}&background=4F46E5&color=fff`}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:600; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                                    ${u.name}
                                    ${u.username === 'admin' ? '<span style="color:#ef4444; font-size:0.75rem; font-weight:600;">(ADMIN)</span>' : ''}
                                    ${hasPro ? `<span style="background:linear-gradient(135deg,#f59e0b,#ec4899); color:#fff; font-size:0.7rem; padding:1px 7px; border-radius:99px; font-weight:600;">👑 ${planLabel}</span>` : ''}
                                </div>
                                <div style="font-size:0.82rem; color:var(--text-muted);">@${u.username}</div>
                            </div>
                        </div>
                        <div style="font-size:0.82rem; color:var(--text-muted);">
                            Thành viên từ: ${new Date(u.createdAt).toLocaleDateString('vi-VN')}
                            ${hasPro ? `<br><span style="color:#f59e0b;">Pro đến: ${expiresLabel}</span>` : ''}
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;">
                            <button class="btn-secondary" style="flex:1; padding:0.3rem 0.5rem; font-size:0.82rem;" onclick="app.adminSendBanner(${u.id})"><i class='bx bx-bell'></i> Thông báo</button>
                            ${hasPro && u.username !== 'admin' ? `<button class="btn-secondary" style="flex:1; padding:0.3rem 0.5rem; font-size:0.82rem; color:#ef4444; border-color:#ef4444;" onclick="app.openRevokeProModal(${u.id}, '${u.name}', '${u.username}')"><i class='bx bx-shield-x'></i> Thu hồi Pro</button>` : ''}
                        </div>
                    </div>`;
                }).join('');
            }
        } catch (e) {
            console.error('Admin users error:', e);
        }
    },

    openRevokeProModal(userId, name, username) {
        this._pendingRevokeUserId = userId;
        const input = document.getElementById('revokeProReasonInput');
        if (input) input.value = '';
        const info = document.getElementById('revokeProTargetInfo');
        if (info) info.innerHTML = `Thu hồi Pro của: <strong>${name}</strong> <span style="color:var(--text-muted);">@${username}</span>`;
        document.getElementById('revokeProModal').classList.add('active');
    },

    closeRevokeProModal() {
        document.getElementById('revokeProModal').classList.remove('active');
        this._pendingRevokeUserId = null;
    },

    async confirmRevokePro() {
        const userId = this._pendingRevokeUserId;
        if (!userId) return;
        const reason = (document.getElementById('revokeProReasonInput').value || '').trim();
        if (!reason) {
            this.showToast('Vui lòng nhập lý do thu hồi!', 'error');
            return;
        }
        try {
            const res = await api.revokeProSubscription(userId, reason);
            if (res.success) {
                this.closeRevokeProModal();
                this.showToast('Đã thu hồi gói Pro!', 'success');
                this.renderAdminUsers();
            } else {
                this.showToast(res.message || 'Lỗi thu hồi', 'error');
            }
        } catch(e) {
            this.showToast('Lỗi kết nối server', 'error');
        }
    },

    closeProRevokedModal() {
        document.getElementById('proRevokedModal')?.classList.remove('active');
        localStorage.removeItem('rentify_pro');
        this._sanitizeColor();
        this.updateProUI();
    },

    async renderAdminRequests() {
        const list = document.getElementById('adminRequestsList');
        list.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">Đang tải...</div>`;

        try {
            const res = await api.getProRequests();
            if (!res.success) {
                list.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">Lỗi tải dữ liệu.</div>`;
                return;
            }

            const pending = (res.data || []).filter(r => r.status === 'PENDING');

            if(pending.length === 0) {
                list.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">Không có yêu cầu nào đang chờ.</div>`;
                return;
            }

            list.innerHTML = pending.map(r => {
                const isUpgrade = r.type === 'upgrade_to_yearly' || r.plan === 'upgrade_to_yearly';
                const planLabel = isUpgrade
                    ? '⬆️ Nâng cấp lên Gói Năm (849k)'
                    : r.plan === '1_year' ? '1 Năm (849k)' : '1 Tháng (99k)';
                const typeLabel = isUpgrade
                    ? `<span style="font-size:0.7rem; background:rgba(16,185,129,0.15); color:#10b981; padding:2px 8px; border-radius:99px; font-weight:600;">Nâng cấp gói</span>`
                    : `<span style="font-size:0.7rem; background:rgba(99,102,241,0.15); color:var(--primary-color); padding:2px 8px; border-radius:99px; font-weight:600;">Cấp mới</span>`;
                const dateStr = r.date || r.createdAt;
                return `
                <div style="background:var(--bg-color); padding:1rem; border-radius:12px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">Yêu cầu từ: @${r.username || r.userId} ${typeLabel}</div>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">Gói: ${planLabel} &nbsp;|&nbsp; Ngày gửi: ${new Date(dateStr).toLocaleString('vi-VN')}</div>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-shrink:0;">
                        <button class="btn-primary" style="background:#10b981; white-space:nowrap;" onclick="app.approveRequest(${r.id})">Phê duyệt</button>
                        <button class="btn-secondary" style="color:#ef4444; white-space:nowrap;" onclick="app.rejectRequest(${r.id})">Từ chối</button>
                    </div>
                </div>`;
            }).join('');
        } catch(e) {
            list.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">Lỗi kết nối server.</div>`;
        }
    },

    async approveRequest(reqId) {
        try {
            const res = await api.updateProRequest(reqId, { status: 'APPROVED' });
            if (res.success) {
                this.showToast('Đã phê duyệt!', 'success');
                this.renderAdminRequests();
                this.renderAdminUsers();
            } else {
                this.showToast(res.message || 'Lỗi phê duyệt', 'error');
            }
        } catch(e) {
            this.showToast('Lỗi kết nối server', 'error');
        }
    },

    openRejectReasonModal(reqId) {
        this._pendingRejectId = reqId;
        const input = document.getElementById('rejectReasonInput');
        if (input) input.value = '';
        document.getElementById('rejectReasonModal').classList.add('active');
    },

    closeRejectReasonModal() {
        document.getElementById('rejectReasonModal').classList.remove('active');
        this._pendingRejectId = null;
    },

    async confirmRejectWithReason() {
        const reqId = this._pendingRejectId;
        if (!reqId) return;
        const reason = (document.getElementById('rejectReasonInput').value || '').trim();
        if (!reason) {
            this.showToast('Vui lòng nhập lý do từ chối!', 'error');
            return;
        }
        try {
            const res = await api.updateProRequest(reqId, { status: 'REJECTED', rejectionReason: reason });
            if (res.success) {
                this.closeRejectReasonModal();
                this.showToast('Đã từ chối yêu cầu!', 'success');
                this.renderAdminRequests();
            } else {
                this.showToast(res.message || 'Lỗi từ chối', 'error');
            }
        } catch(e) {
            this.showToast('Lỗi kết nối server', 'error');
        }
    },

    async rejectRequest(reqId) {
        this.openRejectReasonModal(reqId);
    },
    
    adminSendBanner(userId) {
        const msg = prompt('Nhập nội dung thông báo gửi cho người dùng này:');
        if(msg) {
            this.createNotification(userId, msg, 'info');
            this.showToast('Đã gửi thông báo!', 'success');
        }
    },
    
    createNotification(userId, message, type) {
        const notifs = JSON.parse(localStorage.getItem('rentify_notifications') || '[]');
        notifs.push({ id: Date.now(), userId, message, type, isRead: false });
        localStorage.setItem('rentify_notifications', JSON.stringify(notifs));
    },
    
    checkNotifications(userId) {
        const notifs = JSON.parse(localStorage.getItem('rentify_notifications') || '[]');
        const unread = notifs.find(n => n.userId === userId && !n.isRead);
        if (unread) {
            const modal = document.getElementById('adminNotificationModal');
            const msgEl = document.getElementById('adminNotificationMessage');
            if (modal && msgEl) {
                msgEl.textContent = unread.message;
                modal.classList.add('active');
                
                // Mark read
                unread.isRead = true;
                localStorage.setItem('rentify_notifications', JSON.stringify(notifs));
                
                // If it's an approval, set local pro status to true
                if(unread.message.includes('phê duyệt')) {
                    localStorage.setItem('rentify_pro', 'true');
                    this.updateProUI();
                }
            }
        }
    },

    closeAdminNotificationModal() {
        document.getElementById('adminNotificationModal')?.classList.remove('active');
    },

    closeProApprovalModal() {
        document.getElementById('proApprovalModal')?.classList.remove('active');
        this.syncProStatus().then(() => this.updateProUI());
    },

    closeProRejectionModal() {
        document.getElementById('proRejectionModal')?.classList.remove('active');
    },

    async checkProRequestNotifications() {
        try {
            const userStr = localStorage.getItem('rentify_user');
            if (!userStr) return;
            const u = JSON.parse(userStr);
            if (u.role === 'ADMIN' || u.username === 'admin') return;

            // Check server-side notifications (e.g. Pro revoked)
            try {
                const nRes = await api.getUserNotifications();
                if (nRes.success && nRes.data && nRes.data.length > 0) {
                    for (const notif of nRes.data) {
                        await api.markNotificationRead(notif.id);
                        if (notif.type === 'PRO_REVOKED') {
                            const reasonBox = document.getElementById('proRevokedReasonBox');
                            const reasonText = document.getElementById('proRevokedReasonText');
                            if (notif.reason && reasonBox && reasonText) {
                                reasonText.textContent = notif.reason;
                                reasonBox.style.display = 'block';
                            } else if (reasonBox) {
                                reasonBox.style.display = 'none';
                            }
                            localStorage.removeItem('rentify_pro');
                            this.updateProUI();
                            document.getElementById('proRevokedModal')?.classList.add('active');
                            return;
                        }
                    }
                }
            } catch(e) {}

            const res = await api.getProRequests();
            if (!res.success || !res.data) return;

            const unread = res.data.filter(r =>
                (r.status === 'APPROVED' || r.status === 'REJECTED') && !r.seenByUser
            );

            for (const req of unread) {
                await api.markProRequestSeen(req.id);

                if (req.status === 'APPROVED') {
                    const isUpgrade = req.type === 'upgrade_to_yearly' || req.plan === 'upgrade_to_yearly';
                    const planLabel = isUpgrade
                        ? 'Nâng cấp lên Gói Năm (12 tháng)'
                        : req.plan === '1_year' ? 'Gói Pro 1 Năm' : 'Gói Pro 1 Tháng';

                    const msgEl = document.getElementById('proApprovalMessage');
                    const detailsEl = document.getElementById('proApprovalDetails');
                    if (msgEl) msgEl.textContent = `Yêu cầu đăng ký ${planLabel} của bạn đã được Admin phê duyệt thành công!`;
                    if (detailsEl) {
                        const durationDays = (isUpgrade || req.plan === '1_year') ? 365 : 30;
                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + durationDays);
                        detailsEl.innerHTML = `
                            <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.88rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="color:var(--text-muted);">Gói đăng ký:</span>
                                    <strong style="color:#10b981;">${planLabel}</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="color:var(--text-muted);">Thời hạn:</span>
                                    <strong>${durationDays === 365 ? '12 tháng' : '1 tháng'}</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="color:var(--text-muted);">Hiệu lực đến:</span>
                                    <strong>${expiresAt.toLocaleDateString('vi-VN', { year:'numeric', month:'long', day:'numeric' })}</strong>
                                </div>
                            </div>`;
                    }

                    localStorage.setItem('rentify_pro', 'true');
                    this.updateProUI();
                    document.getElementById('proApprovalModal')?.classList.add('active');
                    break;

                } else if (req.status === 'REJECTED') {
                    const isUpgrade = req.type === 'upgrade_to_yearly' || req.plan === 'upgrade_to_yearly';
                    const planLabel = isUpgrade
                        ? 'Nâng cấp lên Gói Năm'
                        : req.plan === '1_year' ? 'Gói Pro 1 Năm' : 'Gói Pro 1 Tháng';

                    const planInfoEl = document.getElementById('proRejectionPlanInfo');
                    if (planInfoEl) planInfoEl.textContent = `Yêu cầu đăng ký ${planLabel} của bạn không được chấp thuận.`;

                    const reasonBox = document.getElementById('proRejectionReasonBox');
                    const reasonText = document.getElementById('proRejectionReasonText');
                    if (req.rejectionReason && reasonBox && reasonText) {
                        reasonText.textContent = req.rejectionReason;
                        reasonBox.style.display = 'block';
                    } else if (reasonBox) {
                        reasonBox.style.display = 'none';
                    }

                    document.getElementById('proRejectionModal')?.classList.add('active');
                    break;
                }
            }
        } catch(e) {}
    },
    
    // ===== CHART RENDERING =====
    _replaceCanvas(id) {
        const old = document.getElementById(id);
        if (!old || !old.parentElement) return null;
        const c = document.createElement('canvas');
        c.id = id;
        old.parentElement.replaceChild(c, old);
        return c;
    },

    renderCharts() {
        if (!window.Chart) return;

        const typeSelect = document.getElementById('chartTypeSelect');
        const timeframeSelect = document.getElementById('chartTimeframeSelect');
        if (!typeSelect || !timeframeSelect) return;

        const type = typeSelect.value || 'bar';
        const timeframe = timeframeSelect.value || 'month';
        const ct = key => (window.i18n ? window.i18n.t(key) : null);

        const bills = (window.billApp && Array.isArray(window.billApp.bills)) ? window.billApp.bills : [];

        // Destroy old instances, then replace canvas elements for a clean Chart.js state
        try { if (this.occupiedRoomsChartInstance) this.occupiedRoomsChartInstance.destroy(); } catch(e) {}
        try { if (this.revenueChartInstance) this.revenueChartInstance.destroy(); } catch(e) {}
        this.occupiedRoomsChartInstance = null;
        this.revenueChartInstance = null;

        const ctxRooms = this._replaceCanvas('occupiedRoomsChart');
        const ctxRev   = this._replaceCanvas('revenueChart');

        if (!bills.length) {
            [ctxRooms, ctxRev].forEach(c => {
                if (!c) return;
                const w = (c.parentElement ? c.parentElement.clientWidth : 0) || 400;
                c.width = w; c.height = 220;
                const ctx2d = c.getContext('2d');
                if (!ctx2d) return;
                ctx2d.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#9ca3af';
                ctx2d.font = '14px Inter, sans-serif';
                ctx2d.textAlign = 'center';
                ctx2d.fillText('Chưa có dữ liệu hóa đơn', w / 2, 110);
            });
            return;
        }

        // ── Helper: parse "Tháng M/YYYY" → Date(year, month-1, 1) ──────────────
        const parseBillMonth = (monthStr) => {
            if (!monthStr) return null;
            const m = monthStr.match(/(\d+)\/(\d{4})/);
            if (!m) return null;
            return new Date(parseInt(m[2]), parseInt(m[1]) - 1, 1);
        };

        // ── Helper: get sortKey + displayKey from a Date ─────────────────────
        const getKeys = (date) => {
            if (!date || isNaN(date.getTime())) return null;
            if (timeframe === 'week') {
                const firstDay = new Date(date.getFullYear(), 0, 1);
                const weekNum  = Math.ceil(((date - firstDay) / 86400000 + firstDay.getDay() + 1) / 7);
                return { sortKey: `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`,
                         displayKey: `${ct('overview.week_prefix') || 'Tuần'} ${weekNum}/${date.getFullYear()}` };
            } else if (timeframe === 'month') {
                return { sortKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                         displayKey: `${ct('overview.month_prefix') || 'Tháng'} ${date.getMonth() + 1}/${date.getFullYear()}` };
            } else if (timeframe === 'quarter') {
                const q = Math.ceil((date.getMonth() + 1) / 3);
                return { sortKey: `${date.getFullYear()}-Q${q}`,
                         displayKey: `${ct('overview.quarter_prefix') || 'Quý'} ${q}/${date.getFullYear()}` };
            } else {
                return { sortKey: `${date.getFullYear()}`, displayKey: `${date.getFullYear()}` };
            }
        };

        const groups = {};
        const ensureGroup = (sortKey, displayKey) => {
            if (!groups[sortKey]) groups[sortKey] = { display: displayKey, revenue: 0, occupiedRooms: new Set() };
        };

        // ── REVENUE: chỉ tính hóa đơn đã thanh toán, group theo tháng hóa đơn ──
        bills.forEach(b => {
            const date = parseBillMonth(b.month) || new Date(b.dateCreated || b.createdAt);
            const keys = getKeys(date);
            if (!keys) return;
            const { sortKey, displayKey } = keys;
            ensureGroup(sortKey, displayKey);
            if (b.paid) {
                groups[sortKey].revenue += (typeof b.totalAmount === 'number' ? b.totalAmount : 0);
            }
            // Đảm bảo period xuất hiện trên trục dù chưa trả
            ensureGroup(sortKey, displayKey);
        });

        // ── OCCUPIED ROOMS: lấy từ rooms + contracts ─────────────────────────
        // Phòng status Occupied → dùng contract startDate/endDate để xác định tháng nào có khách
        const rooms = (window.app && Array.isArray(window.app.rooms)) ? window.app.rooms : [];
        rooms.forEach(room => {
            if (!room.contracts || !room.contracts.length) {
                // Phòng Occupied không có contract → tính tháng hiện tại
                if (room.status === 'Occupied') {
                    const keys = getKeys(new Date());
                    if (keys) {
                        ensureGroup(keys.sortKey, keys.displayKey);
                        groups[keys.sortKey].occupiedRooms.add(room.id);
                    }
                }
                return;
            }
            room.contracts.forEach(c => {
                const start = c.startDate ? new Date(c.startDate) : null;
                const end   = c.endDate   ? new Date(c.endDate)   : new Date();
                if (!start) return;
                // Iterate each month the contract covers
                const cur = new Date(start.getFullYear(), start.getMonth(), 1);
                const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
                while (cur <= endMonth) {
                    const keys = getKeys(new Date(cur));
                    if (keys) {
                        ensureGroup(keys.sortKey, keys.displayKey);
                        groups[keys.sortKey].occupiedRooms.add(room.id);
                    }
                    cur.setMonth(cur.getMonth() + 1);
                }
            });
        });

        // Nếu không có rooms data, fallback: count unique roomIds từ tất cả bills (mọi trạng thái)
        if (!rooms.length) {
            bills.forEach(b => {
                const date = parseBillMonth(b.month) || new Date(b.dateCreated || b.createdAt);
                const keys = getKeys(date);
                if (!keys || !b.roomId) return;
                ensureGroup(keys.sortKey, keys.displayKey);
                groups[keys.sortKey].occupiedRooms.add(b.roomId);
            });
        }

        const sortedKeys        = Object.keys(groups).sort();
        const labels            = sortedKeys.map(k => groups[k].display);
        const revenueData       = sortedKeys.map(k => groups[k].revenue);
        const occupiedRoomsData = sortedKeys.map(k => groups[k].occupiedRooms.size);
        const primaryColor      = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#4f46e5';

        const sharedOpts = {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 350 },
        };

        if (ctxRooms) {
            this.occupiedRoomsChartInstance = new Chart(ctxRooms, {
                type,
                data: {
                    labels,
                    datasets: [{
                        label: ct('overview.occupied_dataset') || 'Số phòng có khách',
                        data: occupiedRoomsData,
                        backgroundColor: primaryColor + 'bb',
                        borderColor: primaryColor,
                        borderWidth: 2,
                        borderRadius: type === 'bar' ? 4 : 0,
                        tension: 0.3,
                        fill: type === 'line'
                    }]
                },
                options: { ...sharedOpts, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } } }
            });
        }

        if (ctxRev) {
            this.revenueChartInstance = new Chart(ctxRev, {
                type,
                data: {
                    labels,
                    datasets: [{
                        label: ct('overview.revenue_dataset') || 'Doanh thu (VNĐ)',
                        data: revenueData,
                        backgroundColor: '#10b981bb',
                        borderColor: '#10b981',
                        borderWidth: 2,
                        borderRadius: type === 'bar' ? 4 : 0,
                        tension: 0.3,
                        fill: type === 'line'
                    }]
                },
                options: {
                    ...sharedOpts,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: v => {
                                    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
                                    if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
                                    return v;
                                }
                            }
                        }
                    }
                }
            });
        }
    },
    
    // ===== CONTRACT HISTORY =====
    saveContractHistory(roomId, roomName, data) {
        // Contracts are now stored in DB via the room API — no localStorage needed
        // This method is kept for backward compatibility but does nothing
    },

    async renderContractHistory() {
        const list = document.getElementById('contractHistoryList');
        if (!list) return;

        list.innerHTML = `<div style="text-align:center; padding: 2rem; color:var(--text-muted)">Đang tải...</div>`;

        try {
            const token = localStorage.getItem('rentify_token');
            const res = await fetch('/api/rooms/contract-history', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!data.success) {
                list.innerHTML = `<div style="text-align:center; padding: 3rem; color:var(--text-muted)">Lỗi tải dữ liệu.</div>`;
                return;
            }

            // Build history from rooms that have contracts
            const rooms = (data.data || []).filter(r => r.contracts && r.contracts.length > 0);

            if (rooms.length === 0) {
                list.innerHTML = `<div style="text-align:center; padding: 3rem; color:var(--text-muted)">Chưa có dữ liệu lịch sử hợp đồng.</div>`;
                return;
            }

            // Store for openContractDetailModal
            this._contractHistoryData = rooms;

            list.innerHTML = rooms.map(h => `
                <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden;">
                    <div onclick="app.toggleRoomContracts('${h.id}')" style="padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: rgba(0,0,0,0.02);">
                        <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-color);">
                            <i class='bx bx-door-open' style="color: var(--primary-color); margin-right: 0.5rem;"></i>${h.name}
                            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400; margin-left: 0.5rem;">(${h.contracts.length} ${i18n.t('contract.contracts_count')})</span>
                        </div>
                        <i class='bx bx-chevron-down' id="icon_${h.id}" style="transition: transform 0.2s;"></i>
                    </div>
                    <div id="contracts_${h.id}" style="display: none; padding: 1rem; border-top: 1px solid var(--border-color);">
                        ${h.contracts.slice().reverse().map((c, idx) => `
                            <div onclick="app.openContractDetailModal('${h.id}', '${c.id}')" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary-color)'" onmouseout="this.style.borderColor='var(--border-color)'">
                                <div>
                                    <div style="font-weight: 600; color: var(--text-main); margin-bottom: 0.25rem;">${c.tenantName || 'N/A'} ${idx === 0 ? `<span style="background: var(--primary-color); color: white; padding: 2px 6px; border-radius: 12px; font-size: 0.7rem; margin-left: 0.5rem;">${i18n.t('contract.newest')}</span>` : ''}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted);">${i18n.t('rooms.detail_tenant')} ${c.tenantPhone || i18n.t('contract.no_data')} | ${i18n.t('contract.start_short')} ${c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : 'N/A'} - ${i18n.t('contract.end_short')} ${c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                                </div>
                                <i class='bx bx-right-arrow-alt' style="color: var(--text-muted); font-size: 1.25rem;"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } catch(e) {
            list.innerHTML = `<div style="text-align:center; padding: 3rem; color:var(--text-muted)">Lỗi kết nối server.</div>`;
        }
    },

    toggleRoomContracts(roomId) {
        const el = document.getElementById(`contracts_${roomId}`);
        const icon = document.getElementById(`icon_${roomId}`);
        if (el.style.display === 'none') {
            el.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        } else {
            el.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    },

    openContractDetailModal(roomId, contractId) {
        // Use _contractHistoryData populated by renderContractHistory
        const historyData = this._contractHistoryData || [];
        const roomHistory = historyData.find(h => String(h.id) === String(roomId));
        if (!roomHistory) return;

        const contract = roomHistory.contracts.find(c => String(c.id) === String(contractId));
        if (!contract) return;

        // roomHistory.name is the room name
        const roomName = roomHistory.name;

        const lang = (window.i18n && window.i18n.currentLang) || 'vi';
        const isEn = lang === 'en';

        // Duration
        const startD = contract.startDate ? new Date(contract.startDate) : null;
        const endD = contract.endDate ? new Date(contract.endDate) : null;
        let durationText = '—';
        if (startD && endD) {
            const diffMs = endD - startD;
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            const months = Math.floor(diffDays / 30);
            const days = diffDays % 30;
            durationText = months > 0
                ? (isEn ? `${months} month(s) ${days > 0 ? days + ' day(s)' : ''}` : `${months} tháng ${days > 0 ? days + ' ngày' : ''}`)
                : (isEn ? `${diffDays} day(s)` : `${diffDays} ngày`);
        }

        // All tenants: main + list
        const allTenants = [
            {
                name: contract.tenantName || '—',
                phone: contract.tenantPhone || '—',
                email: contract.tenantEmail || null,
                isMain: true
            },
            ...(contract.tenantList || []).map(t => ({ name: t.name || '—', phone: t.phone || '—', isMain: false }))
        ];

        const tenantCardsHTML = allTenants.map((t, idx) => `
            <div style="background: ${t.isMain ? 'linear-gradient(135deg, rgba(var(--primary-rgb,99,102,241),0.08), rgba(var(--primary-rgb,99,102,241),0.03))' : 'var(--bg-color)'}; border: 1px solid ${t.isMain ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: 12px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 42px; height: 42px; border-radius: 50%; background: ${t.isMain ? 'var(--theme-gradient)' : 'rgba(0,0,0,0.06)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${t.isMain ? 'white' : 'var(--text-muted)'}; font-size: 1.1rem; font-weight: 700;">
                    ${t.isMain ? `<i class='bx bx-user'></i>` : idx + 1}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: var(--text-main); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${t.name}
                        ${t.isMain ? `<span style="font-size: 0.7rem; background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 99px; margin-left: 8px; vertical-align: middle; font-weight: 500;">${isEn ? 'Main' : 'Đại diện'}</span>` : ''}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 3px; display: flex; gap: 1rem; flex-wrap: wrap;">
                        <span><i class='bx bx-phone' style="vertical-align: middle;"></i> ${t.phone}</span>
                        ${t.email ? `<span><i class='bx bx-envelope' style="vertical-align: middle;"></i> ${t.email}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        const body = document.getElementById('contractDetailBody');
        body.innerHTML = `
            <!-- Room info -->
            <div style="background: var(--bg-color); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                <i class='bx bx-building-house' style="font-size: 1.4rem; color: var(--primary-color);"></i>
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">${isEn ? 'Room' : 'Phòng'}</div>
                    <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${roomName}</div>
                </div>
            </div>

            <!-- Contract period -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
                <div style="background: var(--bg-color); border-radius: 10px; padding: 0.875rem; text-align: center;">
                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; margin-bottom: 4px;">${isEn ? 'Start' : 'Bắt đầu'}</div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${startD ? startD.toLocaleDateString(isEn ? 'en-US' : 'vi-VN') : '—'}</div>
                </div>
                <div style="background: var(--bg-color); border-radius: 10px; padding: 0.875rem; text-align: center;">
                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; margin-bottom: 4px;">${isEn ? 'End' : 'Kết thúc'}</div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${endD ? endD.toLocaleDateString(isEn ? 'en-US' : 'vi-VN') : '—'}</div>
                </div>
                <div style="background: var(--bg-color); border-radius: 10px; padding: 0.875rem; text-align: center;">
                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; margin-bottom: 4px;">${isEn ? 'Duration' : 'Thời hạn'}</div>
                    <div style="font-weight: 700; color: var(--primary-color); font-size: 0.95rem;">${durationText}</div>
                </div>
            </div>

            <!-- Tenants section -->
            <div style="margin-bottom: 0.5rem; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">
                ${isEn ? 'Tenants' : 'Danh sách người thuê'} (${allTenants.length})
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem;">
                ${tenantCardsHTML}
            </div>

            <!-- Footer -->
            <div style="font-size: 0.78rem; color: var(--text-muted); text-align: right; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                <i class='bx bx-time-five' style="vertical-align: middle;"></i>
                ${isEn ? 'Recorded' : 'Ghi nhận'}: ${new Date(contract.createdAt).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
            </div>
        `;

        document.getElementById('contractDetailModal').classList.add('active');
    }
};

// Khởi tạo app
window.app = app;
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

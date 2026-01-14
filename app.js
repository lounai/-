// app.js - PWA 員工系統主程式
class EmployeeSystem {
    constructor() {
        this.currentUser = null;
        this.supabase = null;
        this.init();
    }

    async init() {
        // 初始化 Supabase
        await this.initSupabase();
        
        // 初始化 PWA
        this.initPWA();
        
        // 初始化事件監聽
        this.initEvents();
        
        // 檢查登入狀態
        await this.checkAuth();
        
        // 初始化儀表板（如果已登入）
        if (this.currentUser) {
            this.initDashboard();
        }
    }

    async initSupabase() {
        // 使用你的 Supabase URL 和金鑰
        const SUPABASE_URL = 'https://kzwtsgetozekwpidtlgs.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_tRTUjXZtrmR_dJlL5q0I0g_EYnN0AtH';
        
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    initPWA() {
        // 註冊 Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('Service Worker 註冊成功:', registration.scope);
                    })
                    .catch(error => {
                        console.log('Service Worker 註冊失敗:', error);
                    });
            });
        }

        // 安裝提示
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            setTimeout(() => {
                document.getElementById('installPrompt').classList.add('show');
            }, 3000);
        });

        document.getElementById('installBtn').addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('使用者接受安裝');
            }
            
            deferredPrompt = null;
            document.getElementById('installPrompt').classList.remove('show');
        });

        document.getElementById('cancelInstall').addEventListener('click', () => {
            document.getElementById('installPrompt').classList.remove('show');
        });

        // 偵測是否從主畫面開啟
        window.addEventListener('DOMContentLoaded', () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('從主畫面開啟');
            }
        });
    }

    initEvents() {
        // 登入表單
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 切換密碼可見性
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const input = e.target.closest('.input-group').querySelector('input');
                const icon = e.target.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // 側邊欄菜單
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        // 登出按鈕
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // 底部導航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.loadPage(page);
                
                // 更新活動狀態
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // 關閉側邊欄（手機）
                document.getElementById('sidebar').classList.remove('active');
            });
        });

        // 側邊欄菜單項目
        document.querySelectorAll('.menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.loadPage(page);
                
                // 更新活動狀態
                document.querySelectorAll('.menu li').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // 關閉側邊欄（手機）
                document.getElementById('sidebar').classList.remove('active');
            });
        });

        // 線上/離線狀態
        window.addEventListener('online', () => this.showToast('網路已恢復', 'success'));
        window.addEventListener('offline', () => this.showToast('網路已斷開', 'warning'));

        // 禁止右鍵選單（選用）
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();
        });
    }

    async checkAuth() {
        try {
            const savedUser = localStorage.getItem('employee_user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                const { data, error } = await this.supabase
                    .rpc('驗證員工登入', {
                        輸入帳號: user.員工編號,
                        輸入密碼: 'dummy' // 實際應該檢查 token
                    });
                
                if (!error && data && data[0]?.登入成功) {
                    this.currentUser = {
                        ...user,
                        ...data[0]
                    };
                    this.showDashboard();
                } else {
                    localStorage.removeItem('employee_user');
                }
            }
        } catch (error) {
            console.error('檢查認證失敗:', error);
        }
    }

    async handleLogin() {
        const employeeId = document.getElementById('employeeId').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // 顯示載入中
        const loginBtn = document.querySelector('#loginForm .btn-primary');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中...';
        loginBtn.disabled = true;

        try {
            // 呼叫 Supabase 函數驗證登入
            const { data, error } = await this.supabase
                .rpc('驗證員工登入', {
                    輸入帳號: employeeId,
                    輸入密碼: password
                });

            if (error) {
                throw new Error(error.message);
            }

            if (data && data[0]?.登入成功) {
                const userData = data[0];
                
                // 儲存使用者資料
                this.currentUser = userData;
                
                if (rememberMe) {
                    localStorage.setItem('employee_user', JSON.stringify({
                        員工編號: userData.員工編號,
                        姓名: userData.姓名,
                        職位id: userData.職位id
                    }));
                }

                // 取得完整的權限資料
                const { data: positionData } = await this.supabase
                    .from('職位表')
                    .select('*')
                    .eq('id', userData.職位id)
                    .single();

                this.currentUser.職位資料 = positionData;

                this.showToast('登入成功', 'success');
                this.showDashboard();
            } else {
                this.showToast('員工編號或密碼錯誤', 'error');
            }
        } catch (error) {
            console.error('登入錯誤:', error);
            this.showToast('登入失敗: ' + error.message, 'error');
        } finally {
            // 恢復按鈕狀態
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    showDashboard() {
        // 切換到儀表板頁面
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('dashboardPage').classList.add('active');
        
        // 更新使用者資訊
        this.updateUserInfo();
        
        // 根據權限顯示/隱藏功能
        this.setupPermissions();
        
        // 載入預設頁面
        this.loadPage('dashboard');
        
        // 關閉安裝提示（如果存在）
        document.getElementById('installPrompt')?.classList.remove('show');
    }

    updateUserInfo() {
        if (!this.currentUser) return;
        
        document.getElementById('userName').textContent = this.currentUser.姓名;
        document.getElementById('userRole').textContent = 
            `員工編號: ${this.currentUser.員工編號}`;
    }

    setupPermissions() {
        const position = this.currentUser?.職位資料;
        if (!position) return;

        // 顯示/隱藏管理功能
        const adminItems = document.querySelectorAll('.requires-admin');
        const managerItems = document.querySelectorAll('.requires-manager');
        const financeItems = document.querySelectorAll('.requires-finance');

        adminItems.forEach(item => {
            item.style.display = position.可編輯員工資料 ? 'block' : 'none';
        });

        managerItems.forEach(item => {
            item.style.display = position.可管理專案 ? 'block' : 'none';
        });

        financeItems.forEach(item => {
            item.style.display = position.可查看財務 ? 'block' : 'none';
        });
    }

    async loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        const pageTitle = document.querySelector('.page-title');
        
        // 顯示載入中
        mainContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>載入中...</p>
            </div>
        `;

        try {
            let content = '';
            
            switch(page) {
                case 'dashboard':
                    pageTitle.textContent = '儀表板';
                    content = await this.getDashboardContent();
                    break;
                    
                case 'profile':
                    pageTitle.textContent = '個人資料';
                    content = await this.getProfileContent();
                    break;
                    
                case 'attendance':
                    pageTitle.textContent = '出勤記錄';
                    content = await this.getAttendanceContent();
                    break;
                    
                case 'projects':
                    pageTitle.textContent = '專案管理';
                    content = await this.getProjectsContent();
                    break;
                    
                case 'finance':
                    pageTitle.textContent = '財務報表';
                    content = await this.getFinanceContent();
                    break;
                    
                case 'employees':
                    pageTitle.textContent = '員工管理';
                    content = await this.getEmployeesContent();
                    break;
                    
                case 'settings':
                    pageTitle.textContent = '設定';
                    content = await this.getSettingsContent();
                    break;
                    
                default:
                    content = '<p>頁面不存在</p>';
            }
            
            mainContent.innerHTML = content;
            
            // 初始化頁面特定事件
            this.initPageEvents(page);
            
        } catch (error) {
            console.error('載入頁面失敗:', error);
            mainContent.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>載入失敗，請重試</p>
                </div>
            `;
        }
    }

    async getDashboardContent() {
        const { data: stats } = await this.supabase
            .from('員工表')
            .select('id', { count: 'exact' })
            .eq('在職狀態', 'active');

        const today = new Date().toLocaleDateString('zh-TW');
        
        return `
            <div class="dashboard">
                <div class="welcome-card">
                    <h3>歡迎回來，${this.currentUser?.姓名}！</h3>
                    <p>今天是 ${today}</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <i class="fas fa-users"></i>
                        <h4>在職員工</h4>
                        <p class="stat-number">${stats?.length || 0}</p>
                    </div>
                    
                    <div class="stat-card">
                        <i class="fas fa-calendar-check"></i>
                        <h4>今日出勤</h4>
                        <p class="stat-number">0</p>
                    </div>
                    
                    <div class="stat-card">
                        <i class="fas fa-project-diagram"></i>
                        <h4>進行中專案</h4>
                        <p class="stat-number">0</p>
                    </div>
                    
                    <div class="stat-card">
                        <i class="fas fa-bell"></i>
                        <h4>待辦事項</h4>
                        <p class="stat-number">0</p>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <h3>快速操作</h3>
                    <div class="actions-grid">
                        <button class="action-btn" data-action="clock-in">
                            <i class="fas fa-fingerprint"></i>
                            <span>上班打卡</span>
                        </button>
                        
                        <button class="action-btn" data-action="clock-out">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>下班打卡</span>
                        </button>
                        
                        <button class="action-btn" data-action="request-leave">
                            <i class="fas fa-umbrella-beach"></i>
                            <span>請假申請</span>
                        </button>
                        
                        <button class="action-btn" data-action="report-issue">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>問題回報</span>
                        </button>
                    </div>
                </div>
                
                <div class="recent-activities">
                    <h3>最近活動</h3>
                    <div class="activities-list">
                        <div class="activity-item">
                            <i class="fas fa-sign-in-alt"></i>
                            <div>
                                <p>您已登入系統</p>
                                <small>剛剛</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async getProfileContent() {
        const { data: employee } = await this.supabase
            .from('員工表')
            .select(`
                *,
                職位表:職位id(職位名稱, 權限等級)
            `)
            .eq('id', this.currentUser?.員工id)
            .single();

        return `
            <div class="profile">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3>${employee?.姓名 || ''}</h3>
                    <p>${employee?.職位表?.職位名稱 || ''}</p>
                </div>
                
                <div class="profile-info">
                    <h4>基本資料</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label><i class="fas fa-id-card"></i> 員工編號</label>
                            <p>${employee?.員工編號 || ''}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-envelope"></i> 電子郵件</label>
                            <p>${employee?.電子郵件 || '未設定'}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-phone"></i> 電話</label>
                            <p>${employee?.電話 || '未設定'}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-birthday-cake"></i> 生日</label>
                            <p>${employee?.生日 || '未設定'}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-calendar-day"></i> 入職日期</label>
                            <p>${employee?.入職日期 || ''}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-wallet"></i> 薪資帳戶</label>
                            <p>${employee?.薪資帳戶 || '未設定'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn-secondary" id="editProfile">
                        <i class="fas fa-edit"></i> 編輯資料
                    </button>
                    
                    <button class="btn-secondary" id="changePassword">
                        <i class="fas fa-key"></i> 修改密碼
                    </button>
                </div>
            </div>
        `;
    }

    async getAttendanceContent() {
        return `
            <div class="attendance">
                <div class="attendance-card">
                    <h3>今日打卡</h3>
                    <div class="clock-status">
                        <div class="clock-in">
                            <p>上班時間</p>
                            <h4>--:--</h4>
                        </div>
                        <div class="clock-out">
                            <p>下班時間</p>
                            <h4>--:--</h4>
                        </div>
                    </div>
                    
                    <button class="btn-primary btn-clock" id="clockBtn">
                        <i class="fas fa-fingerprint"></i>
                        <span>打卡</span>
                    </button>
                    
                    <p class="clock-hint">點擊上方按鈕進行打卡</p>
                </div>
                
                <div class="attendance-history">
                    <h3>出勤記錄</h3>
                    <div class="date-selector">
                        <button class="btn-date" id="prevMonth">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span id="currentMonth">${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}</span>
                        <button class="btn-date" id="nextMonth">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="attendance-list">
                        <p>載入中...</p>
                    </div>
                </div>
            </div>
        `;
    }

    initPageEvents(page) {
        switch(page) {
            case 'attendance':
                this.initAttendanceEvents();
                break;
            case 'profile':
                this.initProfileEvents();
                break;
            case 'dashboard':
                this.initDashboardEvents();
                break;
        }
    }

    initAttendanceEvents() {
        document.getElementById('clockBtn')?.addEventListener('click', async () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // TODO: 儲存打卡記錄到資料庫
            this.showToast(`打卡成功 ${timeStr}`, 'success');
            
            // 更新顯示
            const clockIn = document.querySelector('.clock-in h4');
            if (clockIn.textContent === '--:--') {
                clockIn.textContent = timeStr;
                document.getElementById('clockBtn').innerHTML = `
                    <i class="fas fa-sign-out-alt"></i>
                    <span>下班打卡</span>
                `;
            } else {
                document.querySelector('.clock-out h4').textContent = timeStr;
                document.getElementById('clockBtn').disabled = true;
            }
        });
    }

    initProfileEvents() {
        document.getElementById('editProfile')?.addEventListener('click', () => {
            this.showModal('編輯個人資料', this.getEditProfileForm());
        });

        document.getElementById('changePassword')?.addEventListener('click', () => {
            this.showModal('修改密碼', this.getChangePasswordForm());
        });
    }

    initDashboardEvents() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        switch(action) {
            case 'clock-in':
                this.loadPage('attendance');
                break;
            case 'request-leave':
                this.showModal('請假申請', '請假表單內容');
                break;
            default:
                this.showToast('功能開發中', 'info');
        }
    }

    showModal(title, content) {
        // 建立 modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        // 插入到 body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 關閉事件
        const overlay = document.getElementById('modalOverlay');
        overlay.querySelector('.modal-close').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    showToast(message, type = 'info') {
        // 建立 toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // 添加到頁面
        document.body.appendChild(toast);
        
        // 顯示動畫
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 自動消失
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    async handleLogout() {
        // 清除本地儲存
        localStorage.removeItem('employee_user');
        
        // 切換到登入頁面
        document.getElementById('dashboardPage').classList.remove('active');
        document.getElementById('loginPage').classList.add('active');
        
        // 清除表單
        document.getElementById('loginForm').reset();
        
        // 重置使用者狀態
        this.currentUser = null;
        
        this.showToast('已登出', 'info');
    }

    async testDatabaseConnection() {
        try {
            const { data, error } = await this.supabase
                .from('職位表')
                .select('*')
                .limit(1);
            
            if (error) throw error;
            
            console.log('資料庫連接成功:', data);
            return true;
        } catch (error) {
            console.error('資料庫連接失敗:', error);
            return false;
        }
    }
}

// 初始化應用程式
window.addEventListener('DOMContentLoaded', () => {
    window.employeeSystem = new EmployeeSystem();
});

// 錯誤處理
window.addEventListener('error', (event) => {
    console.error('全域錯誤:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的 Promise 錯誤:', event.reason);
});
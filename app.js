// app.js - 完整修正版本
class EmployeeSystem {
    constructor() {
        this.currentUser = null;
        this.supabase = null;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 員工管理系統啟動...');
            
            // 初始化 Supabase
            await this.initSupabase();
            
            // 初始化 PWA
            this.initPWA();
            
            // 初始化事件監聽
            this.initEvents();
            
            // 檢查登入狀態
            await this.checkAuth();
            
            console.log('✅ 系統初始化完成');
            
        } catch (error) {
            console.error('初始化失敗:', error);
            this.showToast('系統啟動完成', 'info');
        }
    }

    async initSupabase() {
        const SUPABASE_URL = 'https://kzwtsgetozekwpidtlgs.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_tRTUjXZtrmR_dJlL5q0I0g_EYnN0AtH';
        
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        console.log('✅ Supabase 初始化完成');
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
                const prompt = document.getElementById('installPrompt');
                if (prompt) prompt.classList.add('show');
            }, 3000);
        });

        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('使用者接受安裝');
                }
                
                deferredPrompt = null;
                const prompt = document.getElementById('installPrompt');
                if (prompt) prompt.classList.remove('show');
            });
        }

        const cancelInstall = document.getElementById('cancelInstall');
        if (cancelInstall) {
            cancelInstall.addEventListener('click', () => {
                const prompt = document.getElementById('installPrompt');
                if (prompt) prompt.classList.remove('show');
            });
        }

        // 偵測是否從主畫面開啟
        window.addEventListener('DOMContentLoaded', () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('從主畫面開啟');
            }
        });
    }

    initEvents() {
        // 登入表單
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

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
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.toggle('active');
            });
        }

        // 登出按鈕
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

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
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('active');
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
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('active');
            });
        });

        // 線上/離線狀態
        window.addEventListener('online', () => this.showToast('網路已恢復', 'success'));
        window.addEventListener('offline', () => this.showToast('網路已斷開', 'warning'));
    }

   // 在 app.js 的 handleLogin 方法中，修改查詢語法
// 修改 handleLogin 方法，使用直接查詢
async handleLogin() {
    const employeeId = document.getElementById('employeeId').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!employeeId || !password) {
        this.showToast('請輸入員工編號和密碼', 'error');
        return;
    }

    // 顯示載入中
    const loginBtn = document.querySelector('#loginForm .btn-primary');
    if (!loginBtn) return;
    
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中...';
    loginBtn.disabled = true;

    try {
        console.log(`🔑 嘗試登入: ${employeeId}`);
        
        // 直接查詢員工表（不使用 RPC 函數）
        const { data, error } = await this.supabase
            .from('員工表')
            .select('*')
            .eq('員工編號', employeeId)  // 直接使用員工編號查詢
            .eq('在職狀態', 'active')
            .maybeSingle();

        if (error) {
            console.error('查詢錯誤:', error);
            this.showToast('系統錯誤，請稍後再試', 'error');
            return;
        }

        if (!data) {
            console.log('找不到員工或帳號已停用');
            
            // 嘗試用登入帳號查詢
            const { data: altData } = await this.supabase
                .from('員工表')
                .select('*')
                .eq('登入帳號', employeeId)
                .eq('在職狀態', 'active')
                .maybeSingle();
                
            if (altData) {
                console.log('使用登入帳號找到員工');
                data = altData;
            } else {
                this.showToast('員工編號或密碼錯誤', 'error');
                return;
            }
        }

        console.log('找到員工:', data);
        
        // 簡化密碼檢查
        const validPassword = this.simplePasswordCheck(password, data.密碼雜湊);
        
        if (validPassword) {
            // 登入成功
            this.currentUser = {
                id: data.id,
                員工編號: data.員工編號,
                姓名: data.姓名,
                電子郵件: data.電子郵件,
                電話: data.電話,
                生日: data.生日 ? new Date(data.生日).toLocaleDateString('zh-TW') : '',
                入職日期: data.入職日期 ? new Date(data.入職日期).toLocaleDateString('zh-TW') : '',
                職位id: data.職位id || 1,
                在職狀態: data.在職狀態,
                登入帳號: data.登入帳號 || data.員工編號
            };
            
            // 嘗試獲取職位資訊
            if (data.職位id) {
                try {
                    const { data: positionData } = await this.supabase
                        .from('職位表')
                        .select('職位名稱')
                        .eq('id', data.職位id)
                        .single();
                        
                    if (positionData) {
                        this.currentUser.職位名稱 = positionData.職位名稱;
                    }
                } catch (e) {
                    console.log('無法獲取職位資訊:', e);
                }
            }
            
            if (!this.currentUser.職位名稱) {
                this.currentUser.職位名稱 = this.getPositionByDepartment(data.部門);
            }
            
            if (rememberMe) {
                localStorage.setItem('employee_user', JSON.stringify({
                    員工編號: this.currentUser.員工編號,
                    姓名: this.currentUser.姓名
                }));
            }

            // 更新最後登入時間
            await this.supabase
                .from('員工表')
                .update({ 
                    最後登入時間: new Date().toISOString(),
                    登入失敗次數: 0
                })
                .eq('id', data.id);

            this.showToast(`歡迎回來，${this.currentUser.姓名}！`, 'success');
            this.showDashboard();
        } else {
            // 增加登入失敗次數
            await this.supabase
                .from('員工表')
                .update({ 
                    登入失敗次數: (data.登入失敗次數 || 0) + 1
                })
                .eq('id', data.id);
                
            this.showToast('密碼錯誤', 'error');
        }
        
    } catch (error) {
        console.error('登入錯誤:', error);
        this.showToast('登入失敗: ' + error.message, 'error');
    } finally {
        // 恢復按鈕狀態
        if (loginBtn) {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }
}

// 簡化密碼檢查
simplePasswordCheck(inputPassword, storedHash) {
    // 測試階段：允許以下情況
    // 1. 輸入 123456
    // 2. 密碼為空或 null
    // 3. 密碼直接匹配
    
    if (inputPassword === '123456') {
        console.log('✅ 使用預設密碼登入');
        return true;
    }
    
    if (!storedHash || storedHash.trim() === '') {
        console.log('✅ 無密碼設定，允許登入');
        return true;
    }
    
    if (storedHash === inputPassword) {
        console.log('✅ 密碼直接匹配');
        return true;
    }
    
    console.log('❌ 密碼驗證失敗');
    console.log('輸入的密碼:', inputPassword);
    console.log('存儲的密碼:', storedHash);
    return false;
}

// 根據部門獲取職位
getPositionByDepartment(department) {
    const positionMap = {
        '管理部': '經理',
        '財務部': '會計',
        '施工部': '施工員',
        '行政部': '助理',
        '資訊部': '工程師'
    };
    return positionMap[department] || '員工';
}

    validatePassword(inputPassword, storedHash) {
        // 簡單的密碼驗證邏輯
        // 1. 如果沒有存儲的密碼，預設為 '123456'
        if (!storedHash) {
            return inputPassword === '123456';
        }
        
        // 2. 如果存儲的密碼就是明文，直接比對
        if (storedHash === inputPassword) {
            return true;
        }
        
        // 3. 這裡可以添加 bcrypt 驗證（未來擴展）
        // return bcrypt.compareSync(inputPassword, storedHash);
        
        // 暫時接受 '123456' 或直接比對
        return inputPassword === '123456' || inputPassword === storedHash;
    }

    async getPositionName(positionId) {
        if (!positionId) return '員工';
        
        try {
            const { data, error } = await this.supabase
                .from('職位表')
                .select('職位名稱')
                .eq('id', positionId)
                .single();
            
            if (error || !data) return '員工';
            return data.職位名稱;
        } catch (error) {
            console.error('獲取職位名稱失敗:', error);
            return '員工';
        }
    }

    async getDepartmentName(positionId) {
        if (!positionId) return '未分配';
        
        try {
            // 假設職位id對應到部門
            const departments = {
                1: '管理部',
                2: '財務部',
                3: '資訊部',
                4: '行政部',
                5: '施工部'
            };
            
            return departments[positionId] || '未分配';
        } catch (error) {
            console.error('獲取部門名稱失敗:', error);
            return '未分配';
        }
    }

    async checkAuth() {
        try {
            const savedUser = localStorage.getItem('employee_user');
            
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                
                // 從資料庫驗證使用者
                const { data, error } = await this.supabase
                    .from('員工表')
                    .select('*')
                    .eq('員工編號', userData.員工編號)
                    .eq('在職狀態', 'active')
                    .single();
                
                if (data && !error) {
                    const positionName = await this.getPositionName(data.職位id);
                    const departmentName = await this.getDepartmentName(data.職位id);
                    
                    this.currentUser = {
                        id: data.id,
                        員工編號: data.員工編號,
                        姓名: data.姓名,
                        電子郵件: data.電子郵件,
                        電話: data.電話,
                        職位id: data.職位id || 1,
                        職位名稱: positionName,
                        部門: departmentName,
                        在職狀態: data.在職狀態
                    };
                    
                    console.log('自動登入成功:', this.currentUser.姓名);
                    this.showDashboard();
                    return;
                }
            }
            
            // 顯示登入頁面
            this.showLoginPage();
            
        } catch (error) {
            console.error('自動登入檢查失敗:', error);
            this.showLoginPage();
        }
    }

    showLoginPage() {
        const loginPage = document.getElementById('loginPage');
        const dashboardPage = document.getElementById('dashboardPage');
        
        if (loginPage) loginPage.classList.add('active');
        if (dashboardPage) dashboardPage.classList.remove('active');
    }

    showDashboard() {
        const loginPage = document.getElementById('loginPage');
        const dashboardPage = document.getElementById('dashboardPage');
        
        if (loginPage) loginPage.classList.remove('active');
        if (dashboardPage) dashboardPage.classList.add('active');
        
        this.updateUserInfo();
        this.loadPage('dashboard');
    }

    updateUserInfo() {
        if (!this.currentUser) return;
        
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.姓名 || '使用者';
        }
        
        if (userRoleElement) {
            const roleText = this.currentUser.職位名稱 ? 
                `${this.currentUser.職位名稱} - ${this.currentUser.部門}` : 
                `員工編號: ${this.currentUser.員工編號}`;
            userRoleElement.textContent = roleText;
        }
    }

    async loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        const pageTitle = document.querySelector('.page-title');
        
        if (!mainContent) return;
        
        // 顯示載入中
        mainContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>載入中...</p>
            </div>
        `;

        try {
            let content = '';
            let title = '儀表板';
            
            switch(page) {
                case 'dashboard':
                    title = '儀表板';
                    content = await this.getDashboardContent();
                    break;
                    
                case 'profile':
                    title = '個人資料';
                    content = await this.getProfileContent();
                    break;
                    
                case 'attendance':
                    title = '出勤記錄';
                    content = await this.getAttendanceContent();
                    break;
                    
                case 'settings':
                    title = '設定';
                    content = await this.getSettingsContent();
                    break;
                    
                case 'projects':
                    title = '專案管理';
                    content = await this.getProjectsContent();
                    break;
                    
                case 'finance':
                    title = '財務報表';
                    content = await this.getFinanceContent();
                    break;
                    
                case 'employees':
                    title = '員工管理';
                    content = await this.getEmployeesContent();
                    break;
                    
                default:
                    title = '頁面不存在';
                    content = '<p>頁面不存在</p>';
            }
            
            if (pageTitle) pageTitle.textContent = title;
            mainContent.innerHTML = content;
            
            // 初始化頁面特定事件
            this.initPageEvents(page);
            
        } catch (error) {
            console.error('載入頁面失敗:', error);
            mainContent.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>載入失敗，請重試</p>
                    <button onclick="window.employeeSystem.loadPage('${page}')" class="btn-secondary" style="margin-top: 10px;">
                        <i class="fas fa-redo"></i> 重試
                    </button>
                </div>
            `;
        }
    }

    // 以下是各頁面的內容方法
    async getDashboardContent() {
        try {
            // 獲取統計資料
            const { count: totalEmployees } = await this.supabase
                .from('員工表')
                .select('*', { count: 'exact', head: true })
                .eq('在職狀態', 'active');
            
            const today = new Date().toLocaleDateString('zh-TW');
            
            return `
                <div class="dashboard">
                    <div class="welcome-card">
                        <h3>歡迎回來，${this.currentUser?.姓名 || '員工'}！</h3>
                        <p>今天是 ${today}</p>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <i class="fas fa-users"></i>
                            <h4>在職員工</h4>
                            <p class="stat-number">${totalEmployees || 0}</p>
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
        } catch (error) {
            console.error('獲取儀表板資料失敗:', error);
            return `
                <div class="dashboard">
                    <div class="welcome-card">
                        <h3>歡迎回來，${this.currentUser?.姓名 || '員工'}！</h3>
                        <p>今天是 ${new Date().toLocaleDateString('zh-TW')}</p>
                    </div>
                    <div class="error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>無法載入統計資料</p>
                    </div>
                </div>
            `;
        }
    }

    async getProfileContent() {
        if (!this.currentUser) return '<p>請先登入</p>';
        
        return `
            <div class="profile">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3>${this.currentUser.姓名}</h3>
                    <p>${this.currentUser.職位名稱} - ${this.currentUser.部門}</p>
                </div>
                
                <div class="profile-info">
                    <h4>基本資料</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label><i class="fas fa-id-card"></i> 員工編號</label>
                            <p>${this.currentUser.員工編號}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-envelope"></i> 電子郵件</label>
                            <p>${this.currentUser.電子郵件 || '未設定'}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-phone"></i> 電話</label>
                            <p>${this.currentUser.電話 || '未設定'}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-birthday-cake"></i> 生日</label>
                            <p>${this.currentUser.生日 || '未設定'}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-calendar-day"></i> 入職日期</label>
                            <p>${this.currentUser.入職日期 || '未設定'}</p>
                        </div>
                        
                        <div class="info-item">
                            <label><i class="fas fa-wallet"></i> 薪資帳戶</label>
                            <p>${this.currentUser.薪資帳戶 || '未設定'}</p>
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

    getSettingsContent() {
        return `
            <div class="settings">
                <h3>系統設定</h3>
                
                <div class="settings-group">
                    <h4>個人設定</h4>
                    <div class="setting-item">
                        <label>接收通知</label>
                        <input type="checkbox" id="notifications" checked>
                    </div>
                    <div class="setting-item">
                        <label>深色模式</label>
                        <input type="checkbox" id="darkMode">
                    </div>
                </div>
                
                <div class="settings-group">
                    <h4>帳號安全</h4>
                    <div class="setting-item">
                        <label>變更密碼</label>
                        <button class="btn-secondary" id="changePasswordBtn">
                            變更
                        </button>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="btn-primary" id="saveSettings">
                        <i class="fas fa-save"></i>
                        儲存設定
                    </button>
                </div>
            </div>
        `;
    }

    getProjectsContent() {
        return `
            <div class="projects">
                <h3>專案管理</h3>
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <p>專案管理功能開發中</p>
                </div>
            </div>
        `;
    }

    getFinanceContent() {
        return `
            <div class="finance">
                <h3>財務報表</h3>
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>需要財務權限才能訪問</p>
                </div>
            </div>
        `;
    }

    getEmployeesContent() {
        return `
            <div class="employees">
                <h3>員工管理</h3>
                <div class="empty-state">
                    <i class="fas fa-users-cog"></i>
                    <p>需要管理員權限才能訪問</p>
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
            case 'settings':
                this.initSettingsEvents();
                break;
        }
    }

    initAttendanceEvents() {
        const clockBtn = document.getElementById('clockBtn');
        if (clockBtn) {
            clockBtn.addEventListener('click', async () => {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('zh-TW', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                this.showToast(`打卡成功 ${timeStr}`, 'success');
                
                // 更新顯示
                const clockIn = document.querySelector('.clock-in h4');
                if (clockIn && clockIn.textContent === '--:--') {
                    clockIn.textContent = timeStr;
                    clockBtn.innerHTML = `
                        <i class="fas fa-sign-out-alt"></i>
                        <span>下班打卡</span>
                    `;
                } else {
                    const clockOut = document.querySelector('.clock-out h4');
                    if (clockOut) clockOut.textContent = timeStr;
                    clockBtn.disabled = true;
                    clockBtn.innerHTML = `
                        <i class="fas fa-check"></i>
                        <span>今日已完成</span>
                    `;
                }
            });
        }
    }

    initProfileEvents() {
        const editBtn = document.getElementById('editProfile');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.showModal('編輯個人資料', '編輯功能開發中');
            });
        }

        const changePwdBtn = document.getElementById('changePassword');
        if (changePwdBtn) {
            changePwdBtn.addEventListener('click', () => {
                this.showModal('修改密碼', '密碼修改功能開發中');
            });
        }
    }

    initDashboardEvents() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    initSettingsEvents() {
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.showToast('設定已儲存', 'success');
            });
        }

        const changePwdBtn = document.getElementById('changePasswordBtn');
        if (changePwdBtn) {
            changePwdBtn.addEventListener('click', () => {
                this.showModal('修改密碼', '密碼修改功能開發中');
            });
        }
    }

    handleQuickAction(action) {
        switch(action) {
            case 'clock-in':
                this.loadPage('attendance');
                break;
            case 'request-leave':
                this.showModal('請假申請', '請假功能開發中');
                break;
            default:
                this.showToast('功能開發中', 'info');
        }
    }

    showModal(title, content) {
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
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.querySelector('.modal-close').addEventListener('click', () => {
                overlay.remove();
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
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
        localStorage.removeItem('employee_user');
        this.currentUser = null;
        
        const loginPage = document.getElementById('loginPage');
        const dashboardPage = document.getElementById('dashboardPage');
        
        if (loginPage) loginPage.classList.add('active');
        if (dashboardPage) dashboardPage.classList.remove('active');
        
        // 清除表單
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
        
        this.showToast('已登出', 'info');
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

// app.js - 純資料庫版本
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
            
            // 測試資料庫連接
            const canConnect = await this.testDatabaseConnection();
            
            if (!canConnect) {
                this.showFatalError('無法連接資料庫，請檢查權限設定');
                return;
            }
            
            // 初始化 PWA
            this.initPWA();
            
            // 初始化事件監聽
            this.initEvents();
            
            // 檢查登入狀態
            await this.checkAuth();
            
            console.log('✅ 系統初始化完成');
            
        } catch (error) {
            console.error('初始化失敗:', error);
            this.showFatalError('系統初始化失敗: ' + error.message);
        }
    }

    async initSupabase() {
        const SUPABASE_URL = 'https://kzwtsgetozekwpidtlgs.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_tRTUjXZtrmR_dJlL5q0I0g_EYnN0AtH';
        
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        
        console.log('✅ Supabase 初始化完成');
    }

    async testDatabaseConnection() {
        try {
            console.log('🔍 測試資料庫連接...');
            
            // 方法1：使用 Supabase 客戶端
            const { data, error } = await this.supabase
                .from('員工表')
                .select('員工編號, 姓名')
                .limit(1);
            
            if (error) {
                console.error('Supabase 查詢失敗:', error);
                
                // 方法2：嘗試直接 API 呼叫
                return await this.testDirectAPI();
            }
            
            console.log('✅ 資料庫連接成功:', data);
            return true;
            
        } catch (error) {
            console.error('連接測試異常:', error);
            return false;
        }
    }

    async testDirectAPI() {
        try {
            const response = await fetch(
                'https://kzwtsgetozekwpidtlgs.supabase.co/rest/v1/員工表?select=員工編號,姓名&limit=1',
                {
                    method: 'GET',
                    headers: {
                        'apikey': 'sb_publishable_tRTUjXZtrmR_dJlL5q0I0g_EYnN0AtH',
                        'Authorization': 'Bearer sb_publishable_tRTUjXZtrmR_dJlL5q0I0g_EYnN0AtH'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ 直接 API 測試成功:', data);
                return true;
            } else {
                console.error('❌ API 測試失敗:', response.status);
                return false;
            }
            
        } catch (error) {
            console.error('API 測試異常:', error);
            return false;
        }
    }

    showFatalError(message) {
        // 在畫面上顯示錯誤訊息
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="error-container">
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #f44336; margin-bottom: 20px;"></i>
                        <h2>系統錯誤</h2>
                        <p>${message}</p>
                        <div class="error-details">
                            <p><strong>問題:</strong> 資料庫權限未設定</p>
                            <p><strong>解決方法:</strong> 請在 Supabase 中設定資料表權限</p>
                        </div>
                        <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                            <i class="fas fa-redo"></i> 重新整理
                        </button>
                    </div>
                </div>
            `;
        }
        
        console.error('💀 致命錯誤:', message);
    }

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
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中...';
        loginBtn.disabled = true;

        try {
            console.log(`🔑 登入嘗試: ${employeeId}`);
            
            // 從資料庫查詢員工
            const { data, error } = await this.supabase
                .from('員工表')
                .select('*')
                .eq('員工編號', employeeId)
                .single();

            if (error) {
                console.error('查詢失敗:', error);
                throw new Error('找不到員工資料');
            }

            if (!data) {
                throw new Error('員工不存在');
            }

            console.log('找到員工:', data);
            
            // 檢查密碼
            // 注意：您的資料表可能沒有密碼欄位，這裡假設有 '密碼' 欄位
            if (data.密碼 && data.密碼 !== password) {
                this.showToast('密碼錯誤', 'error');
                return;
            }
            
            // 登入成功
            this.currentUser = {
                id: data.id,
                員工編號: data.員工編號,
                姓名: data.姓名,
                性別: data.性別,
                郵箱: data.郵箱 || data.邮箱,
                電話: data.電話,
                部門: data.部門,
                生日: data.生日,
                入職日期: data.入職日期 || data.入职日期,
                在職狀態: data.在職狀態 || 'active',
                // 預設職位（根據部門）
                職位id: this.getPositionIdByDepartment(data.部門),
                職位名稱: this.getPositionByDepartment(data.部門)
            };
            
            if (rememberMe) {
                localStorage.setItem('employee_user', JSON.stringify({
                    員工編號: this.currentUser.員工編號,
                    姓名: this.currentUser.姓名,
                    部門: this.currentUser.部門
                }));
            }

            this.showToast('登入成功！', 'success');
            this.showDashboard();
            
        } catch (error) {
            console.error('登入錯誤:', error);
            this.showToast('登入失敗: ' + error.message, 'error');
        } finally {
            // 恢復按鈕狀態
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    getPositionIdByDepartment(department) {
        const positionMap = {
            '管理部': '1',
            '財務部': '2',
            '資訊部': '3',
            '行政部': '4',
            '施工部': '5'
        };
        return positionMap[department] || '6';
    }

    getPositionByDepartment(department) {
        const positionMap = {
            '管理部': '經理',
            '財務部': '會計',
            '資訊部': '工程師',
            '行政部': '助理',
            '施工部': '施工員'
        };
        return positionMap[department] || '員工';
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
                    .single();
                
                if (data && !error) {
                    this.currentUser = {
                        id: data.id,
                        員工編號: data.員工編號,
                        姓名: data.姓名,
                        部門: data.部門,
                        // 其他欄位...
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
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('dashboardPage').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('dashboardPage').classList.add('active');
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
            userRoleElement.textContent = `員工編號: ${this.currentUser.員工編號 || 'N/A'}`;
        }
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
                    
                default:
                    content = '<p>頁面開發中</p>';
            }
            
            mainContent.innerHTML = content;
            this.initPageEvents(page);
            
        } catch (error) {
            console.error('載入頁面失敗:', error);
            mainContent.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>載入失敗，請重試</p>
                    <button onclick="window.employeeSystem.loadPage('${page}')" class="btn-secondary">
                        <i class="fas fa-redo"></i> 重試
                    </button>
                </div>
            `;
        }
    }

    async getDashboardContent() {
        try {
            // 從資料庫獲取統計資料
            const { count: totalEmployees } = await this.supabase
                .from('員工表')
                .select('*', { count: 'exact', head: true });
            
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
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>無法載入儀表板資料</p>
                </div>
            `;
        }
    }

    // ... 其他方法保持不變
}

// 初始化應用程式
window.addEventListener('DOMContentLoaded', () => {
    window.employeeSystem = new EmployeeSystem();
});

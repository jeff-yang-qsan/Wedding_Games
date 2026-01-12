/**
 * 數字抽籤遊戲 - 錯誤處理和日誌框架
 * 跨所有 JS 模組的統一錯誤處理
 */

class ErrorHandler {
    constructor() {
        this.errorCounts = new Map();
        this.maxErrors = 100; // 最大錯誤數量
        this.isInitialized = false;
    }

    /**
     * 初始化錯誤處理框架
     */
    init() {
        if (this.isInitialized) return;

        // 設定全域錯誤處理
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, event.filename, event.lineno);
        });

        // 設定 Promise 拒絕處理
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event.reason);
        });

        // 設定 console 攔截
        this.interceptConsoleErrors();

        this.isInitialized = true;
        console.log('錯誤處理框架已初始化');
    }

    /**
     * 處理全域錯誤
     */
    handleGlobalError(error, filename, lineno) {
        const errorInfo = {
            message: error.message || '未知錯誤',
            stack: error.stack || '',
            filename: filename || '',
            lineno: lineno || 0,
            timestamp: new Date().toISOString(),
            type: 'javascript_error'
        };

        this.logError(errorInfo);
        
        // 顯示用戶友好的錯誤訊息
        if (window.uiController) {
            window.uiController.showError('系統發生錯誤，請重新整理頁面');
        }
    }

    /**
     * 處理 Promise 拒絕
     */
    handlePromiseRejection(reason) {
        const errorInfo = {
            message: reason.message || String(reason),
            stack: reason.stack || '',
            type: 'promise_rejection',
            timestamp: new Date().toISOString()
        };

        this.logError(errorInfo);
    }

    /**
     * 攔截 console 錯誤
     */
    interceptConsoleErrors() {
        const originalError = console.error;
        console.error = (...args) => {
            // 記錄錯誤
            this.logError({
                message: args.join(' '),
                type: 'console_error',
                timestamp: new Date().toISOString()
            });

            // 調用原始 console.error
            originalError.apply(console, args);
        };
    }

    /**
     * 記錄錯誤
     */
    async logError(errorInfo) {
        try {
            // 更新錯誤計數
            const errorKey = errorInfo.message || 'unknown';
            const count = this.errorCounts.get(errorKey) || 0;
            this.errorCounts.set(errorKey, count + 1);

            // 限制錯誤記錄數量
            if (this.errorCounts.size > this.maxErrors) {
                const oldestError = this.errorCounts.keys().next().value;
                this.errorCounts.delete(oldestError);
            }

            // 記錄到存儲系統
            if (window.storageManager) {
                await window.storageManager.logError('error', errorInfo.message, errorInfo);
            }

            console.log('錯誤已記錄:', errorInfo);

        } catch (logError) {
            console.warn('記錄錯誤失敗:', logError);
        }
    }

    /**
     * 獲取錯誤統計
     */
    getErrorStats() {
        return {
            totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
            uniqueErrors: this.errorCounts.size,
            errorCounts: Object.fromEntries(this.errorCounts)
        };
    }
}

// 初始化錯誤處理框架
const errorHandler = new ErrorHandler();
errorHandler.init();

// 匯出
window.ErrorHandler = ErrorHandler;
window.errorHandler = errorHandler;

// 自動初始化所有系統
document.addEventListener('DOMContentLoaded', () => {
    // 確保所有系統按順序初始化
    console.log('開始系統初始化序列...');
    
    // 1. 初始化存儲管理器 (已自動初始化)
    // 2. 初始化 WebRTC 管理器 (已自動初始化)  
    // 3. 增強 WebRTC 連線管理
    if (window.webrtcManager && window.webrtcManager.enhanceConnectionManagement) {
        window.webrtcManager.enhanceConnectionManagement();
    }
    
    // 4. 初始化遊戲引擎狀態驗證 (T010 已實現)
    if (window.GameRoom) {
        // 狀態驗證功能已在 game-engine.js 中實現
        console.log('遊戲引擎狀態轉換驗證已啟用');
    }
    
    // 5. UI 控制器 (已自動初始化)
    
    console.log('系統初始化序列完成');
});
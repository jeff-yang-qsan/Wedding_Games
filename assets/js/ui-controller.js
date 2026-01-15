/**
 * 數字抽籤遊戲 - UI 控制器
 * 負責使用者介面事件處理和響應式佈局管理
 */

class UIController {
    constructor() {
        this.currentScreen = null;
        this.eventListeners = new Map();
        this.toastTimeout = null;
        this.isInitialized = false;
        this.loadingStates = new Set(); // Phase 7: 載入狀態管理
        
        // 綁定方法到實例
        this.showScreen = this.showScreen.bind(this);
        this.showToast = this.showToast.bind(this);
        this.hideToast = this.hideToast.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
    }

    /**
     * 初始化 UI 控制器
     */
    init() {
        if (this.isInitialized) {
            console.warn('UI 控制器已經初始化');
            return;
        }

        console.log('初始化 UI 控制器');
        
        this.setupEventListeners();
        this.setupToastSystem();
        this.setupResponsiveHandlers();
        this.setupPhase6EventListeners(); // Phase 6: 添加遊戲狀態管理事件監聽器
        
        this.isInitialized = true;
        console.log('UI 控制器初始化完成');
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // Toast 關閉按鈕
        this.addEventListener('#error-toast .toast-close', 'click', () => {
            this.hideToast('error');
        });

        this.addEventListener('#success-toast .toast-close', 'click', () => {
            this.hideToast('success');
        });

        // 角色選擇按鈕 (已在 index.html 中設定，這裡提供備用)
        this.addEventListener('#host-btn', 'click', () => {
            this.handleRoleSelection('host');
        });

        this.addEventListener('#player-btn', 'click', () => {
            this.handleRoleSelection('player');
        });

        // 響應式事件
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // 方向變更事件 (行動裝置)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 100);
        });

        console.log('事件監聽器設定完成');
    }

    /**
     * 設定 Toast 通知系統
     */
    setupToastSystem() {
        // 確保 Toast 元素存在
        const errorToast = document.getElementById('error-toast');
        const successToast = document.getElementById('success-toast');

        if (!errorToast || !successToast) {
            console.warn('Toast 元素未找到');
        }
    }

    /**
     * 設定響應式處理器
     */
    setupResponsiveHandlers() {
        // 初始響應式檢查
        this.handleResize();
        
        // 檢測設備類型
        this.detectDeviceType();
    }

    // ==================== 畫面管理 ====================

    /**
     * 顯示指定畫面
     * @param {string} screenId - 畫面ID
     */
    showScreen(screenId) {
        console.log(`切換到畫面: ${screenId}`);
        
        // 隱藏所有畫面
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.add('hidden');
        });

        // 顯示目標畫面
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenId;
            
            // 觸發畫面變更事件
            this.dispatchCustomEvent('screenChanged', { screenId });
        } else {
            console.error(`畫面不存在: ${screenId}`);
        }
    }

    /**
     * 獲取當前畫面ID
     * @returns {string} 當前畫面ID
     */
    getCurrentScreen() {
        return this.currentScreen;
    }

    // ==================== Toast 通知系統 ====================

    /**
     * 顯示 Toast 通知
     * @param {string} type - 通知類型 ('success' 或 'error')
     * @param {string} message - 通知訊息
     * @param {number} duration - 顯示時長 (毫秒)，0 表示不自動隱藏
     */
    showToast(type, message, duration = 3000) {
        const toastId = `${type}-toast`;
        const toast = document.getElementById(toastId);
        
        if (!toast) {
            console.error(`Toast 元素不存在: ${toastId}`);
            return;
        }

        // 設定訊息
        const messageElement = toast.querySelector('.toast-message');
        if (messageElement) {
            messageElement.textContent = message;
        }

        // 清除之前的定時器
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        // 顯示 Toast
        toast.classList.remove('hidden');
        
        console.log(`顯示 ${type} Toast: ${message}`);

        // 自動隱藏
        if (duration > 0) {
            this.toastTimeout = setTimeout(() => {
                this.hideToast(type);
            }, duration);
        }
    }

    /**
     * 隱藏 Toast 通知
     * @param {string} type - 通知類型
     */
    hideToast(type) {
        const toastId = `${type}-toast`;
        const toast = document.getElementById(toastId);
        
        if (toast) {
            toast.classList.add('hidden');
        }

        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
            this.toastTimeout = null;
        }
    }

    /**
     * 顯示成功訊息
     * @param {string} message - 訊息內容
     * @param {number} duration - 顯示時長
     */
    showSuccess(message, duration = 3000) {
        this.showToast('success', message, duration);
    }

    /**
     * 顯示信息訊息
     * @param {string} message - 信息訊息
     * @param {number} duration - 顯示時間（毫秒）
     */
    showInfo(message, duration = 3000) {
        // 使用 success 類型顯示信息（因為沒有專門的 info toast）
        this.showToast('success', message, duration);
    }

    /**
     * 顯示錯誤訊息
     * @param {string} message - 錯誤訊息
     * @param {number} duration - 顯示時長
     */
    showError(message, duration = 5000) {
        this.showToast('error', message, duration);
    }

    // ==================== 事件處理 ====================

    /**
     * 角色選擇處理
     * @param {string} role - 角色 ('host' 或 'player')
     */
    handleRoleSelection(role) {
        console.log(`用戶選擇角色: ${role}`);
        
        if (role === 'host') {
            this.showScreen('host-screen');
            this.dispatchCustomEvent('roleSelected', { role: 'host' });
        } else if (role === 'player') {
            this.showScreen('player-screen');
            this.dispatchCustomEvent('roleSelected', { role: 'player' });
        } else {
            console.error(`未知的角色: ${role}`);
        }
    }

    /**
     * 處理視窗大小變更
     */
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 更新 CSS 自訂屬性
        document.documentElement.style.setProperty('--viewport-width', `${width}px`);
        document.documentElement.style.setProperty('--viewport-height', `${height}px`);
        
        // 調整字體大小 (投影幕優化)
        if (width >= 1200) {
            document.documentElement.classList.add('projector-mode');
        } else {
            document.documentElement.classList.remove('projector-mode');
        }

        console.log(`視窗尺寸變更: ${width}x${height}`);
    }

    /**
     * 檢測設備類型
     */
    detectDeviceType() {
        const userAgent = navigator.userAgent;
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android/i.test(userAgent) && window.innerWidth >= 768;
        
        if (isMobile && !isTablet) {
            document.documentElement.classList.add('mobile-device');
        } else if (isTablet) {
            document.documentElement.classList.add('tablet-device');
        } else {
            document.documentElement.classList.add('desktop-device');
        }

        console.log('設備類型檢測完成:', { isMobile, isTablet });
    }

    // ==================== 工具方法 ====================

    /**
     * 添加事件監聽器 (支援委派)
     * @param {string} selector - 選擇器
     * @param {string} event - 事件名稱
     * @param {Function} handler - 處理函數
     * @param {Object} options - 事件選項
     */
    addEventListener(selector, event, handler, options = {}) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
            element.addEventListener(event, handler, options);
            
            // 記錄事件監聽器以便後續清理
            const key = `${selector}-${event}`;
            if (!this.eventListeners.has(key)) {
                this.eventListeners.set(key, []);
            }
            this.eventListeners.get(key).push({ element, handler, options });
        });
    }

    /**
     * 移除事件監聽器
     * @param {string} selector - 選擇器
     * @param {string} event - 事件名稱
     */
    removeEventListener(selector, event) {
        const key = `${selector}-${event}`;
        const listeners = this.eventListeners.get(key);
        
        if (listeners) {
            listeners.forEach(({ element, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            this.eventListeners.delete(key);
        }
    }

    /**
     * 觸發自訂事件
     * @param {string} eventName - 事件名稱
     * @param {Object} detail - 事件詳細資訊
     */
    dispatchCustomEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        
        window.dispatchEvent(event);
        console.log(`觸發事件: ${eventName}`, detail);
    }

    /**
     * 防抖函數
     * @param {Function} func - 要防抖的函數
     * @param {number} wait - 等待時間
     * @returns {Function} 防抖後的函數
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 節流函數
     * @param {Function} func - 要節流的函數
     * @param {number} limit - 時間限制
     * @returns {Function} 節流後的函數
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 載入狀態管理
     * @param {boolean} isLoading - 是否載入中
     * @param {string} message - 載入訊息
     */
    setLoadingState(isLoading, message = '載入中...') {
        const loadingScreen = document.getElementById('loading-screen');
        
        if (!loadingScreen) {
            console.warn('載入畫面元素不存在');
            return;
        }

        if (isLoading) {
            const messageElement = loadingScreen.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            
            this.showScreen('loading-screen');
        } else {
            // 載入完成，根據 URL 參數自動判斷角色
            if (this.currentScreen === 'loading-screen') {
                const urlParams = new URLSearchParams(window.location.search);
                const joinParam = urlParams.get('join');
                
                if (joinParam) {
                    // 有 join 參數，自動設定為參賽者
                    console.log('🎯 自動設定為參賽者模式');
                    const roleEvent = new CustomEvent('roleSelected', {
                        detail: { role: 'player' }
                    });
                    window.dispatchEvent(roleEvent);
                } else {
                    // 沒有 join 參數，自動設定為主持人
                    console.log('🎮 自動設定為主持人模式');
                    const roleEvent = new CustomEvent('roleSelected', {
                        detail: { role: 'host' }
                    });
                    window.dispatchEvent(roleEvent);
                }
            }
        }
    }

    /**
     * 表單驗證輔助函數
     * @param {string} inputSelector - 輸入框選擇器
     * @param {Function} validator - 驗證函數
     * @returns {boolean} 是否驗證通過
     */
    validateInput(inputSelector, validator) {
        const input = document.querySelector(inputSelector);
        
        if (!input) {
            console.error(`輸入框不存在: ${inputSelector}`);
            return false;
        }

        try {
            const result = validator(input.value);
            
            // 移除錯誤狀態
            input.classList.remove('error');
            
            return result;
        } catch (error) {
            // 添加錯誤狀態
            input.classList.add('error');
            this.showError(error.message);
            
            return false;
        }
    }

    /**
     * 清理所有事件監聽器
     */
    cleanup() {
        console.log('清理 UI 控制器');
        
        // 清理所有事件監聽器
        this.eventListeners.forEach((listeners, key) => {
            listeners.forEach(({ element, handler, options }) => {
                element.removeEventListener(key.split('-')[1], handler, options);
            });
        });
        
        this.eventListeners.clear();
        
        // 清理定時器
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        this.isInitialized = false;
    }

    // ==================== 遊戲 UI 管理 ====================

    /**
     * 顯示參賽者列表 (主持人介面)
     * @param {Array} players - 參賽者陣列
     */
    displayPlayersList(players) {
        const playersListElement = document.getElementById('players-list');
        if (!playersListElement) {
            console.warn('參賽者列表容器不存在');
            return;
        }

        // 清空現有內容
        playersListElement.innerHTML = '';

        // 取得最大參賽者人數（從遊戲房間或預設為6）
        const maxPlayers = window.gameManager?.gameRoom?.maxPlayers || 6;
        console.log(`顯示參賽者列表，最大人數: ${maxPlayers}`);

        // 生成參賽者卡片
        for (let i = 0; i < maxPlayers; i++) {
            const player = players[i];
            const playerCard = document.createElement('div');
            
            if (player) {
                // 有參賽者的卡片
                playerCard.className = 'player-card';
                playerCard.innerHTML = `
                    <div class="connection-indicator ${player.connectionStatus === 'online' ? 'online' : 'offline'}"></div>
                    <div class="player-nickname">${this.escapeHtml(player.nickname)}</div>
                    <div class="player-status ${player.connectionStatus}">${this.getStatusText(player.connectionStatus)}</div>
                    <div class="player-position">位置 ${player.position}</div>
                `;
            } else {
                // 空位置卡片
                playerCard.className = 'player-card empty';
                playerCard.innerHTML = `
                    <div class="player-nickname">等待參賽者</div>
                    <div class="player-position">位置 ${i + 1}</div>
                `;
            }
            
            playersListElement.appendChild(playerCard);
        }

        // 更新參賽者計數
        this.updatePlayerCount(players.length);
        
        // 更新開始遊戲按鈕狀態
        this.updateStartGameButton(players.length);
        
        console.log(`參賽者列表已更新 (${players.length}/5)`);
    }

    /**
     * 更新參賽者計數顯示
     * @param {number} count - 參賽者數量
     * @param {number} maxCount - 最大參賽者數量，可選
     */
    updatePlayerCount(count, maxCount = null) {
        // 如果沒有提供最大數量，嘗試從遊戲房間獲取
        const max = maxCount || window.gameManager?.gameRoom?.maxPlayers || 6;
        
        const playerCountElement = document.getElementById('player-count');
        if (playerCountElement) {
            playerCountElement.textContent = `${count}/${max}`;
        }

        const joinedPlayerCountElement = document.getElementById('joined-player-count');
        if (joinedPlayerCountElement) {
            joinedPlayerCountElement.textContent = `${count}/${max}`;
        }
    }

    /**
     * 更新參賽者介面的個人信息
     * @param {Object} player - 參賽者對象，包含 nickname, roomCode 等信息
     */
    updatePlayerInfo(player) {
        console.log('更新參賽者信息:', player);
        
        // 更新暱稱顯示
        const myNicknameElements = [
            document.getElementById('my-nickname'),
            document.getElementById('lottery-nickname')
        ];
        
        myNicknameElements.forEach(element => {
            if (element && player.nickname) {
                element.textContent = player.nickname;
            }
        });

        // 更新房間代碼顯示
        const joinedRoomCodeElement = document.getElementById('joined-room-code');
        if (joinedRoomCodeElement && player.roomCode) {
            joinedRoomCodeElement.textContent = player.roomCode;
        }

        // 隱藏加入遊戲卡片，顯示等待卡片
        const joinGameCard = document.getElementById('join-game-card');
        const waitingCard = document.getElementById('waiting-card');
        
        if (joinGameCard) {
            joinGameCard.classList.add('hidden');
        }
        if (waitingCard) {
            waitingCard.classList.remove('hidden');
        }

        console.log('參賽者信息更新完成');
    }

    /**
     * 更新開始遊戲按鈕狀態
     * @param {number} playerCount - 參賽者數量
     */
    updateStartGameButton(playerCount) {
        const startGameBtn = document.getElementById('start-game-btn');
        if (!startGameBtn) return;

        const canStart = playerCount >= 2;
        
        startGameBtn.disabled = !canStart;
        
        const smallText = startGameBtn.querySelector('small');
        if (smallText) {
            if (canStart) {
                smallText.textContent = `${playerCount} 位參賽者準備就緒`;
            } else {
                smallText.textContent = '需要至少2位參賽者';
            }
        }
    }

    /**
     * 顯示房間資訊
     * @param {string} roomCode - 房間代碼
     * @param {Object} gameRoom - 遊戲房間對象
     */
    displayRoomInfo(roomCode, gameRoom) {
        // 顯示房間代碼
        const roomCodeElement = document.getElementById('room-code');
        if (roomCodeElement) {
            roomCodeElement.textContent = roomCode;
        }

        // 顯示遊戲狀態
        const gameStateElement = document.getElementById('game-state');
        if (gameStateElement) {
            gameStateElement.textContent = this.getGameStateText(gameRoom.gameState);
        }

        // 顯示當前輪數
        const currentRoundElement = document.getElementById('current-round');
        if (currentRoundElement) {
            currentRoundElement.textContent = `${gameRoom.currentRound}/5`;
        }

        // 隱藏建立遊戲卡片，顯示房間資訊
        const createGameCard = document.getElementById('create-game-card');
        const roomInfoCard = document.getElementById('room-info-card');
        const playersListCard = document.getElementById('players-list-card');

        if (createGameCard) createGameCard.classList.add('hidden');
        if (roomInfoCard) roomInfoCard.classList.remove('hidden');
        if (playersListCard) playersListCard.classList.remove('hidden');
    }

    /**
     * 顯示主持人 Peer ID 供參賽者連接
     * @param {string} hostPeerId - 主持人的 Peer ID
     * @param {string} roomCode - 房間代碼（可選）
     */
    displayHostPeerId(hostPeerId, roomCode = null) {
        console.log(`顯示主持人 Peer ID: ${hostPeerId}, 房間代碼: ${roomCode}`);
        
        // 創建連接資訊元素
        let connectionInfoDiv = document.getElementById('connection-info');
        if (!connectionInfoDiv) {
            connectionInfoDiv = document.createElement('div');
            connectionInfoDiv.id = 'connection-info';
            connectionInfoDiv.className = 'connection-info card';
            
            // 決定顯示的參數說明
            const paramText = roomCode ? `?join=${hostPeerId}&room=${roomCode}` : `?join=${hostPeerId}`;
            const benefitText = roomCode ? '參賽者點擊連結將自動加入遊戲，無需手動輸入房間代碼' : '參賽者點擊連結將自動進入參賽者模式';
            
            connectionInfoDiv.innerHTML = `
                <h3>參賽者連接資訊</h3>
                <div class="connection-details">
                    <div class="info-item">
                        <span class="info-label">連接方式一：直接連結</span>
                        <div class="connection-url">
                            <input type="text" id="connection-url" readonly>
                            <button id="copy-url-btn" class="btn btn-sm">複製</button>
                        </div>
                        <small>${benefitText}</small>
                    </div>
                    <div class="info-item">
                        <span class="info-label">連接方式二：手動輸入</span>
                        <div class="peer-id-display">
                            <span>主持人ID: </span>
                            <code id="host-peer-id">${hostPeerId}</code>
                            <button id="copy-peer-id-btn" class="btn btn-sm">複製</button>
                        </div>
                        <small>參賽者在加入房間頁面的 URL 後加上: ${paramText}</small>
                    </div>
                    <div class="info-item">
                        <span class="info-label">QR Code (如支援)</span>
                        <div id="qr-code-container"></div>
                    </div>
                </div>
            `;
            
            // 插入到房間資訊卡片後面
            const roomInfoCard = document.getElementById('room-info-card');
            if (roomInfoCard) {
                roomInfoCard.parentNode.insertBefore(connectionInfoDiv, roomInfoCard.nextSibling);
            }
        }
        
        // 生成包含房間代碼的連接 URL
        let connectionUrl = `${window.location.origin}${window.location.pathname}?join=${hostPeerId}`;
        if (roomCode) {
            connectionUrl += `&room=${roomCode}`;
        }
        
        const connectionUrlInput = document.getElementById('connection-url');
        if (connectionUrlInput) {
            connectionUrlInput.value = connectionUrl;
        }
        
        // 設定複製按鈕事件
        const copyUrlBtn = document.getElementById('copy-url-btn');
        const copyPeerIdBtn = document.getElementById('copy-peer-id-btn');
        
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                if (connectionUrlInput) {
                    connectionUrlInput.select();
                    document.execCommand('copy');
                    this.showToast('success', '連接連結已複製到剪貼簿');
                }
            });
        }
        
        if (copyPeerIdBtn) {
            copyPeerIdBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(hostPeerId).then(() => {
                    this.showToast('success', '主持人ID已複製到剪貼簿');
                }).catch(() => {
                    // 降級方法
                    const tempInput = document.createElement('input');
                    tempInput.value = hostPeerId;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    this.showToast('success', '主持人ID已複製到剪貼簿');
                });
            });
        }
        
        // 嘗試生成 QR Code (如果有相關函式庫)
        this.generateQRCode(connectionUrl);
    }

    /**
     * 生成 QR Code (多重備選方案)
     * @param {string} url - 要編碼的 URL
     */
    generateQRCode(url) {
        const qrContainer = document.getElementById('qr-code-container');
        if (!qrContainer) {
            console.warn('找不到 qr-code-container 元素');
            return;
        }
        
        console.log('正在生成 QR Code，URL:', url);
        
        // 顯示載入狀態
        qrContainer.innerHTML = '<div style="text-align: center; color: #666;">正在載入 QR Code...</div>';
        
        const qrSize = 150;
        const encodedUrl = encodeURIComponent(url);
        
        // 備選的 QR Code API 服務
        const qrServices = [
            {
                name: 'QR Server',
                url: `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodedUrl}`
            },
            {
                name: 'QRCode Monkey',
                url: `https://api.qrcode-monkey.com/qr/custom?data=${encodedUrl}&config={"body":"square","eye":"frame0","eyeBall":"ball0","erf1":[],"erf2":[],"erf3":[],"brf1":[],"brf2":[],"brf3":[],"bodyColor":"#000000","bgColor":"#FFFFFF","eye1Color":"#000000","eye2Color":"#000000","eye3Color":"#000000","eyeBall1Color":"#000000","eyeBall2Color":"#000000","eyeBall3Color":"#000000","gradientColor1":"","gradientColor2":"","gradientType":"linear","gradientOnEyes":"false","logo":"","logoMode":"default"}&size=${qrSize}&download=false&file=png`
            },
            {
                name: 'GoQR',
                url: `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodedUrl}&format=png`
            }
        ];
        
        let currentServiceIndex = 0;
        
        const tryNextService = () => {
            if (currentServiceIndex >= qrServices.length) {
                // 所有服務都失敗，顯示文字版本
                this.showTextQRCode(url, qrContainer);
                return;
            }
            
            const service = qrServices[currentServiceIndex];
            console.log(`嘗試 QR Code 服務 ${currentServiceIndex + 1}: ${service.name}`);
            
            const img = document.createElement('img');
            img.src = service.url;
            img.alt = 'QR Code';
            img.style.maxWidth = `${qrSize}px`;
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            
            const timeoutId = setTimeout(() => {
                console.warn(`QR Code 服務 ${service.name} 載入超時`);
                currentServiceIndex++;
                tryNextService();
            }, 5000);
            
            img.onload = () => {
                console.log(`QR Code 載入成功，使用服務: ${service.name}`);
                clearTimeout(timeoutId);
                
                qrContainer.innerHTML = '';
                qrContainer.appendChild(img);
                
                const description = document.createElement('br');
                qrContainer.appendChild(description);
                
                const small = document.createElement('small');
                small.textContent = '掃描此 QR Code 直接加入遊戲';
                small.style.color = '#666';
                qrContainer.appendChild(small);
            };
            
            img.onerror = () => {
                console.error(`QR Code 服務 ${service.name} 載入失敗`);
                clearTimeout(timeoutId);
                currentServiceIndex++;
                tryNextService();
            };
        };
        
        // 開始嘗試第一個服務
        tryNextService();
    }
    
    /**
     * 顯示文字版 QR Code（當所有圖片服務都失敗時）
     * @param {string} url - 要顯示的 URL
     * @param {HTMLElement} container - 容器元素
     */
    showTextQRCode(url, container) {
        console.log('所有 QR Code 服務都失敗，顯示文字版本');
        
        container.innerHTML = `
            <div style="border: 2px solid #007bff; padding: 15px; text-align: center; border-radius: 8px; background: #f8f9fa;">
                <div style="font-weight: bold; margin-bottom: 10px; color: #007bff;">📱 手機掃描加入</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                    請開啟手機相機掃描以下網址的 QR Code<br>
                    或直接在手機瀏覽器中輸入：
                </div>
                <div style="background: white; padding: 8px; border: 1px dashed #ccc; border-radius: 4px; word-break: break-all; font-size: 11px; color: #333;">
                    ${url}
                </div>
                <div style="font-size: 10px; color: #999; margin-top: 8px;">
                    QR Code 服務暫時無法使用
                </div>
            </div>
        `;
    }

    /**
     * 顯示參賽者等待介面
     * @param {Object} playerData - 參賽者數據
     */
    displayPlayerWaiting(playerData) {
        const { player, roomCode, playerCount } = playerData;

        // 更新參賽者資訊
        const myNicknameElement = document.getElementById('my-nickname');
        if (myNicknameElement) {
            myNicknameElement.textContent = player.nickname;
        }

        const joinedRoomCodeElement = document.getElementById('joined-room-code');
        if (joinedRoomCodeElement) {
            joinedRoomCodeElement.textContent = roomCode;
        }

        // 隱藏加入遊戲卡片，顯示等待卡片
        const joinGameCard = document.getElementById('join-game-card');
        const waitingCard = document.getElementById('waiting-card');

        if (joinGameCard) joinGameCard.classList.add('hidden');
        if (waitingCard) waitingCard.classList.remove('hidden');

        // 更新參賽者計數
        this.updatePlayerCount(playerCount);
    }

    /**
     * 獲取連線狀態文字
     * @param {string} status - 連線狀態
     * @returns {string} 狀態文字
     */
    getStatusText(status) {
        const statusTexts = {
            'online': '線上',
            'offline': '離線',
            'reconnecting': '重新連線中'
        };
        return statusTexts[status] || '未知';
    }

    /**
     * 獲取遊戲狀態文字
     * @param {string} state - 遊戲狀態
     * @returns {string} 狀態文字
     */
    getGameStateText(state) {
        const stateTexts = {
            'waiting': '等待參賽者加入',
            'lottery_in_progress': '抽籤進行中',
            'scoring': '計分中',
            'round_complete': '本輪完成',
            'game_finished': '遊戲結束'
        };
        return stateTexts[state] || '未知狀態';
    }

    /**
     * HTML 轉義
     * @param {string} text - 要轉義的文字
     * @returns {string} 轉義後的文字
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 重置主持人介面
     */
    resetHostInterface() {
        const createGameCard = document.getElementById('create-game-card');
        const roomInfoCard = document.getElementById('room-info-card');
        const playersListCard = document.getElementById('players-list-card');

        if (createGameCard) createGameCard.classList.remove('hidden');
        if (roomInfoCard) roomInfoCard.classList.add('hidden');
        if (playersListCard) playersListCard.classList.add('hidden');

        // 清空參賽者列表
        const playersListElement = document.getElementById('players-list');
        if (playersListElement) {
            playersListElement.innerHTML = '';
        }
    }

    /**
     * 重置參賽者介面
     */
    resetPlayerInterface() {
        const joinGameCard = document.getElementById('join-game-card');
        const waitingCard = document.getElementById('waiting-card');
        const lotteryCard = document.getElementById('lottery-card');

        if (joinGameCard) joinGameCard.classList.remove('hidden');
        if (waitingCard) waitingCard.classList.add('hidden');
        if (lotteryCard) lotteryCard.classList.add('hidden');

        // 清空表單
        const form = document.getElementById('join-room-form');
        if (form) {
            form.reset();
        }
    }

    // ==================== 抽籤 UI 管理 ====================

    /**
     * 顯示抽籤控制介面 (主持人)
     */
    showLotteryControl() {
        const playersListCard = document.getElementById('players-list-card');
        const lotteryControlCard = document.getElementById('lottery-control-card');

        if (playersListCard) playersListCard.classList.add('hidden');
        if (lotteryControlCard) lotteryControlCard.classList.remove('hidden');

        // 重置抽籤狀態
        this.updateLotteryStatus('準備開始', 0);
    }

    /**
     * 遊戲開始後隱藏房間資訊，保留狀態按鈕
     */
    hideRoomInfoForGameStart() {
        // 隱藏房間資訊卡片，但保留狀態按鈕
        const roomInfoCard = document.getElementById('room-info-card');
        if (roomInfoCard) {
            // 找到狀態按鈕區域
            const statusActions = roomInfoCard.querySelector('.status-actions');
            
            if (statusActions) {
                // 將狀態按鈕移到抽籤控制卡片中
                const lotteryControlCard = document.getElementById('lottery-control-card');
                if (lotteryControlCard) {
                    lotteryControlCard.appendChild(statusActions.cloneNode(true));
                }
            }
            
            roomInfoCard.classList.add('hidden');
        }
        
        // 隱藏參賽者列表卡片
        const playersListCard = document.getElementById('players-list-card');
        if (playersListCard) {
            playersListCard.classList.add('hidden');
        }
        
        // 隱藏參賽者連接資訊
        const connectionInfo = document.getElementById('connection-info');
        if (connectionInfo) {
            connectionInfo.classList.add('hidden');
        }
        
        console.log('房間資訊已隱藏，遊戲界面已啟動');
    }

    /**
     * 顯示參賽者抽籤介面
     * @param {Object} playerData - 參賽者資料
     */
    showPlayerLottery(playerData) {
        console.log('UIController.showPlayerLottery 被調用:', playerData);
        
        const waitingCard = document.getElementById('waiting-card');
        const lotteryCard = document.getElementById('lottery-card');

        console.log('找到的元素:', { 
            waitingCard: !!waitingCard, 
            lotteryCard: !!lotteryCard 
        });

        if (waitingCard) {
            waitingCard.classList.add('hidden');
            console.log('hiding waiting-card');
        } else {
            console.log('waiting-card 元素不存在');
        }
        
        if (lotteryCard) {
            lotteryCard.classList.remove('hidden');
            console.log('showing lottery-card');
        } else {
            console.log('lottery-card 元素不存在');
        }

        // 更新參賽者資訊
        const lotteryNicknameElement = document.getElementById('lottery-nickname');
        if (lotteryNicknameElement) {
            lotteryNicknameElement.textContent = playerData.nickname;
        }

        const playerCurrentRoundElement = document.getElementById('player-current-round');
        if (playerCurrentRoundElement) {
            playerCurrentRoundElement.textContent = playerData.roundNumber || 1;
        }

        // 重置抽籤狀態
        this.resetLotteryInterface();
    }

    /**
     * 重置抽籤介面狀態
     */
    resetLotteryInterface() {
        const submitNumberBtn = document.getElementById('submit-number-btn');
        const numberInput = document.getElementById('number-input');
        const lotteryActionSection = document.getElementById('lottery-action-section');
        const lotteryResultSection = document.getElementById('lottery-result-section');
        const roundScoreSection = document.getElementById('round-score-section');
        const lotteryPlayerStatus = document.getElementById('lottery-player-status');

        if (submitNumberBtn) {
            submitNumberBtn.disabled = false;
            submitNumberBtn.textContent = '確認數字';
        }

        if (numberInput) {
            numberInput.disabled = false;
            numberInput.value = '';
            numberInput.classList.remove('invalid');
        }

        if (lotteryActionSection) lotteryActionSection.classList.remove('hidden');
        if (lotteryResultSection) lotteryResultSection.classList.add('hidden');
        if (roundScoreSection) roundScoreSection.classList.add('hidden');
        if (lotteryPlayerStatus) lotteryPlayerStatus.textContent = '等待開始';
    }

    /**
     * 更新抽籤狀態顯示
     * @param {string} status - 狀態文字
     * @param {number} drawnCount - 已抽籤人數
     * @param {number} totalCount - 總參賽者人數，可選
     */
    updateLotteryStatus(status, drawnCount, totalCount = null) {
        const lotteryStatusElement = document.getElementById('lottery-status');
        const startLotteryBtn = document.getElementById('start-lottery-btn');
        
        if (lotteryStatusElement) {
            lotteryStatusElement.textContent = status;
        }

        const drawnCountElement = document.getElementById('drawn-count');
        if (drawnCountElement) {
            const total = totalCount || window.gameManager?.players?.length || 
                         window.gameManager?.gameRoom?.maxPlayers || 6;
            drawnCountElement.textContent = `${drawnCount}/${total}`;
        }
        
        // 如果是第一輪遊戲進行中，隱藏開始輸入按鈕
        if (startLotteryBtn && status.includes('進行中')) {
            const currentRound = window.gameManager?.gameRoom?.currentRound || 1;
            if (currentRound === 1) {
                startLotteryBtn.style.display = 'none';
                
                // 顯示進行中狀態
                let statusDiv = document.getElementById('game-progress-status');
                if (!statusDiv) {
                    statusDiv = document.createElement('div');
                    statusDiv.id = 'game-progress-status';
                    statusDiv.className = 'game-progress-status';
                    statusDiv.style.cssText = 'text-align: center; padding: 1rem; background: rgba(99, 102, 241, 0.1); border-radius: 0.75rem; margin: 1rem 0; color: #4f46e5; font-weight: 600; font-size: 1.125rem;';
                    startLotteryBtn.parentNode.insertBefore(statusDiv, startLotteryBtn);
                }
                statusDiv.textContent = '第一輪遊戲進行中...';
            }
        }
    }

    /**
     * 啟用參賽者輸入介面
     */
    enableInputInterface() {
        const submitNumberBtn = document.getElementById('submit-number-btn');
        const numberInput = document.getElementById('number-input');
        const lotteryPlayerStatus = document.getElementById('lottery-player-status');

        if (numberInput) {
            numberInput.disabled = false;
        }

        if (submitNumberBtn) {
            submitNumberBtn.disabled = true; // 預設禁用，直到輸入有效數字
            const smallElement = submitNumberBtn.querySelector('small');
            if (smallElement) {
                smallElement.textContent = '點擊提交您的數字';
            } else {
                console.warn('submit-number-btn 中的 small 元素未找到');
            }
        } else {
            console.warn('submit-number-btn 元素未找到');
        }

        if (lotteryPlayerStatus) {
            lotteryPlayerStatus.textContent = '請輸入數字';
        } else {
            console.warn('lottery-player-status 元素未找到');
        }
    }

    /**
     * 顯示輸入的數字
     * @param {number} inputNumber - 輸入的數字
     */
    displayInputNumber(inputNumber) {
        const submitNumberBtn = document.getElementById('submit-number-btn');
        const numberInput = document.getElementById('number-input');
        const lotteryActionSection = document.getElementById('lottery-action-section');
        const lotteryResultSection = document.getElementById('lottery-result-section');
        const drawnNumberElement = document.getElementById('drawn-number');
        const lotteryPlayerStatus = document.getElementById('lottery-player-status');

        if (submitNumberBtn) submitNumberBtn.disabled = true;
        if (numberInput) numberInput.disabled = true;
        if (lotteryActionSection) lotteryActionSection.classList.add('hidden');
        if (lotteryResultSection) lotteryResultSection.classList.remove('hidden');
        if (drawnNumberElement) drawnNumberElement.textContent = inputNumber;
        if (lotteryPlayerStatus) lotteryPlayerStatus.textContent = '已完成輸入';
    }

    /**
     * 顯示自動計分狀態區域 (主持人)
     */
    showScoringStatusSection() {
        const scoringStatusSection = document.getElementById('scoring-status-section');
        const startLotteryBtn = document.getElementById('start-lottery-btn');

        if (scoringStatusSection) scoringStatusSection.classList.remove('hidden');
        if (startLotteryBtn) startLotteryBtn.disabled = true;
        
        // 更新進度顯示
        this.updateScoringProgress();
    }

    /**
     * 更新計分進度
     */
    updateScoringProgress() {
        if (!window.gameManager || !window.gameManager.players) return;
        
        const players = window.gameManager.players;
        const playersWithNumbers = players.filter(p => p.currentNumber !== null);
        const progress = players.length > 0 ? (playersWithNumbers.length / players.length) * 100 : 0;
        
        const progressFill = document.getElementById('progress-fill');
        const infoText = document.querySelector('.info-text');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (infoText) {
            if (progress === 100) {
                infoText.textContent = '所有參賽者都已輸入，正在計算得分...';
            } else {
                infoText.textContent = `等待參賽者輸入數字... (${playersWithNumbers.length}/${players.length})`;
            }
        }
    }

    /**
     * 顯示本輪結果狀態
     * @param {Object} resultData - 結果數據
     */
    displayRoundResult(resultData) {
        const { inputNumber, targetNumber, isWinner, distance, totalWinRounds } = resultData;
        
        const scoreStatusMessage = document.getElementById('score-status-message');
        const scoreCalculation = document.querySelector('.score-calculation');
        
        // 隱藏詳細的計分區塊
        if (scoreCalculation) {
            scoreCalculation.style.display = 'none';
        }

        if (scoreStatusMessage) {
            if (isWinner) {
                scoreStatusMessage.innerHTML = `🎉 恭喜！您最接近目標數字，獲得1分！<span class="cumulative-score">目前累計得分：${totalWinRounds}分</span>`;
                scoreStatusMessage.style.color = '#10b981';
            } else {
                scoreStatusMessage.innerHTML = `距離目標數字 ${distance.toFixed(1)}，本輪未獲勝。<span class="cumulative-score">目前累計得分：${totalWinRounds}分</span>`;
                scoreStatusMessage.style.color = '#6b7280';
            }
            
            // 顯示結果訊息
            const roundScoreSection = document.getElementById('round-score-section');
            if (roundScoreSection) roundScoreSection.classList.remove('hidden');
        }
    }

    /**
     * 顯示本輪結果 (主持人)
     * @param {Object} roundData - 輪次數據
     */
    displayRoundResults(roundData) {
        const { roundNumber, targetNumber, results } = roundData;
        
        const lotteryControlCard = document.getElementById('lottery-control-card');
        const roundResultsCard = document.getElementById('round-results-card');
        const currentRoundDisplay = document.getElementById('current-round-display');
        const targetNumberDisplay = document.getElementById('target-number-display');
        const roundResultsList = document.getElementById('round-results-list');

        // 切換介面
        if (lotteryControlCard) lotteryControlCard.classList.add('hidden');
        if (roundResultsCard) roundResultsCard.classList.remove('hidden');

        // 更新標題和摘要
        if (currentRoundDisplay) currentRoundDisplay.textContent = roundNumber;
        if (targetNumberDisplay) targetNumberDisplay.textContent = targetNumber;

        // 生成結果列表
        if (roundResultsList) {
            roundResultsList.innerHTML = '';
            
            // 按勝利狀態排序，然後按總勝場排序
            const sortedResults = [...results].sort((a, b) => {
                if (a.isWinner && !b.isWinner) return -1;
                if (!a.isWinner && b.isWinner) return 1;
                return b.totalWinRounds - a.totalWinRounds;
            });
            
            sortedResults.forEach((result, index) => {
                const resultCard = document.createElement('div');
                resultCard.className = 'result-card' + (result.isWinner ? ' winner' : '');
                
                // 使用預計算的距離值（如果可用），否則計算距離
                const distance = result.distance !== undefined 
                    ? result.distance 
                    : Math.abs(result.inputNumber - targetNumber);
                
                resultCard.innerHTML = `
                    <div class="result-player-name">${this.escapeHtml(result.nickname)}</div>
                    <div class="result-number">${result.inputNumber}</div>
                    <div class="result-score ${result.isWinner ? 'winner' : ''}">${result.isWinner ? '✓ 勝利' : `距離: ${distance.toFixed(2)}`}</div>
                    <div class="result-rank">${result.isWinner ? '🏆 本輪獲勝' : '本輪未獲勝'} <span class="cumulative-score">(累計: ${result.totalWinRounds}分)</span></div>
                `;
                roundResultsList.appendChild(resultCard);
            });
        }

        // 第一輪不顯示排名，從第二輪開始才有累計排名可以顯示
        // 但基於用戶要求，移除參賽者加分列表的顯示
        // if (roundNumber > 1) {
        //     this.displayCurrentRankings();
        // }

        // 更新下一輪按鈕
        const nextRoundBtn = document.getElementById('next-round-btn');
        if (nextRoundBtn) {
            // 恢復按鈕狀態
            nextRoundBtn.disabled = false;
            
            if (roundNumber >= 5) {
                nextRoundBtn.innerHTML = '查看最終結果<small>遊戲已完成</small>';
            } else {
                const nextRound = roundNumber + 1;
                nextRoundBtn.innerHTML = `進行下一輪<small>開始第${nextRound}輪抽籤</small>`;
            }
        }
    }

    /**
     * 更新投影幕上的即時抽籤狀態
     * @param {Array} players - 參賽者列表
     * @param {Object} lotteryStats - 抽籤統計
     */
    updateProjectorLotteryStatus(players, lotteryStats) {
        const playersListElement = document.getElementById('players-list');
        if (!playersListElement) return;

        // 清空現有內容
        playersListElement.innerHTML = '';

        const roundIndex = lotteryStats.roundNumber - 1;

        // 生成參賽者卡片
        for (let i = 0; i < 5; i++) {
            const player = players[i];
            const playerCard = document.createElement('div');
            
            if (player) {
                const drawnNumber = player.drawnNumbers && player.drawnNumbers[roundIndex];
                const hasDrawn = drawnNumber !== undefined;
                
                playerCard.className = 'player-card' + (hasDrawn ? ' drawn' : '');
                playerCard.innerHTML = `
                    <div class="connection-indicator ${player.connectionStatus === 'online' ? 'online' : 'offline'}"></div>
                    <div class="player-nickname">${this.escapeHtml(player.nickname)}</div>
                    <div class="player-drawn-number">${hasDrawn ? drawnNumber : '?'}</div>
                    <div class="player-status ${hasDrawn ? 'drawn' : 'waiting'}">${hasDrawn ? '已抽籤' : '抽籤中'}</div>
                `;
            } else {
                // 空位置卡片
                playerCard.className = 'player-card empty';
                playerCard.innerHTML = `
                    <div class="player-nickname">等待參賽者</div>
                    <div class="player-position">位置 ${i + 1}</div>
                `;
            }
            
            playersListElement.appendChild(playerCard);
        }

        // 更新抽籤狀態
        this.updateLotteryStatus(
            lotteryStats.allDrawn ? '等待設定目標數字' : '抽籤進行中',
            lotteryStats.drawnCount
        );
    }

    // ==================== 動態內容生成 ====================

    /**
     * 創建按鈕元素
     * @param {string} text - 按鈕文字
     * @param {string} className - CSS 類別
     * @param {Function} onClick - 點擊處理函數
     * @returns {HTMLElement} 按鈕元素
     */
    createButton(text, className = 'btn btn-primary', onClick = null) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = className;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }

    /**
     * 創建輸入框元素
     * @param {string} type - 輸入框類型
     * @param {string} placeholder - 佔位符文字
     * @param {string} className - CSS 類別
     * @returns {HTMLElement} 輸入框元素
     */
    createInput(type = 'text', placeholder = '', className = 'form-input') {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.className = className;
        
        return input;
    }

    /**
     * 創建卡片容器
     * @param {string} content - 卡片內容 (HTML)
     * @param {string} className - 額外的 CSS 類別
     * @returns {HTMLElement} 卡片元素
     */
    createCard(content = '', className = '') {
        const card = document.createElement('div');
        card.className = `card ${className}`.trim();
        card.innerHTML = content;
        
        return card;
    }

    /**
     * 顯示當前累計排名
     */
    displayCurrentRankings() {
        const players = window.storageManager.loadPlayers() || [];
        if (players.length === 0) return;

        const currentRankingsSection = document.getElementById('current-rankings');
        const rankingsList = document.getElementById('rankings-list');

        if (!currentRankingsSection || !rankingsList) return;

        // 計算累計總分並排序
        const playersWithScores = players.map(player => ({
            playerId: player.playerId,
            nickname: player.nickname,
            totalScore: player.totalScore || 0,
            roundScores: player.roundScores || []
        })).sort((a, b) => b.totalScore - a.totalScore);

        // 生成排名列表
        rankingsList.innerHTML = '';
        
        playersWithScores.forEach((player, index) => {
            const rankingItem = document.createElement('div');
            const position = index + 1;
            
            // 確定排名樣式
            let positionClass = '';
            if (position === 1) positionClass = ' first-place';
            else if (position === 2) positionClass = ' second-place';
            else if (position === 3) positionClass = ' third-place';
            
            rankingItem.className = 'ranking-item' + positionClass;
            
            // 生成得分詳情
            const roundScoreText = player.roundScores.map((score, i) => 
                `第${i + 1}輪: ${score >= 0 ? '+' + score : score}`
            ).join(', ');
            
            rankingItem.innerHTML = `
                <div class="ranking-position">${position}</div>
                <div class="ranking-player-info">
                    <div class="ranking-player-name">${this.escapeHtml(player.nickname)}</div>
                    <div class="ranking-player-details">${roundScoreText}</div>
                </div>
                <div class="ranking-score ${player.totalScore >= 0 ? 'positive' : 'negative'}">
                    ${player.totalScore >= 0 ? '+' + player.totalScore : player.totalScore}
                </div>
            `;
            
            rankingsList.appendChild(rankingItem);
        });

        // 顯示排名區塊
        currentRankingsSection.classList.remove('hidden');
    }

    /**
     * 顯示最終結果和獲勝者宣布
     * @param {Object} finalResults - 最終結果數據
     */
    displayFinalResults(finalResults) {
        const { finalRanking, gameStats } = finalResults;
        
        // 隱藏其他卡片，顯示最終結果
        const roundResultsCard = document.getElementById('round-results-card');
        const finalResultsCard = document.getElementById('final-results-card');
        
        if (roundResultsCard) roundResultsCard.classList.add('hidden');
        if (finalResultsCard) finalResultsCard.classList.remove('hidden');
        
        // 顯示獲勝者
        this.displayWinners(finalRanking);
        
        // 顯示最終排名
        this.displayFinalRankings(finalRanking);
        
        // 顯示遊戲統計
        this.displayGameStatistics(gameStats);
        
        console.log('最終結果已顯示');
    }

    /**
     * 顯示獲勝者區域
     * @param {Array} finalRanking - 最終排名陣列
     */
    displayWinners(finalRanking) {
        const winnersSection = document.getElementById('winners-section');
        const winnersTitle = document.getElementById('winners-title');
        const winnersList = document.getElementById('winners-list');
        
        if (!winnersSection || !winnersList) return;
        
        // 找出所有獲勝者
        const winners = finalRanking.filter(player => player.isWinner);
        
        // 更新標題
        if (winnersTitle) {
            if (winners.length > 1) {
                winnersTitle.textContent = `🎉 恭喜 ${winners.length} 位並列冠軍！`;
            } else if (winners.length === 1) {
                winnersTitle.textContent = '🏆 恭喜冠軍！';
            } else {
                winnersTitle.textContent = '遊戲結束';
            }
        }
        
        // 生成獲勝者卡片
        winnersList.innerHTML = '';
        winners.forEach(winner => {
            const winnerCard = document.createElement('div');
            winnerCard.className = 'winner-card';
            winnerCard.innerHTML = `
                <div class="winner-nickname">${this.escapeHtml(winner.nickname)}</div>
                <div class="winner-score">${winner.totalWinRounds || 0} 勝</div>
            `;
            winnersList.appendChild(winnerCard);
        });
    }

    /**
     * 顯示最終排名
     * @param {Array} finalRanking - 最終排名陣列
     */
    displayFinalRankings(finalRanking) {
        const finalRankingsList = document.getElementById('final-rankings-list');
        
        if (!finalRankingsList) return;
        
        finalRankingsList.innerHTML = '';
        
        finalRanking.forEach(player => {
            const rankingItem = document.createElement('div');
            rankingItem.className = 'final-ranking-item' + (player.isWinner ? ' winner' : '');
            
            // 產生各輪狀態显示（獲勝=✓，沒獲勝=✗）
            const roundScoreText = (player.roundScores || []).map((score, i) => 
                `R${i + 1}: ${score > 0 ? '\u2713' : '\u2717'}`
            ).join(', ');
            
            rankingItem.innerHTML = `
                <div class="final-ranking-position">${player.rank}</div>
                <div class="final-ranking-info">
                    <div class="final-ranking-name">${this.escapeHtml(player.nickname)}</div>
                    <div class="final-ranking-details">${roundScoreText}</div>
                </div>
                <div class="final-ranking-score">
                    ${player.totalWinRounds || 0} 勝
                </div>
            `;
            
            finalRankingsList.appendChild(rankingItem);
        });
    }

    /**
     * 顯示遊戲統計
     * @param {Object} gameStats - 遊戲統計數據
     */
    displayGameStatistics(gameStats) {
        const statsSummary = document.getElementById('stats-summary');
        
        if (!statsSummary) return;
        
        const stats = [
            { label: '總輪數', value: gameStats.totalRounds || 5 },
            { label: '參賽者數量', value: gameStats.totalPlayers || 0 },
            { label: '最高得分', value: gameStats.highestScore || 0 },
            { label: '最低得分', value: gameStats.lowestScore || 0 },
            { label: '平均得分', value: Math.round((gameStats.averageScore || 0) * 10) / 10 },
            { label: '遊戲時長', value: gameStats.gameDuration || '未知' }
        ];
        
        statsSummary.innerHTML = '';
        stats.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            `;
            statsSummary.appendChild(statItem);
        });
    }

    // ==================== Phase 6: 遊戲狀態管理與重置 UI ====================

    /**
     * 設定 Phase 6 事件監聽器 (T045, T046)
     */
    setupPhase6EventListeners() {
        // 顯示/隱藏詳細狀態
        this.addEventListener('#toggle-detailed-status', 'click', () => {
            this.toggleDetailedGameStatus();
        });

        // 刷新狀態
        this.addEventListener('#refresh-status', 'click', () => {
            this.refreshGameStatus();
        });

        // 重新開始遊戲 (帶確認對話框)
        this.addEventListener('#reset-game-btn', 'click', () => {
            this.showResetConfirmation();
        });

        this.addEventListener('#restart-game-btn', 'click', () => {
            this.showResetConfirmation();
        });

        // 模態框事件
        this.addEventListener('#modal-close', 'click', () => {
            this.hideModal();
        });

        this.addEventListener('#modal-cancel', 'click', () => {
            this.hideModal();
        });

        this.addEventListener('#modal-confirm', 'click', () => {
            this.handleModalConfirmation();
        });

        this.addEventListener('#modal-backdrop', 'click', () => {
            this.hideModal();
        });

        // 重新連線按鈕
        this.addEventListener('#reconnect-btn', 'click', () => {
            this.handleReconnect();
        });

        // 監聽遊戲事件
        window.addEventListener('gameStateUpdated', (event) => {
            this.handleGameStateUpdate(event.detail);
        });

        window.addEventListener('playerConnectionStatusChanged', (event) => {
            this.handlePlayerConnectionStatusUpdate(event.detail);
        });

        window.addEventListener('connectionQualityUpdate', (event) => {
            this.handleConnectionQualityUpdate(event.detail);
        });

        window.addEventListener('gameReset', (event) => {
            this.handleGameResetEvent(event.detail);
        });
    }

    /**
     * 切換詳細遊戲狀態顯示 (T048)
     */
    toggleDetailedGameStatus() {
        const detailedStatus = document.getElementById('detailed-game-status');
        const toggleButton = document.getElementById('toggle-detailed-status');

        if (!detailedStatus || !toggleButton) return;

        if (detailedStatus.classList.contains('hidden')) {
            detailedStatus.classList.remove('hidden');
            toggleButton.querySelector('small').textContent = '隱藏詳細狀態';
            this.updateDetailedGameStatus();
        } else {
            detailedStatus.classList.add('hidden');
            toggleButton.querySelector('small').textContent = '查看完整遊戲統計';
        }
    }

    /**
     * 更新詳細遊戲狀態 (T048)
     */
    updateDetailedGameStatus() {
        if (!window.gameManager) return;

        const stats = window.gameManager.getGameStatistics();
        
        // 更新遊戲開始時間
        const gameStartTime = document.getElementById('game-start-time');
        if (gameStartTime && stats.gameStartTime) {
            const startTime = new Date(stats.gameStartTime);
            gameStartTime.textContent = startTime.toLocaleString('zh-TW');
        }

        // 更新已進行時間
        const gameDuration = document.getElementById('game-duration');
        if (gameDuration) {
            const duration = Math.floor(stats.gameDuration / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            gameDuration.textContent = `${minutes}分${seconds}秒`;
        }

        // 更新平均回應時間
        const avgResponseTime = document.getElementById('avg-response-time');
        if (avgResponseTime && window.webRTCManager) {
            const responseTime = window.webRTCManager.getAverageResponseTime();
            avgResponseTime.textContent = responseTime > 0 ? `${responseTime}ms` : '--';
        }

        // 更新總抽籤次數
        const totalDraws = document.getElementById('total-draws');
        if (totalDraws) {
            totalDraws.textContent = stats.totalDraws || 0;
        }

        // 更新玩家連線狀態列表
        this.updatePlayersConnectionList();
    }

    /**
     * 更新玩家連線狀態列表 (T052)
     */
    updatePlayersConnectionList() {
        const connectionList = document.getElementById('players-connection-list');
        if (!connectionList || !window.gameManager) return;

        connectionList.innerHTML = '';

        window.gameManager.players.forEach(player => {
            const connectionItem = document.createElement('div');
            connectionItem.className = 'connection-item';

            const status = player.connectionStatus || 'online';
            const statusClass = status === 'online' ? 'online' : 'offline';
            const statusText = status === 'online' ? '在線' : '離線';

            connectionItem.innerHTML = `
                <div class="player-connection-info">
                    <span class="player-name">${this.escapeHtml(player.nickname)}</span>
                    <span class="connection-status ${statusClass}">
                        <span class="connection-indicator ${statusClass}"></span>
                        ${statusText}
                    </span>
                </div>
                ${status !== 'online' ? '<small class="offline-notice">已保留遊戲數據</small>' : ''}
            `;

            connectionList.appendChild(connectionItem);
        });
    }

    /**
     * 刷新遊戲狀態
     */
    refreshGameStatus() {
        if (window.webRTCManager) {
            window.webRTCManager.requestGameState();
        }
        
        this.updateDetailedGameStatus();
        this.showToast('success', '狀態已刷新');
    }

    /**
     * 顯示重置確認對話框 (T046)
     */
    showResetConfirmation() {
        const modal = document.getElementById('confirmation-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalDetails = document.getElementById('modal-details');
        const confirmButton = document.getElementById('modal-confirm');

        if (!modal) return;

        modalTitle.textContent = '重新開始遊戲';
        modalMessage.textContent = '您確定要重新開始遊戲嗎？此操作將清除所有遊戲數據。';
        
        // 顯示遊戲統計
        if (window.gameManager) {
            const stats = window.gameManager.getGameStatistics();
            modalDetails.innerHTML = `
                <div class="reset-warning">
                    <h4>將被清除的數據：</h4>
                    <ul>
                        <li>已完成 ${stats.completedRounds} 輪遊戲</li>
                        <li>所有參賽者得分記錄</li>
                        <li>總共 ${stats.totalDraws} 次抽籤記錄</li>
                        <li>遊戲進行時間：${Math.floor(stats.gameDuration / 60000)}分鐘</li>
                    </ul>
                    <p><strong>此操作無法復原！</strong></p>
                </div>
            `;
            modalDetails.classList.remove('hidden');
        }

        confirmButton.textContent = '確認重新開始';
        confirmButton.className = 'btn btn-danger';
        
        // 設定確認動作
        this.modalConfirmAction = 'reset-game';
        
        modal.classList.remove('hidden');
    }

    /**
     * 隱藏模態框
     */
    hideModal() {
        const modal = document.getElementById('confirmation-modal');
        const modalDetails = document.getElementById('modal-details');
        
        if (modal) {
            modal.classList.add('hidden');
        }
        
        if (modalDetails) {
            modalDetails.classList.add('hidden');
            modalDetails.innerHTML = '';
        }
        
        this.modalConfirmAction = null;
    }

    /**
     * 處理模態框確認
     */
    handleModalConfirmation() {
        if (this.modalConfirmAction === 'reset-game') {
            this.executeGameReset();
        }
        
        this.hideModal();
    }

    /**
     * 執行遊戲重置
     */
    executeGameReset() {
        try {
            // 重置遊戲引擎
            if (window.gameManager) {
                window.gameManager.resetGame();
            }

            // 重置 UI 到初始狀態
            this.resetUIToInitialState();

            this.showToast('success', '遊戲已重新開始');
            
        } catch (error) {
            console.error('重置遊戲失敗:', error);
            this.showToast('error', '重置遊戲失敗：' + error.message);
        }
    }

    /**
     * 重置 UI 到初始狀態
     */
    resetUIToInitialState() {
        // 隱藏所有遊戲卡片
        const gameCards = [
            'room-info-card', 'players-list-card', 'lottery-control-card',
            'round-results-card', 'final-results-card', 'join-game-card', 
            'waiting-card', 'lottery-card'
        ];
        
        gameCards.forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) card.classList.add('hidden');
        });

        // 顯示建立遊戲卡片
        const createGameCard = document.getElementById('create-game-card');
        if (createGameCard) createGameCard.classList.remove('hidden');

        // 清空動態內容
        const playersList = document.getElementById('players-list');
        if (playersList) playersList.innerHTML = '';

        const playersConnectionList = document.getElementById('players-connection-list');
        if (playersConnectionList) playersConnectionList.innerHTML = '';

        const otherPlayersList = document.getElementById('other-players-list');
        if (otherPlayersList) otherPlayersList.innerHTML = '';

        const roundResultsList = document.getElementById('round-results-list');
        if (roundResultsList) roundResultsList.innerHTML = '';

        // 重置狀態顯示
        const gameState = document.getElementById('game-state');
        if (gameState) gameState.textContent = '等待參賽者加入';

        const playerCount = document.getElementById('player-count');
        if (playerCount) {
            const maxPlayers = window.gameManager?.gameRoom?.maxPlayers || 6;
            playerCount.textContent = `0/${maxPlayers}`;
        }

        const currentRound = document.getElementById('current-round');
        if (currentRound) currentRound.textContent = '1/5';

        // 重置連接狀態指示器
        const connectionDetails = document.getElementById('connection-details');
        if (connectionDetails) connectionDetails.textContent = '';
        
        const connectionIndicator = document.getElementById('connection-indicator');
        if (connectionIndicator) {
            connectionIndicator.classList.add('hidden');
            connectionIndicator.classList.remove('show'); // 移除show class
            connectionIndicator.style.display = 'none'; // 強制隱藏
        }
        
        // 重置連接點狀態
        const connectionDot = document.getElementById('connection-dot');
        if (connectionDot) {
            connectionDot.className = 'connection-dot offline';
        }
        
        const connectionText = document.getElementById('connection-text');
        if (connectionText) connectionText.textContent = '尚未連線';
        
        // 重置狀態值
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) connectionStatus.textContent = '尚未連線';
        
        const playerConnectionStatus = document.getElementById('player-connection-status');
        if (playerConnectionStatus) playerConnectionStatus.innerHTML = '<span class="connection-indicator offline"></span>尚未連線';
        
        // 清空參賽者相關欄位
        const myNickname = document.getElementById('my-nickname');
        if (myNickname) myNickname.textContent = '';
        
        const joinedRoomCode = document.getElementById('joined-room-code');
        if (joinedRoomCode) joinedRoomCode.textContent = '';
        
        const joinedPlayerCount = document.getElementById('joined-player-count');
        if (joinedPlayerCount) joinedPlayerCount.textContent = '0/6';
        
        // 移除動態創建的連接資訊區塊
        const connectionInfo = document.getElementById('connection-info');
        if (connectionInfo) {
            connectionInfo.remove();
        }
    }

    /**
     * 處理重新連線
     */
    handleReconnect() {
        if (window.webRTCManager) {
            // 觸發重新連線邏輯
            window.dispatchEvent(new CustomEvent('reconnectRequested'));
            this.showToast('info', '正在重新連線...');
        }
    }

    /**
     * 更新連線狀態指示器
     */
    updateConnectionIndicator(status, details = '') {
        const connectionDot = document.getElementById('connection-dot');
        const connectionText = document.getElementById('connection-text');
        const connectionDetails = document.getElementById('connection-details');
        const reconnectBtn = document.getElementById('reconnect-btn');

        if (!connectionDot || !connectionText) return;

        // 移除所有狀態類別
        connectionDot.className = 'connection-dot';
        
        switch (status) {
            case 'online':
                connectionDot.classList.add('online');
                connectionText.textContent = '正常連線';
                if (reconnectBtn) reconnectBtn.classList.add('hidden');
                break;
            case 'offline':
                connectionDot.classList.add('offline');
                connectionText.textContent = '連線中斷';
                if (reconnectBtn) reconnectBtn.classList.remove('hidden');
                break;
            case 'reconnecting':
                connectionDot.classList.add('reconnecting');
                connectionText.textContent = '重新連線中';
                if (reconnectBtn) reconnectBtn.classList.add('hidden');
                break;
            default:
                connectionDot.classList.add('unknown');
                connectionText.textContent = '連線狀態未知';
        }

        if (connectionDetails && details) {
            connectionDetails.textContent = details;
        }
    }

    /**
     * 處理遊戲狀態更新事件
     */
    handleGameStateUpdate(detail) {
        const { gameState } = detail;
        
        // 更新基本狀態顯示
        this.updateBasicGameStatus(gameState);
        
        // 如果詳細狀態可見，更新詳細資訊
        const detailedStatus = document.getElementById('detailed-game-status');
        if (detailedStatus && !detailedStatus.classList.contains('hidden')) {
            this.updateDetailedGameStatus();
        }
    }

    /**
     * 更新基本遊戲狀態顯示
     */
    updateBasicGameStatus(gameState) {
        // 更新遊戲狀態
        const gameStateElement = document.getElementById('game-state');
        if (gameStateElement && gameState.gameStatus) {
            const stateText = this.getGameStateText(gameState.gameStatus);
            gameStateElement.textContent = stateText;
        }

        // 更新參賽者人數
        const playerCount = document.getElementById('player-count');
        if (playerCount && gameState.players) {
            const maxPlayers = gameState.maxPlayers || window.gameManager?.gameRoom?.maxPlayers || 6;
            playerCount.textContent = `${gameState.players.length}/${maxPlayers}`;
        }

        // 更新當前輪數
        const currentRound = document.getElementById('current-round');
        if (currentRound && gameState.currentRound) {
            currentRound.textContent = `${gameState.currentRound}/${gameState.totalRounds || 5}`;
        }

        // 更新連線狀態
        if (gameState.connectionStatus) {
            const onlineCount = Object.values(gameState.connectionStatus)
                .filter(status => status === 'connected' || status === 'open').length;
            const totalCount = Object.keys(gameState.connectionStatus).length;
            this.updateConnectionIndicator('online', `${onlineCount}/${totalCount} 玩家在線`);
        }
    }

    /**
     * 處理玩家連線狀態更新
     */
    handlePlayerConnectionStatusUpdate(detail) {
        const { playerId, nickname, status } = detail;
        
        // 更新玩家連線狀態列表
        this.updatePlayersConnectionList();
        
        // 顯示通知
        const statusText = status === 'online' ? '已上線' : '已離線';
        this.showToast('info', `${nickname} ${statusText}`);
    }

    /**
     * 處理連線品質更新
     */
    handleConnectionQualityUpdate(detail) {
        const { peerId, quality, latency } = detail;
        
        // 更新平均回應時間顯示
        const avgResponseTime = document.getElementById('avg-response-time');
        if (avgResponseTime) {
            avgResponseTime.textContent = `${Math.round(latency)}ms`;
        }
    }

    /**
     * 處理遊戲重置事件
     */
    handleGameResetEvent(detail) {
        this.resetUIToInitialState();
        this.showToast('success', '遊戲狀態已重置');
    }

    /**
     * 獲取遊戲狀態文字
     */
    getGameStateText(gameState) {
        const stateMap = {
            'waiting': '等待參賽者加入',
            'lottery_in_progress': '抽籤進行中',
            'scoring': '計分階段',
            'round_complete': '本輪完成',
            'game_finished': '遊戲結束'
        };
        
        return stateMap[gameState] || gameState;
    }

    // ==================== Phase 7: 載入狀態和進度指示器 ====================

    /**
     * 顯示載入狀態
     * @param {string} elementId - 元素 ID
     * @param {string} message - 載入訊息
     */
    showLoading(elementId, message = '載入中...') {
        const element = document.getElementById(elementId);
        if (!element) return;

        // 添加載入狀態
        this.loadingStates.add(elementId);
        
        // 禁用按鈕或添加載入樣式
        if (element.tagName === 'BUTTON') {
            element.disabled = true;
            element.classList.add('loading');
            const originalText = element.innerHTML;
            element.dataset.originalText = originalText;
            element.innerHTML = `
                <span class="loading-spinner"></span>
                ${message}
            `;
        } else {
            element.classList.add('loading-overlay');
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-content';
            loadingDiv.innerHTML = `
                <span class="loading-spinner"></span>
                <span class="loading-message">${message}</span>
            `;
            element.appendChild(loadingDiv);
        }
    }

    /**
     * 隱藏載入狀態
     * @param {string} elementId - 元素 ID
     */
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // 移除載入狀態
        this.loadingStates.delete(elementId);
        
        if (element.tagName === 'BUTTON') {
            element.disabled = false;
            element.classList.remove('loading');
            if (element.dataset.originalText) {
                element.innerHTML = element.dataset.originalText;
                delete element.dataset.originalText;
            }
        } else {
            element.classList.remove('loading-overlay');
            const loadingContent = element.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.remove();
            }
        }
    }

    /**
     * 顯示進度條
     * @param {string} elementId - 進度條容器 ID
     * @param {number} progress - 進度百分比 (0-100)
     * @param {string} message - 進度訊息
     */
    showProgress(elementId, progress, message = '') {
        const container = document.getElementById(elementId);
        if (!container) return;

        let progressBar = container.querySelector('.progress-bar');
        if (!progressBar) {
            container.innerHTML = `
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-message"></div>
                </div>
            `;
            progressBar = container.querySelector('.progress-bar');
        }

        const progressFill = progressBar.querySelector('.progress-fill');
        const progressMessage = container.querySelector('.progress-message');

        if (progressFill) {
            progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
        
        if (progressMessage && message) {
            progressMessage.textContent = message;
        }
    }

    /**
     * 隱藏進度條
     * @param {string} elementId - 進度條容器 ID
     */
    hideProgress(elementId) {
        const container = document.getElementById(elementId);
        if (!container) return;

        const progressContainer = container.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.remove();
        }
    }

    /**
     * 顯示網路連線狀態指示器
     * @param {string} status - 連線狀態: 'connected', 'connecting', 'disconnected', 'error'
     * @param {string} message - 狀態訊息
     */
    showConnectionStatus(status, message = '') {
        let indicator = document.getElementById('connection-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'connection-indicator';
            indicator.className = 'connection-indicator';
            document.body.appendChild(indicator);
        }

        // 移除舊的狀態類別
        indicator.className = 'connection-indicator';
        indicator.classList.add(`status-${status}`);

        const statusIcons = {
            connected: '🟢',
            connecting: '🟡', 
            disconnected: '🔴',
            error: '⚠️'
        };

        const statusTexts = {
            connected: '已連線',
            connecting: '連線中...',
            disconnected: '已斷線',
            error: '連線錯誤'
        };

        indicator.innerHTML = `
            <span class="status-icon">${statusIcons[status] || '⚫'}</span>
            <span class="status-text">${message || statusTexts[status] || status}</span>
        `;

        // 自動隱藏成功狀態
        if (status === 'connected') {
            setTimeout(() => {
                if (indicator.classList.contains('status-connected')) {
                    indicator.style.opacity = '0';
                    setTimeout(() => indicator.remove(), 300);
                }
            }, 3000);
        }
    }
}

// 創建全域實例
const uiController = new UIController();

// 當 DOM 載入完成時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        uiController.init();
    });
} else {
    uiController.init();
}

// 匯出供其他模組使用
window.UIController = UIController;
window.uiController = uiController;
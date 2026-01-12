/**
 * 數字抽籤遊戲 - WebRTC 管理器 (PeerJS 實現)
 * 負責 P2P 連線設定和訊息傳遞
 * 支援降級模式，當 PeerJS 不可用時使用本地模擬
 */

class WebRTCManager {
    constructor() {
        this.peer = null; // PeerJS 實例
        this.connections = new Map(); // playerId -> DataConnection
        this.connectionStatus = new Map(); // playerId -> status
        this.messageHandlers = new Map(); // messageType -> handler function
        this.isHost = false;
        this.hostId = 'host';
        this.myPlayerId = null;
        this.roomCode = null;
        this.fallbackMode = false; // 降級模式標誌
        
        // PeerJS 配置
        this.peerConfig = {
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        };
        
        console.log('WebRTCManager 構造函數已執行');
        
        // 初始化 PeerJS（異步）
        this.initializePeerJS();
    }

    /**
     * 初始化 PeerJS
     */
    async initializePeerJS() {
        try {
            // 動態載入 PeerJS
            if (typeof Peer === 'undefined') {
                await this.loadPeerJS();
            }
            console.log('PeerJS 載入成功');
        } catch (error) {
            console.warn('PeerJS 載入失敗，使用降級模式:', error);
            this.fallbackMode = true;
        }
    }

    /**
     * 動態載入 PeerJS 函式庫
     */
    loadPeerJS() {
        return new Promise((resolve, reject) => {
            if (typeof Peer !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
            script.onload = resolve;
            script.onerror = () => {
                console.warn('無法載入 PeerJS，切換到降級模式');
                reject(new Error('PeerJS load failed'));
            };
            document.head.appendChild(script);
            
            // 設定載入超時
            setTimeout(() => {
                reject(new Error('PeerJS load timeout'));
            }, 10000);
        });
    }

    /**
     * 設定為主持人模式
     */
    async setupAsHost() {
        this.isHost = true;
        this.myPlayerId = this.hostId;
        
        if (this.fallbackMode) {
            console.log('WebRTC 管理器設定為主持人模式 (降級模式)');
            return this.hostId;
        }
        
        try {
            // 等待 PeerJS 載入完成
            await this.waitForPeerJS();
            
            // 創建唯一的主持人 ID
            const hostPeerId = `host_${Date.now()}`;
            this.peer = new Peer(hostPeerId, this.peerConfig);
            
            return new Promise((resolve, reject) => {
                this.peer.on('open', (id) => {
                    console.log(`主持人 Peer ID: ${id}`);
                    this.myPlayerId = id;
                    resolve(id);
                });
                
                this.peer.on('connection', (conn) => {
                    this.handleIncomingConnection(conn);
                });
                
                this.peer.on('error', (err) => {
                    console.error('主持人 Peer 錯誤:', err);
                    this.fallbackMode = true;
                    resolve(this.hostId);
                });
                
                // 超時處理
                setTimeout(() => {
                    if (!this.peer || !this.peer.open) {
                        console.warn('WebRTC 初始化超時，切換到降級模式');
                        this.fallbackMode = true;
                        resolve(this.hostId);
                    }
                }, 5000);
            });
            
        } catch (error) {
            console.warn('WebRTC 初始化失敗，切換到降級模式:', error);
            this.fallbackMode = true;
            return this.hostId;
        }
    }

    /**
     * 設定為參賽者模式
     */
    async setupAsPlayer(playerId) {
        this.isHost = false;
        this.myPlayerId = playerId;
        
        if (this.fallbackMode) {
            console.log(`WebRTC 管理器設定為參賽者模式，玩家ID: ${playerId} (降級模式)`);
            return playerId;
        }
        
        try {
            // 等待 PeerJS 載入完成
            await this.waitForPeerJS();
            
            this.peer = new Peer(playerId, this.peerConfig);
            
            return new Promise((resolve, reject) => {
                this.peer.on('open', (id) => {
                    console.log(`參賽者 Peer ID: ${id}`);
                    this.myPlayerId = id;
                    resolve(id);
                });
                
                this.peer.on('error', (err) => {
                    console.error('參賽者 Peer 錯誤:', err);
                    this.fallbackMode = true;
                    resolve(playerId);
                });
                
                // 超時處理
                setTimeout(() => {
                    if (!this.peer || !this.peer.open) {
                        console.warn('WebRTC 初始化超時，切換到降級模式');
                        this.fallbackMode = true;
                        resolve(playerId);
                    }
                }, 5000);
            });
            
        } catch (error) {
            console.warn('WebRTC 初始化失敗，切換到降級模式:', error);
            this.fallbackMode = true;
            return playerId;
        }
    }

    /**
     * 等待 PeerJS 載入完成
     */
    async waitForPeerJS() {
        if (typeof Peer !== 'undefined') return;
        
        let attempts = 0;
        const maxAttempts = 20;
        
        while (typeof Peer === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }
        
        if (typeof Peer === 'undefined') {
            throw new Error('PeerJS not available after waiting');
        }
    }

    /**
     * 處理傳入的連接
     */
    handleIncomingConnection(conn) {
        console.log(`收到來自 ${conn.peer} 的連接請求`);
        
        // 檢查連接是否已經打開
        if (conn.open) {
            console.log(`連接 ${conn.peer} 已經是打開狀態`);
            this.connections.set(conn.peer, conn);
            this.connectionStatus.set(conn.peer, 'connected');
            
            // 通知應用層有新玩家連接
            if (this.isHost) {
                console.log(`觸發 playerConnected 事件給 ${conn.peer}`);
                window.dispatchEvent(new CustomEvent('playerConnected', {
                    detail: { playerId: conn.peer }
                }));
            }
        }
        
        conn.on('open', () => {
            console.log(`與 ${conn.peer} 的連接已建立`);
            this.connections.set(conn.peer, conn);
            this.connectionStatus.set(conn.peer, 'connected');
            
            // 通知應用層有新玩家連接
            if (this.isHost) {
                console.log(`觸發 playerConnected 事件給 ${conn.peer}`);
                window.dispatchEvent(new CustomEvent('playerConnected', {
                    detail: { playerId: conn.peer }
                }));
            }
        });
        
        conn.on('data', (data) => {
            this.handleMessage(data, conn.peer);
        });
        
        conn.on('close', () => {
            console.log(`與 ${conn.peer} 的連接已關閉`);
            this.connections.delete(conn.peer);
            this.connectionStatus.set(conn.peer, 'disconnected');
        });
        
        conn.on('error', (err) => {
            console.error(`與 ${conn.peer} 的連接錯誤:`, err);
            this.connectionStatus.set(conn.peer, 'error');
        });
    }

    /**
     * 連接到主持人
     */
    async connectToHost(hostPeerId) {
        if (this.fallbackMode) {
            console.log(`模擬連接到主持人 ${hostPeerId} (降級模式)`);
            return true;
        }
        
        if (!this.peer || !this.peer.open) {
            throw new Error('Peer 尚未準備就緒');
        }
        
        // 檢查主持人 ID 格式
        if (!hostPeerId || !hostPeerId.startsWith('host_')) {
            throw new Error('無效的主持人 ID 格式');
        }
        
        try {
            console.log(`嘗試連接到主持人: ${hostPeerId}`);
            console.log('當前 Peer 狀態:', {
                open: this.peer.open, 
                id: this.peer.id,
                disconnected: this.peer.disconnected,
                destroyed: this.peer.destroyed
            });
            
            // 檢查是否已經有連接
            if (this.connections.has(hostPeerId)) {
                const existingConn = this.connections.get(hostPeerId);
                if (existingConn.open) {
                    console.log('已存在的連接仍然有效');
                    return true;
                } else {
                    console.log('清理舊的無效連接');
                    this.connections.delete(hostPeerId);
                }
            }
            
            const conn = this.peer.connect(hostPeerId);
            console.log('連接對象已創建:', conn);
            
            return new Promise((resolve, reject) => {
                let connectionTimeout;
                
                conn.on('open', () => {
                    console.log(`成功連接到主持人 ${hostPeerId}`);
                    clearTimeout(connectionTimeout);
                    this.connections.set(hostPeerId, conn);
                    this.connectionStatus.set(hostPeerId, 'connected');
                    
                    // 不在這裡自動發送加入房間請求，讓調用方決定何時發送
                    resolve(true);
                });
                
                conn.on('data', (data) => {
                    this.handleMessage(data, hostPeerId);
                });
                
                conn.on('close', () => {
                    console.log('與主持人的連接已關閉');
                    clearTimeout(connectionTimeout);
                    this.connectionStatus.set(hostPeerId, 'disconnected');
                });
                
                conn.on('error', (err) => {
                    console.error('連接主持人時發生錯誤:', err);
                    clearTimeout(connectionTimeout);
                    this.connectionStatus.set(hostPeerId, 'error');
                    reject(err);
                });
                
                // 連接超時處理
                connectionTimeout = setTimeout(() => {
                    if (!conn.open) {
                        console.warn('連接主持人超時');
                        console.log('連接狀態:', {
                            connOpen: conn.open,
                            peerOpen: this.peer.open,
                            peerId: this.peer.id,
                            targetId: hostPeerId
                        });
                        reject(new Error('Connection timeout'));
                    }
                }, 15000); // 增加到15秒
            });
            
        } catch (error) {
            console.error('連接主持人失敗:', error);
            throw error;
        }
    }

    /**
     * 發送訊息
     */
    sendMessage(message, targetPlayerId = null) {
        console.log('發送訊息:', message, targetPlayerId ? `給 ${targetPlayerId}` : '(廣播)');
        
        if (this.fallbackMode) {
            // 降級模式：使用本地事件模擬
            this.simulateMessage(message, targetPlayerId);
            return true;
        }
        
        if (targetPlayerId) {
            // 發送給特定玩家
            const conn = this.connections.get(targetPlayerId);
            if (conn && conn.open) {
                try {
                    conn.send(message);
                    return true;
                } catch (error) {
                    console.error(`發送訊息給 ${targetPlayerId} 失敗:`, error);
                    return false;
                }
            } else {
                console.warn(`無法發送訊息給 ${targetPlayerId}: 連接不可用`);
                return false;
            }
        } else {
            // 廣播給所有玩家
            let sent = 0;
            this.connections.forEach((conn, playerId) => {
                if (conn && conn.open) {
                    try {
                        conn.send(message);
                        sent++;
                    } catch (error) {
                        console.error(`廣播訊息給 ${playerId} 失敗:`, error);
                    }
                }
            });
            console.log(`成功廣播訊息給 ${sent} 位玩家`);
            return sent > 0;
        }
    }

    /**
     * 模擬訊息傳遞 (降級模式)
     */
    simulateMessage(message, targetPlayerId = null) {
        console.log('使用降級模式模擬訊息傳遞');
        
        // 在同一頁面實例中直接觸發事件處理
        setTimeout(() => {
            this.handleMessage(message, this.myPlayerId);
        }, 50); // 模擬網路延遲
    }

    /**
     * 處理收到的訊息
     */
    handleMessage(message, senderId) {
        console.log(`收到來自 ${senderId} 的訊息:`, message);
        
        const messageType = message.type;
        const handler = this.messageHandlers.get(messageType);
        
        if (handler) {
            try {
                handler(message.data, senderId);
            } catch (error) {
                console.error(`處理訊息 ${messageType} 時發生錯誤:`, error);
            }
        } else {
            // 預設訊息處理
            this.handleDefaultMessage(messageType, message.data, senderId);
        }
    }

    /**
     * 預設訊息處理
     */
    handleDefaultMessage(messageType, data, senderId) {
        console.log(`處理預設訊息: ${messageType}`);
        
        switch (messageType) {
            case 'lotteryStarted':
                window.dispatchEvent(new CustomEvent('lotteryStarted', { detail: data }));
                break;
            case 'playerJoined':
                window.dispatchEvent(new CustomEvent('playerJoined', { detail: data }));
                break;
            case 'numberDrawn':
                window.dispatchEvent(new CustomEvent('numberDrawn', { detail: data }));
                break;
            case 'drawNumberError':
                if (!this.isHost) {
                    console.error('抽取數字失敗:', data.error);
                    window.uiController?.showError('抽取數字失敗: ' + data.error);
                }
                break;
            case 'drawNumber':
                if (this.isHost) {
                    console.log(`玩家 ${senderId} 請求抽取數字`);
                    window.dispatchEvent(new CustomEvent('drawNumberRequest', { 
                        detail: { ...data, playerId: senderId }
                    }));
                }
                break;
            case 'targetSet':
                window.dispatchEvent(new CustomEvent('targetSet', { detail: data }));
                break;
            case 'joinRoom':
                if (this.isHost) {
                    console.log(`玩家 ${senderId} 請求加入房間`);
                    // 主持人處理加入請求 - 使用 senderId 作為 playerId，其他數據來自 data
                    window.dispatchEvent(new CustomEvent('playerJoinRequest', { 
                        detail: { ...data, playerId: senderId }
                    }));
                }
                break;
            case 'joinResponse':
                if (!this.isHost) {
                    console.log('收到主持人的加入回應:', data);
                    // 參賽者處理加入回應
                    window.dispatchEvent(new CustomEvent('joinResponse', { 
                        detail: data 
                    }));
                }
                break;
            default:
                console.log(`未處理的訊息類型: ${messageType}`, data);
        }
    }

    /**
     * 註冊訊息處理器
     */
    registerMessageHandler(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
        console.log(`已註冊 ${messageType} 訊息處理器`);
    }

    /**
     * 獲取連接狀態
     */
    getConnectionStatus(playerId = null) {
        if (playerId) {
            return this.connectionStatus.get(playerId) || 'disconnected';
        }
        return Array.from(this.connectionStatus.entries());
    }

    /**
     * 斷開連接
     */
    disconnect() {
        console.log('正在斷開所有連接...');
        
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        
        this.connections.clear();
        this.connectionStatus.clear();
        
        console.log('已斷開所有連接');
    }

    /**
     * 獲取主持人的 Peer ID（供參賽者連接使用）
     */
    getHostPeerId() {
        return this.isHost ? this.myPlayerId : null;
    }

    /**
     * 獲取房間連接信息（包含 QR Code 數據）
     */
    getRoomConnectionInfo() {
        if (!this.isHost || this.fallbackMode) {
            return null;
        }
        
        const roomInfo = {
            hostPeerId: this.myPlayerId,
            roomCode: this.roomCode || 'UNKNOWN',
            gameUrl: window.location.href,
            connectionUrl: `${window.location.origin}${window.location.pathname}?join=${this.myPlayerId}&room=${this.roomCode}`,
            timestamp: Date.now()
        };
        
        return roomInfo;
    }

    /**
     * 獲取診斷資訊
     */
    getDiagnostics() {
        return {
            isHost: this.isHost,
            myPlayerId: this.myPlayerId,
            roomCode: this.roomCode,
            connectionsCount: this.connections.size,
            connectionStatus: Array.from(this.connectionStatus.entries()),
            fallbackMode: this.fallbackMode,
            peerReady: this.peer ? this.peer.open : false,
            timestamp: new Date().toISOString()
        };
    }
}

// 創建全域實例和匯出
const webRTCManager = new WebRTCManager();

// 匯出供其他模組使用
window.WebRTCManager = WebRTCManager;
window.webRTCManager = webRTCManager;

console.log('WebRTCManager 已成功載入並設為全域變數');
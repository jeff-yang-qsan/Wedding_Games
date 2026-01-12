/**
 * 數字抽籤遊戲 - WebRTC 管理器 (簡化版)
 * 負責 P2P 連線設定和訊息傳遞
 */

class WebRTCManager {
    constructor() {
        this.peers = new Map(); // playerId -> RTCPeerConnection
        this.dataChannels = new Map(); // playerId -> RTCDataChannel
        this.connectionStatus = new Map(); // playerId -> status
        this.messageHandlers = new Map(); // messageType -> handler function
        this.heartbeatInterval = null;
        this.heartbeatTimeout = 30000; // 30秒
        this.isHost = false;
        this.hostId = 'host';
        this.myPlayerId = null;
        
        // 連線品質監控
        this.connectionStats = new Map(); // playerId -> stats
        this.statsInterval = null;
        this.statsUpdateInterval = 5000; // 5秒更新一次
        
        // WebRTC 配置
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        };
        
        console.log('WebRTCManager 構造函數已執行');
    }

    /**
     * 初始化 WebRTC 管理器
     */
    init() {
        console.log('WebRTC 管理器已初始化');
        // 初始化邏輯可以在這裡添加
    }

    /**
     * 建立新房間（主持人）
     */
    createRoom(roomCode) {
        this.isHost = true;
        this.myPlayerId = this.hostId;
        console.log(`主持人建立房間: ${roomCode}`);
        return roomCode;
    }

    /**
     * 加入房間（參賽者）
     */
    joinRoom(roomCode, playerId) {
        this.isHost = false;
        this.myPlayerId = playerId;
        console.log(`參賽者 ${playerId} 加入房間: ${roomCode}`);
        return true;
    }

    /**
     * 發送訊息
     */
    sendMessage(message, targetPlayerId = null) {
        console.log('發送訊息:', message);
        // 簡化版本 - 只記錄訊息，不實際傳送
        return true;
    }

    /**
     * 註冊訊息處理器
     */
    registerMessageHandler(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
        console.log(`註冊訊息處理器: ${messageType}`);
    }

    /**
     * 取得連線狀態
     */
    getConnectionStatus(playerId = null) {
        if (playerId) {
            return this.connectionStatus.get(playerId) || 'offline';
        }
        return this.isHost ? 'host' : 'connected';
    }

    /**
     * 斷線重連
     */
    reconnect() {
        console.log('嘗試重新連線...');
        return Promise.resolve(true);
    }

    /**
     * 關閉所有連線
     */
    disconnect() {
        console.log('關閉 WebRTC 連線');
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        this.peers.clear();
        this.dataChannels.clear();
        this.connectionStatus.clear();
    }

    /**
     * 取得診斷資訊
     */
    getDiagnostics() {
        return {
            isHost: this.isHost,
            myPlayerId: this.myPlayerId,
            peersCount: this.peers.size,
            connectionStatus: Array.from(this.connectionStatus.entries()),
            timestamp: new Date().toISOString()
        };
    }
}
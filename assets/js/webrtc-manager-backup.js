/**
 * 數字抽籤遊戲 - WebRTC 管理器
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
        
        // Phase 7: 連線品質監控
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

        this.init();
    }

    /**
     * 初始化 WebRTC 管理器
     */
    init() {
        console.log('WebRTC 管理器已初始化');
        // 初始化邏輯可以在這裡添加
    }
}

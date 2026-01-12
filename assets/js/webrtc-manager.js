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
        console.log('WebRTC Manager 初始化');
        this.setupMessageHandlers();
        this.startHeartbeat();
    }

    /**
     * 設定訊息處理器
     */
    setupMessageHandlers() {
        // 註冊基本訊息處理器
        this.registerMessageHandler('HEARTBEAT', this.handleHeartbeat.bind(this));
        this.registerMessageHandler('HEARTBEAT_ACK', this.handleHeartbeatAck.bind(this));
        this.registerMessageHandler('ERROR', this.handleError.bind(this));
        
        // 註冊遊戲訊息處理器
        this.registerMessageHandler('CREATE_ROOM', this.handleCreateRoom.bind(this));
        this.registerMessageHandler('JOIN_ROOM', this.handleJoinRoom.bind(this));
        this.registerMessageHandler('ROOM_CREATED', this.handleRoomCreated.bind(this));
        this.registerMessageHandler('PLAYER_JOINED', this.handlePlayerJoined.bind(this));
        this.registerMessageHandler('PLAYER_LEFT', this.handlePlayerLeft.bind(this));
        this.registerMessageHandler('ROOM_FULL', this.handleRoomFull.bind(this));
        this.registerMessageHandler('NICKNAME_TAKEN', this.handleNicknameTaken.bind(this));
        
        // 註冊抽籤相關訊息處理器
        this.registerMessageHandler('START_LOTTERY', this.handleStartLottery.bind(this));
        this.registerMessageHandler('DRAW_NUMBER', this.handleDrawNumber.bind(this));
        this.registerMessageHandler('SET_TARGET_NUMBER', this.handleSetTargetNumber.bind(this));
        this.registerMessageHandler('LOTTERY_STARTED', this.handleLotteryStarted.bind(this));
        this.registerMessageHandler('NUMBER_DRAWN', this.handleNumberDrawn.bind(this));
        this.registerMessageHandler('TARGET_SET', this.handleTargetSet.bind(this));
        this.registerMessageHandler('ROUND_COMPLETE', this.handleRoundComplete.bind(this));
        this.registerMessageHandler('START_NEXT_ROUND', this.handleStartNextRound.bind(this));
        
        // Phase 6: 註冊遊戲狀態管理訊息處理器
        this.registerMessageHandler('GET_GAME_STATE', this.handleGetGameState.bind(this));
        this.registerMessageHandler('GAME_STATE_RESPONSE', this.handleGameStateResponse.bind(this));
        this.registerMessageHandler('RESET_GAME', this.handleResetGame.bind(this));
        this.registerMessageHandler('GAME_RESET', this.handleGameReset.bind(this));
        this.registerMessageHandler('PLAYER_DISCONNECTED', this.handlePlayerDisconnected.bind(this));
        this.registerMessageHandler('PLAYER_RECONNECTED', this.handlePlayerReconnected.bind(this));
        this.registerMessageHandler('RECONNECT', this.handleReconnect.bind(this));
        this.registerMessageHandler('CONNECTION_STATUS_UPDATE', this.handleConnectionStatusUpdate.bind(this));
    }

    /**
     * 註冊訊息處理器
     * @param {string} messageType - 訊息類型
     * @param {Function} handler - 處理函數
     */
    registerMessageHandler(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    /**
     * 設定為主持人
     * @param {string} hostId - 主持人ID
     */
    setupAsHost(hostId = 'host') {
        this.isHost = true;
        this.myPlayerId = hostId;
        this.hostId = hostId;
        console.log('設定為主持人:', hostId);
    }

    /**
     * 設定為參賽者
     * @param {string} playerId - 參賽者ID
     */
    setupAsPlayer(playerId) {
        this.isHost = false;
        this.myPlayerId = playerId;
        console.log('設定為參賽者:', playerId);
    }

    /**
     * 創建 P2P 連線
     * @param {string} targetId - 目標 ID (主持人或參賽者)
     * @param {boolean} isInitiator - 是否為連線發起者
     */
    async createPeerConnection(targetId, isInitiator = false) {
        try {
            console.log(`創建與 ${targetId} 的 P2P 連線 (發起者: ${isInitiator})`);
            
            const peerConnection = new RTCPeerConnection(this.rtcConfig);
            this.peers.set(targetId, peerConnection);
            this.connectionStatus.set(targetId, 'connecting');

            // 設定事件監聽器
            this.setupPeerConnectionEventListeners(peerConnection, targetId);

            if (isInitiator) {
                // 發起者創建 data channel
                const dataChannel = peerConnection.createDataChannel('gameData', {
                    ordered: true
                });
                this.setupDataChannelEventListeners(dataChannel, targetId);
                this.dataChannels.set(targetId, dataChannel);

                // 創建 offer
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                
                // 在實際應用中，這裡需要透過信令伺服器發送 offer
                console.log('Offer 已創建，等待信令交換...');
            } else {
                // 接收者等待 data channel
                peerConnection.ondatachannel = (event) => {
                    const dataChannel = event.channel;
                    this.setupDataChannelEventListeners(dataChannel, targetId);
                    this.dataChannels.set(targetId, dataChannel);
                };
            }

        } catch (error) {
            console.error('創建 P2P 連線失敗:', error);
            this.connectionStatus.set(targetId, 'error');
            throw error;
        }
    }

    /**
     * 設定 PeerConnection 事件監聽器
     * @param {RTCPeerConnection} peerConnection 
     * @param {string} targetId 
     */
    setupPeerConnectionEventListeners(peerConnection, targetId) {
        peerConnection.onconnectionstatechange = () => {
            console.log(`連線狀態變更 (${targetId}):`, peerConnection.connectionState);
            this.connectionStatus.set(targetId, peerConnection.connectionState);
            
            if (peerConnection.connectionState === 'connected') {
                console.log(`與 ${targetId} 連線成功`);
                this.onConnectionEstablished(targetId);
            } else if (peerConnection.connectionState === 'disconnected' || 
                       peerConnection.connectionState === 'failed') {
                console.log(`與 ${targetId} 連線中斷`);
                this.onConnectionLost(targetId);
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('ICE candidate:', event.candidate);
                // 在實際應用中，這裡需要透過信令伺服器發送 candidate
            }
        };

        peerConnection.onicegatheringstatechange = () => {
            console.log(`ICE gathering state (${targetId}):`, peerConnection.iceGatheringState);
        };
    }

    /**
     * 設定 DataChannel 事件監聽器
     * @param {RTCDataChannel} dataChannel 
     * @param {string} targetId 
     */
    setupDataChannelEventListeners(dataChannel, targetId) {
        dataChannel.onopen = () => {
            console.log(`Data channel 開啟 (${targetId})`);
            this.connectionStatus.set(targetId, 'open');
        };

        dataChannel.onclose = () => {
            console.log(`Data channel 關閉 (${targetId})`);
            this.connectionStatus.set(targetId, 'closed');
        };

        dataChannel.onmessage = (event) => {
            this.handleIncomingMessage(event.data, targetId);
        };

        dataChannel.onerror = (error) => {
            console.error(`Data channel 錯誤 (${targetId}):`, error);
            this.connectionStatus.set(targetId, 'error');
        };
    }

    /**
     * 處理收到的訊息
     * @param {string} data - 訊息資料
     * @param {string} senderId - 發送者ID
     */
    handleIncomingMessage(data, senderId) {
        try {
            const message = JSON.parse(data);
            console.log(`收到訊息 (${senderId}):`, message);

            // 驗證訊息格式
            if (!message.type || !message.timestamp || !message.senderId) {
                throw new Error('訊息格式無效');
            }

            // 查找並執行處理器
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
                handler(message, senderId);
            } else {
                console.warn(`未知的訊息類型: ${message.type}`);
            }

        } catch (error) {
            console.error('處理訊息失敗:', error);
            this.sendError(senderId, 'MESSAGE_PARSE_ERROR', error.message);
        }
    }

    /**
     * 發送訊息
     * @param {string} targetId - 目標ID
     * @param {string} type - 訊息類型
     * @param {Object} data - 訊息數據
     */
    sendMessage(targetId, type, data = {}) {
        try {
            const dataChannel = this.dataChannels.get(targetId);
            
            if (!dataChannel || dataChannel.readyState !== 'open') {
                throw new Error(`與 ${targetId} 的連線未就緒`);
            }

            const message = {
                type,
                timestamp: new Date().toISOString(),
                senderId: this.myPlayerId,
                data
            };

            const messageString = JSON.stringify(message);
            dataChannel.send(messageString);
            
            console.log(`訊息已發送到 ${targetId}:`, message);

        } catch (error) {
            console.error('發送訊息失敗:', error);
            throw error;
        }
    }

    /**
     * 廣播訊息給所有連線的對等端
     * @param {string} type - 訊息類型
     * @param {Object} data - 訊息數據
     */
    broadcastMessage(type, data = {}) {
        const connectedPeers = Array.from(this.dataChannels.entries())
            .filter(([_, channel]) => channel.readyState === 'open')
            .map(([peerId, _]) => peerId);

        console.log(`廣播訊息給 ${connectedPeers.length} 個對等端:`, type);

        connectedPeers.forEach(peerId => {
            try {
                this.sendMessage(peerId, type, data);
            } catch (error) {
                console.error(`廣播到 ${peerId} 失敗:`, error);
            }
        });
    }

    /**
     * 發送錯誤訊息
     * @param {string} targetId - 目標ID
     * @param {string} errorCode - 錯誤代碼
     * @param {string} message - 錯誤訊息
     */
    sendError(targetId, errorCode, message) {
        this.sendMessage(targetId, 'ERROR', {
            errorCode,
            message,
            details: {}
        });
    }

    // ==================== 訊息處理器 ====================

    /**
     * 處理心跳訊息
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleHeartbeat(message, senderId) {
        // 回覆心跳確認
        this.sendMessage(senderId, 'HEARTBEAT_ACK', {
            latency: Date.now() - new Date(message.timestamp).getTime()
        });
    }

    /**
     * 處理心跳確認
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleHeartbeatAck(message, senderId) {
        console.log(`心跳確認來自 ${senderId}, 延遲: ${message.data.latency}ms`);
        // 更新連線品質統計
    }

    /**
     * 處理錯誤訊息
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleError(message, senderId) {
        console.error(`來自 ${senderId} 的錯誤:`, message.data);
        // 可以觸發 UI 錯誤顯示
    }

    // ==================== 連線管理 ====================

    /**
     * 連線建立時的回調
     * @param {string} peerId - 對等端ID
     */
    onConnectionEstablished(peerId) {
        console.log(`連線已建立: ${peerId}`);
        // 觸發連線成功事件
        window.dispatchEvent(new CustomEvent('peerConnected', {
            detail: { peerId }
        }));
    }

    /**
     * 連線中斷時的回調
     * @param {string} peerId - 對等端ID
     */
    onConnectionLost(peerId) {
        console.log(`連線已中斷: ${peerId}`);
        this.connectionStatus.set(peerId, 'offline');
        
        // 觸發連線中斷事件
        window.dispatchEvent(new CustomEvent('peerDisconnected', {
            detail: { peerId }
        }));

        // 嘗試重新連線
        setTimeout(() => {
            this.attemptReconnection(peerId);
        }, 5000);
    }

    /**
     * 嘗試重新連線
     * @param {string} peerId - 對等端ID
     */
    async attemptReconnection(peerId) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                console.log(`嘗試重新連線到 ${peerId} (${retryCount + 1}/${maxRetries})`);
                
                // 清理舊連線
                this.closePeerConnection(peerId);
                
                // 建立新連線
                await this.createPeerConnection(peerId, !this.isHost);
                
                console.log(`重新連線成功: ${peerId}`);
                return;
                
            } catch (error) {
                console.error(`重新連線失敗 (${retryCount + 1}/${maxRetries}):`, error);
                retryCount++;
                
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                }
            }
        }

        console.error(`重新連線最終失敗: ${peerId}`);
        this.connectionStatus.set(peerId, 'failed');
    }

    /**
     * 關閉與特定對等端的連線
     * @param {string} peerId - 對等端ID
     */
    closePeerConnection(peerId) {
        const peerConnection = this.peers.get(peerId);
        const dataChannel = this.dataChannels.get(peerId);

        if (dataChannel) {
            dataChannel.close();
            this.dataChannels.delete(peerId);
        }

        if (peerConnection) {
            peerConnection.close();
            this.peers.delete(peerId);
        }

        this.connectionStatus.delete(peerId);
        console.log(`已關閉與 ${peerId} 的連線`);
    }

    // ==================== 心跳系統 ====================

    /**
     * 啟動心跳檢測
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeatToAll();
        }, this.heartbeatTimeout);
    }

    /**
     * 停止心跳檢測
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * 向所有連線發送心跳
     */
    sendHeartbeatToAll() {
        const connectedPeers = Array.from(this.dataChannels.entries())
            .filter(([_, channel]) => channel.readyState === 'open')
            .map(([peerId, _]) => peerId);

        connectedPeers.forEach(peerId => {
            try {
                this.sendMessage(peerId, 'HEARTBEAT', {});
            } catch (error) {
                console.error(`發送心跳失敗 (${peerId}):`, error);
            }
        });
    }

    // ==================== 遊戲訊息處理器 ====================

    /**
     * 處理建立房間訊息 (主持人端)
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleCreateRoom(message, senderId) {
        console.log('處理建立房間請求:', message);
        
        // 主持人建立房間邏輯
        if (this.isHost) {
            try {
                const roomCode = message.data.roomCode || window.generateRoomCode();
                const gameRoom = new window.GameRoom(roomCode);
                
                // 儲存房間資料
                window.storageManager.saveGameRoom(gameRoom);
                
                // 回覆房間建立成功
                this.sendMessage(senderId, 'ROOM_CREATED', {
                    roomCode: roomCode,
                    gameRoom: gameRoom.toJSON()
                });
                
                console.log(`房間 ${roomCode} 建立成功`);
                
            } catch (error) {
                console.error('建立房間失敗:', error);
                this.sendError(senderId, 'ROOM_CREATION_FAILED', error.message);
            }
        }
    }

    /**
     * 處理加入房間訊息 (參賽者端)
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleJoinRoom(message, senderId) {
        console.log('處理加入房間請求:', message);
        
        if (this.isHost) {
            try {
                const { roomCode, nickname } = message.data;
                
                // 載入當前房間
                const gameRoom = window.GameRoom.fromJSON(window.storageManager.loadGameRoom());
                if (!gameRoom || gameRoom.roomCode !== roomCode) {
                    throw new Error('房間不存在或代碼錯誤');
                }
                
                // 檢查房間狀態
                if (gameRoom.gameState !== window.GameState.WAITING) {
                    throw new Error('遊戲已開始，無法加入');
                }
                
                // 載入現有參賽者
                const players = window.storageManager.loadPlayers();
                
                // 檢查人數限制
                if (players.length >= gameRoom.maxPlayers) {
                    this.sendMessage(senderId, 'ROOM_FULL', {
                        message: '遊戲人數已滿'
                    });
                    return;
                }
                
                // 檢查暱稱是否重複
                const nicknameExists = players.some(player => player.nickname === nickname);
                if (nicknameExists) {
                    this.sendMessage(senderId, 'NICKNAME_TAKEN', {
                        message: '暱稱已被使用，請選擇其他暱稱'
                    });
                    return;
                }
                
                // 建立新參賽者
                const player = new window.Player(nickname, roomCode, senderId);
                player.position = players.length + 1;
                
                // 加入參賽者列表
                players.push(player);
                window.storageManager.savePlayers(players);
                
                // 通知參賽者加入成功
                this.sendMessage(senderId, 'PLAYER_JOINED', {
                    player: player.toJSON(),
                    gameRoom: gameRoom.toJSON(),
                    playerCount: players.length
                });
                
                // 廣播給其他參賽者
                this.broadcastMessage('PLAYER_LIST_UPDATED', {
                    players: players.map(p => p.toJSON()),
                    playerCount: players.length
                });
                
                console.log(`參賽者 ${nickname} 加入房間 ${roomCode}`);
                
            } catch (error) {
                console.error('加入房間失敗:', error);
                this.sendError(senderId, 'JOIN_ROOM_FAILED', error.message);
            }
        }
    }

    /**
     * 處理房間建立成功回應
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleRoomCreated(message, senderId) {
        console.log('房間建立成功:', message);
        
        // 觸發 UI 更新事件
        window.dispatchEvent(new CustomEvent('roomCreated', {
            detail: message.data
        }));
    }

    /**
     * 處理參賽者加入成功回應
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handlePlayerJoined(message, senderId) {
        console.log('參賽者加入成功:', message);
        
        // 觸發 UI 更新事件
        window.dispatchEvent(new CustomEvent('playerJoined', {
            detail: message.data
        }));
    }

    /**
     * 處理參賽者離開
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handlePlayerLeft(message, senderId) {
        console.log('參賽者離開:', message);
        
        // 觸發 UI 更新事件
        window.dispatchEvent(new CustomEvent('playerLeft', {
            detail: message.data
        }));
    }

    /**
     * 處理房間已滿
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleRoomFull(message, senderId) {
        console.log('房間已滿:', message);
        
        // 顯示錯誤訊息
        if (window.uiController) {
            window.uiController.showError(message.data.message);
        }
    }

    /**
     * 處理暱稱已被使用
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleNicknameTaken(message, senderId) {
        console.log('暱稱已被使用:', message);
        
        // 顯示錯誤訊息
        if (window.uiController) {
            window.uiController.showError(message.data.message);
        }
    }

    // ==================== 抽籤訊息處理器 ====================

    /**
     * 處理開始抽籤訊息
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleStartLottery(message, senderId) {
        console.log('處理開始抽籤請求:', message);
        
        if (this.isHost) {
            try {
                // 載入遊戲狀態
                const gameRoom = window.GameRoom.fromJSON(window.storageManager.loadGameRoom());
                if (!gameRoom) {
                    throw new Error('遊戲房間不存在');
                }
                
                // 檢查遊戲狀態
                if (gameRoom.gameState !== window.GameState.WAITING && 
                    gameRoom.gameState !== window.GameState.ROUND_COMPLETE) {
                    throw new Error('當前無法開始抽籤');
                }
                
                // 轉換遊戲狀態
                gameRoom.transitionTo(window.GameState.LOTTERY_IN_PROGRESS);
                window.storageManager.saveGameRoom(gameRoom);
                
                // 廣播抽籤開始訊息
                this.broadcastMessage('LOTTERY_STARTED', {
                    roundNumber: gameRoom.currentRound,
                    gameState: gameRoom.gameState
                });
                
                console.log(`第 ${gameRoom.currentRound} 輪抽籤已開始`);
                
            } catch (error) {
                console.error('開始抽籤失敗:', error);
                this.sendError(senderId, 'START_LOTTERY_FAILED', error.message);
            }
        }
    }

    /**
     * 處理抽數字訊息
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleDrawNumber(message, senderId) {
        console.log('處理抽數字請求:', message);
        
        if (this.isHost) {
            try {
                const { playerId } = message.data;
                
                // 載入遊戲狀態
                const gameRoom = window.GameRoom.fromJSON(window.storageManager.loadGameRoom());
                if (!gameRoom || gameRoom.gameState !== window.GameState.LOTTERY_IN_PROGRESS) {
                    throw new Error('當前無法抽取數字');
                }
                
                // 載入參賽者
                const players = window.storageManager.loadPlayers();
                const player = players.find(p => p.playerId === playerId);
                if (!player) {
                    throw new Error('參賽者不存在');
                }
                
                // 檢查是否已經抽過
                if (player.drawnNumbers && player.drawnNumbers[gameRoom.currentRound - 1] !== undefined) {
                    throw new Error('您已經抽過數字了');
                }
                
                // 生成隨機數字
                const drawnNumber = window.generateRandomNumber();
                
                // 更新參賽者數據
                if (!player.drawnNumbers) {
                    player.drawnNumbers = [];
                }
                player.drawnNumbers[gameRoom.currentRound - 1] = drawnNumber;
                
                // 儲存更新
                window.storageManager.savePlayers(players);
                
                // 回覆參賽者
                this.sendMessage(senderId, 'NUMBER_DRAWN', {
                    playerId: playerId,
                    drawnNumber: drawnNumber,
                    roundNumber: gameRoom.currentRound
                });
                
                // 廣播給所有人（含主持人）
                this.broadcastMessage('PLAYER_NUMBER_DRAWN', {
                    playerId: playerId,
                    playerNickname: player.nickname,
                    drawnNumber: drawnNumber,
                    roundNumber: gameRoom.currentRound
                });
                
                console.log(`參賽者 ${player.nickname} 抽中數字: ${drawnNumber}`);
                
            } catch (error) {
                console.error('抽數字失敗:', error);
                this.sendError(senderId, 'DRAW_NUMBER_FAILED', error.message);
            }
        }
    }

    /**
     * 處理設定目標數字訊息
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleSetTargetNumber(message, senderId) {
        console.log('處理設定目標數字請求:', message);
        
        if (this.isHost) {
            try {
                const { targetNumber } = message.data;
                
                // 驗證目標數字
                if (targetNumber < 0 || targetNumber > 100 || !Number.isInteger(targetNumber)) {
                    throw new Error('目標數字必須是0-100之間的整數');
                }
                
                // 載入遊戲狀態
                const gameRoom = window.GameRoom.fromJSON(window.storageManager.loadGameRoom());
                if (!gameRoom || gameRoom.gameState !== window.GameState.LOTTERY_IN_PROGRESS) {
                    throw new Error('當前無法設定目標數字');
                }
                
                // 設定目標數字並轉換狀態
                gameRoom.hostTargetNumber = targetNumber;
                gameRoom.transitionTo(window.GameState.SCORING);
                
                // 計算本輪得分
                const players = window.storageManager.loadPlayers();
                const roundScores = this.calculateRoundScores(players, targetNumber, gameRoom.currentRound);
                
                // 儲存更新
                window.storageManager.saveGameRoom(gameRoom);
                window.storageManager.savePlayers(players);
                
                // 廣播目標數字和得分
                this.broadcastMessage('TARGET_SET', {
                    targetNumber: targetNumber,
                    roundNumber: gameRoom.currentRound,
                    roundScores: roundScores,
                    gameState: gameRoom.gameState
                });
                
                console.log(`目標數字已設定: ${targetNumber}，本輪得分計算完成`);
                
            } catch (error) {
                console.error('設定目標數字失敗:', error);
                this.sendError(senderId, 'SET_TARGET_FAILED', error.message);
            }
        }
    }

    /**
     * 計算本輪得分
     * @param {Array} players - 參賽者陣列
     * @param {number} targetNumber - 目標數字
     * @param {number} roundNumber - 輪次
     * @returns {Array} 本輪得分陣列
     */
    calculateRoundScores(players, targetNumber, roundNumber) {
        const roundScores = [];
        
        players.forEach(player => {
            if (player.drawnNumbers && player.drawnNumbers[roundNumber - 1] !== undefined) {
                const drawnNumber = player.drawnNumbers[roundNumber - 1];
                const score = drawnNumber - targetNumber;
                
                // 更新參賽者得分
                if (!player.roundScores) {
                    player.roundScores = [];
                }
                player.roundScores[roundNumber - 1] = score;
                
                // 更新總得分
                player.totalScore = (player.roundScores || []).reduce((sum, s) => sum + (s || 0), 0);
                
                roundScores.push({
                    playerId: player.playerId,
                    nickname: player.nickname,
                    drawnNumber: drawnNumber,
                    score: score
                });
            }
        });
        
        return roundScores;
    }

    /**
     * 處理抽籤開始回應
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleLotteryStarted(message, senderId) {
        console.log('抽籤已開始:', message);
        
        // 觸發 UI 更新事件
        window.dispatchEvent(new CustomEvent('lotteryStarted', {
            detail: message.data
        }));
    }

    /**
     * 處理數字抽中回應
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleNumberDrawn(message, senderId) {
        console.log('數字已抽中:', message);
        
        // 觸發 UI 更新事件
        window.dispatchEvent(new CustomEvent('numberDrawn', {
            detail: message.data
        }));
    }

    /**
     * 處理目標數字設定回應
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleTargetSet(message, senderId) {
        console.log('目標數字已設定:', message);
        
        // 觸發 UI 更新事件
        window.dispatchEvent(new CustomEvent('targetSet', {
            detail: message.data
        }));
    }

    /**
     * 處理本輪完成回應
     * @param {Object} message - 訊息對象
     * @param {string} senderId - 發送者ID
     */
    handleRoundComplete(message, senderId) {
        console.log('本輪已完成:', message);
        
        // 觸發 UI 更新事件
        window.dispatchEvent(new CustomEvent('roundComplete', {
            detail: message.data
        }));
    }

    /**
     * 處理開始下一輪消息
     * @param {Object} message - 消息對象
     * @param {string} senderId - 發送者ID
     */
    handleStartNextRound(message, senderId) {
        console.log('收到開始下一輪消息:', message.data);
        
        try {
            const gameRoom = window.storageManager.loadGameRoom();
            if (!gameRoom) {
                throw new Error('找不到遊戲房間');
            }

            // 更新遊戲狀態為下一輪
            if (gameRoom.currentRound >= 5) {
                throw new Error('遊戲已完成所有輪次');
            }

            gameRoom.currentRound += 1;
            gameRoom.gameState = window.GameState.WAITING;
            gameRoom.hostTargetNumber = null;

            // 重置參賽者當前輪數字
            const players = window.storageManager.loadPlayers() || [];
            players.forEach(player => {
                // 保留歷史數據，但重置當前輪狀態
                if (!player.drawnNumbers) player.drawnNumbers = [];
                if (!player.roundScores) player.roundScores = [];
                // 不重置已抽的數字和得分，只是準備新輪
            });

            // 儲存更新的狀態
            window.storageManager.saveGameRoom(gameRoom);
            window.storageManager.savePlayers(players);

            // 廣播房間狀態更新
            this.broadcastMessage('ROOM_STATE_UPDATE', {
                roomCode: gameRoom.roomCode,
                gameState: gameRoom.gameState,
                currentRound: gameRoom.currentRound,
                players: players.map(p => ({
                    playerId: p.playerId,
                    nickname: p.nickname,
                    position: p.position,
                    connectionStatus: p.connectionStatus,
                    totalScore: p.totalScore || 0
                })),
                hostTargetNumber: null
            });

            // 廣播下一輪開始事件
            window.dispatchEvent(new CustomEvent('nextRoundStarted', {
                detail: {
                    roundNumber: gameRoom.currentRound,
                    gameState: gameRoom.gameState,
                    players: players
                }
            }));

            console.log(`第 ${gameRoom.currentRound} 輪準備開始`);

        } catch (error) {
            console.error('處理開始下一輪消息失敗:', error);
            
            // 發送錯誤消息
            this.sendMessage(senderId, 'ERROR', {
                errorCode: 'NEXT_ROUND_FAILED',
                message: error.message,
                details: { originalMessage: message }
            });
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 獲取連線狀態
     * @param {string} peerId - 對等端ID
     * @returns {string} 連線狀態
     */
    getConnectionStatus(peerId) {
        return this.connectionStatus.get(peerId) || 'disconnected';
    }

    /**
     * 獲取所有連線狀態
     * @returns {Object} 所有連線狀態
     */
    getAllConnectionStatus() {
        const status = {};
        this.connectionStatus.forEach((status_value, peerId) => {
            status[peerId] = status_value;
        });
        return status;
    }

    /**
     * 檢查是否有活躍連線
     * @returns {boolean} 是否有活躍連線
     */
    hasActiveConnections() {
        return Array.from(this.connectionStatus.values())
            .some(status => status === 'open' || status === 'connected');
    }

    /**
     * 清理所有連線
     */
    cleanup() {
        console.log('清理所有 WebRTC 連線');
        
        this.stopHeartbeat();
        
        // 關閉所有連線
        Array.from(this.peers.keys()).forEach(peerId => {
            this.closePeerConnection(peerId);
        });

        // 清空所有集合
        this.peers.clear();
        this.dataChannels.clear();
        this.connectionStatus.clear();
    }

    // ==================== Phase 6: 遊戲狀態管理 ====================

    /**
     * 處理獲取遊戲狀態請求 (T047)
     */
    handleGetGameState(message, senderId) {
        try {
            if (!this.isHost) {
                console.warn('非主持人無法處理遊戲狀態請求');
                return;
            }

            // 收集完整遊戲狀態
            const gameState = {
                roomCode: window.gameEngine?.currentGame?.roomCode || null,
                gameStatus: window.gameEngine?.currentGame?.state || 'WAITING',
                currentRound: window.gameEngine?.currentGame?.currentRound || 1,
                totalRounds: window.gameEngine?.currentGame?.totalRounds || 5,
                players: window.gameEngine?.currentGame?.players || [],
                scores: window.gameEngine?.currentGame?.scores || {},
                connectionStatus: this.getAllConnectionStatus(),
                gameStartTime: window.gameEngine?.currentGame?.startTime || null,
                lastActivity: Date.now(),
                statistics: {
                    totalDraws: window.gameEngine?.getTotalDraws() || 0,
                    averageResponseTime: this.getAverageResponseTime(),
                    connectionQuality: this.getConnectionQualityReport()
                }
            };

            // 回傳遊戲狀態
            this.sendMessage(senderId, 'GAME_STATE_RESPONSE', {
                gameState: gameState,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('處理遊戲狀態請求失敗:', error);
            this.sendMessage(senderId, 'ERROR', {
                errorCode: 'GET_GAME_STATE_FAILED',
                message: error.message
            });
        }
    }

    /**
     * 處理遊戲狀態回應
     */
    handleGameStateResponse(message, senderId) {
        try {
            const { gameState } = message.data;
            
            // 觸發遊戲狀態更新事件
            window.dispatchEvent(new CustomEvent('gameStateUpdated', {
                detail: {
                    gameState: gameState,
                    from: senderId
                }
            }));

        } catch (error) {
            console.error('處理遊戲狀態回應失敗:', error);
        }
    }

    /**
     * 處理重置遊戲請求 (T049)
     */
    handleResetGame(message, senderId) {
        try {
            if (!this.isHost) {
                console.warn('非主持人無法重置遊戲');
                return;
            }

            console.log('接收到重置遊戲請求');

            // 通知所有玩家遊戲即將重置
            this.broadcastMessage('GAME_RESET', {
                resetBy: senderId,
                timestamp: Date.now(),
                reason: message.data.reason || 'host_initiated'
            });

            // 重置遊戲引擎狀態
            if (window.gameEngine) {
                window.gameEngine.resetGame();
            }

            // 重置連線品質統計
            if (this.connectionQuality) {
                this.connectionQuality.clear();
            }

            console.log('遊戲重置完成');

        } catch (error) {
            console.error('重置遊戲失敗:', error);
            this.sendMessage(senderId, 'ERROR', {
                errorCode: 'RESET_GAME_FAILED',
                message: error.message
            });
        }
    }

    /**
     * 處理遊戲重置通知
     */
    handleGameReset(message, senderId) {
        try {
            console.log('收到遊戲重置通知:', message.data);

            // 觸發遊戲重置事件
            window.dispatchEvent(new CustomEvent('gameReset', {
                detail: {
                    resetBy: message.data.resetBy,
                    reason: message.data.reason,
                    timestamp: message.data.timestamp
                }
            }));

            // 如果是玩家，重置本地狀態
            if (!this.isHost && window.gameEngine) {
                window.gameEngine.resetGame();
            }

        } catch (error) {
            console.error('處理遊戲重置通知失敗:', error);
        }
    }

    /**
     * 處理玩家斷線檢測 (T050)
     */
    handlePlayerDisconnected(message, senderId) {
        try {
            const { playerId, reason } = message.data;
            
            console.log(`玩家 ${playerId} 已斷線: ${reason}`);

            // 更新連線狀態
            this.connectionStatus.set(playerId, 'disconnected');

            // 觸發玩家斷線事件
            window.dispatchEvent(new CustomEvent('playerDisconnected', {
                detail: {
                    playerId: playerId,
                    reason: reason,
                    timestamp: Date.now()
                }
            }));

            // 如果是主持人，廣播斷線狀態
            if (this.isHost) {
                this.broadcastMessage('CONNECTION_STATUS_UPDATE', {
                    playerId: playerId,
                    status: 'disconnected',
                    reason: reason,
                    timestamp: Date.now()
                });
            }

        } catch (error) {
            console.error('處理玩家斷線失敗:', error);
        }
    }

    /**
     * 處理玩家重新連線 (T051)
     */
    handlePlayerReconnected(message, senderId) {
        try {
            const { playerId } = message.data;
            
            console.log(`玩家 ${playerId} 已重新連線`);

            // 更新連線狀態
            this.connectionStatus.set(playerId, 'connected');

            // 觸發玩家重新連線事件
            window.dispatchEvent(new CustomEvent('playerReconnected', {
                detail: {
                    playerId: playerId,
                    timestamp: Date.now()
                }
            }));

            // 如果是主持人，同步最新遊戲狀態
            if (this.isHost && window.gameEngine) {
                this.syncGameStateToPlayer(playerId);
            }

            // 廣播重新連線狀態
            if (this.isHost) {
                this.broadcastMessage('CONNECTION_STATUS_UPDATE', {
                    playerId: playerId,
                    status: 'connected',
                    timestamp: Date.now()
                });
            }

        } catch (error) {
            console.error('處理玩家重新連線失敗:', error);
        }
    }

    /**
     * 處理重新連線請求
     */
    handleReconnect(message, senderId) {
        try {
            console.log(`處理重新連線請求來自 ${senderId}`);

            // 更新連線狀態
            this.connectionStatus.set(senderId, 'connected');

            // 如果是主持人，同步遊戲狀態
            if (this.isHost) {
                this.syncGameStateToPlayer(senderId);
            }

            // 回應重新連線成功
            this.sendMessage(senderId, 'PLAYER_RECONNECTED', {
                playerId: senderId,
                syncComplete: true,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('處理重新連線請求失敗:', error);
        }
    }

    /**
     * 處理連線狀態更新
     */
    handleConnectionStatusUpdate(message, senderId) {
        try {
            const { playerId, status, timestamp } = message.data;
            
            // 更新本地連線狀態記錄
            this.connectionStatus.set(playerId, status);

            // 觸發連線狀態更新事件
            window.dispatchEvent(new CustomEvent('connectionStatusUpdated', {
                detail: {
                    playerId: playerId,
                    status: status,
                    timestamp: timestamp,
                    from: senderId
                }
            }));

        } catch (error) {
            console.error('處理連線狀態更新失敗:', error);
        }
    }

    /**
     * 同步遊戲狀態給指定玩家
     */
    syncGameStateToPlayer(playerId) {
        try {
            if (!this.isHost || !window.gameEngine) {
                return;
            }

            const gameState = window.gameEngine.getCurrentGameState();
            this.sendMessage(playerId, 'GAME_STATE_SYNC', {
                gameState: gameState,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('同步遊戲狀態失敗:', error);
        }
    }

    /**
     * 獲取平均回應時間
     */
    getAverageResponseTime() {
        if (!this.connectionQuality || this.connectionQuality.size === 0) {
            return 0;
        }

        let totalLatency = 0;
        let sampleCount = 0;

        this.connectionQuality.forEach(quality => {
            if (quality.averageLatency > 0) {
                totalLatency += quality.averageLatency;
                sampleCount++;
            }
        });

        return sampleCount > 0 ? Math.round(totalLatency / sampleCount) : 0;
    }

    /**
     * 獲取連線品質報告
     */
    getConnectionQualityReport() {
        const report = {};
        
        if (this.connectionQuality) {
            this.connectionQuality.forEach((quality, peerId) => {
                report[peerId] = {
                    quality: quality.quality,
                    latency: quality.averageLatency,
                    samples: quality.samples.length
                };
            });
        }

        return report;
    }

    /**
     * 檢測離線玩家
     */
    detectOfflinePlayers() {
        const offlinePlayers = [];
        
        this.connectionStatus.forEach((status, playerId) => {
            if (status === 'disconnected' || status === 'failed') {
                offlinePlayers.push(playerId);
            }
        });

        return offlinePlayers;
    }

    /**
     * 請求遊戲狀態 (供外部調用)
     */
    requestGameState() {
        if (this.isHost) {
            // 主持人直接觸發狀態更新
            this.handleGetGameState({ data: {} }, this.hostId);
        } else {
            // 玩家請求主持人的遊戲狀態
            this.sendToHost('GET_GAME_STATE', {
                requesterId: this.myPlayerId,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 重置遊戲 (供外部調用)
     */
    resetGame(reason = 'manual') {
        if (!this.isHost) {
            console.warn('只有主持人可以重置遊戲');
            return false;
        }

        this.handleResetGame({
            data: { reason: reason }
        }, this.hostId);

        return true;
    }
}

// 創建全域實例
const webrtcManager = new WebRTCManager();

// 匯出供其他模組使用
window.WebRTCManager = WebRTCManager;
window.webrtcManager = webrtcManager;

// 初始化連線管理增強
webrtcManager.enhanceConnectionManagement = function() {
    // 連線品質監控
    this.connectionQuality = new Map(); // peerId -> quality metrics
    
    // 重新定義心跳處理以包含品質監控
    const originalHandleHeartbeatAck = this.handleHeartbeatAck;
    this.handleHeartbeatAck = (message, senderId) => {
        const latency = message.data.latency;
        
        // 更新連線品質統計
        if (!this.connectionQuality.has(senderId)) {
            this.connectionQuality.set(senderId, {
                samples: [],
                averageLatency: 0,
                quality: 'unknown'
            });
        }
        
        const quality = this.connectionQuality.get(senderId);
        quality.samples.push(latency);
        
        // 保留最近 10 個樣本
        if (quality.samples.length > 10) {
            quality.samples.shift();
        }
        
        // 計算平均延遲
        quality.averageLatency = quality.samples.reduce((sum, lat) => sum + lat, 0) / quality.samples.length;
        
        // 評估連線品質
        if (quality.averageLatency < 100) {
            quality.quality = 'excellent';
        } else if (quality.averageLatency < 300) {
            quality.quality = 'good';
        } else if (quality.averageLatency < 500) {
            quality.quality = 'fair';
        } else {
            quality.quality = 'poor';
        }
        
        console.log(`連線品質 (${senderId}): ${quality.quality} (${Math.round(quality.averageLatency)}ms)`);
        
        // 觸發連線品質事件
        window.dispatchEvent(new CustomEvent('connectionQualityUpdate', {
            detail: { 
                peerId: senderId, 
                quality: quality.quality, 
                latency: quality.averageLatency 
            }
        }));
        
        return originalHandleHeartbeatAck.call(this, message, senderId);
    };
    
    console.log('連線狀態管理增強完成');
};
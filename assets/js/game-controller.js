/**
 * 數字抽籤遊戲 - 主遊戲控制器
 * 協調 UI、遊戲引擎、WebRTC 和存儲系統
 */

class GameController {
    constructor() {
        this.isHost = false;
        this.currentRole = null;
        this.isInitialized = false;
    }

    /**
     * 初始化遊戲控制器
     */
    init() {
        if (this.isInitialized) return;

        console.log('初始化遊戲控制器');
        
        this.setupEventListeners();
        this.setupGameEventListeners();
        
        this.isInitialized = true;
        console.log('遊戲控制器初始化完成');
    }

    /**
     * 設定 UI 事件監聽器
     */
    setupEventListeners() {
        // 角色選擇事件
        window.addEventListener('roleSelected', (event) => {
            this.handleRoleSelection(event.detail.role);
        });

        // 建立房間按鈕
        const createRoomBtn = document.getElementById('create-room-btn');
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => {
                this.createGameRoom();
            });
        }

        // 加入房間表單
        const joinRoomForm = document.getElementById('join-room-form');
        if (joinRoomForm) {
            joinRoomForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.joinGameRoom();
            });
        }

        // 開始遊戲按鈕
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.startGame();
            });
        }

        // 開始抽籤按鈕
        const startLotteryBtn = document.getElementById('start-lottery-btn');
        if (startLotteryBtn) {
            startLotteryBtn.addEventListener('click', () => {
                this.startLottery();
            });
        }

        // 抽數字按鈕
        const drawNumberBtn = document.getElementById('draw-number-btn');
        if (drawNumberBtn) {
            drawNumberBtn.addEventListener('click', () => {
                this.drawNumber();
            });
        }

        // 設定目標數字按鈕
        const setTargetBtn = document.getElementById('set-target-btn');
        if (setTargetBtn) {
            setTargetBtn.addEventListener('click', () => {
                this.setTargetNumber();
            });
        }

        // 下一輪按鈕
        const nextRoundBtn = document.getElementById('next-round-btn');
        if (nextRoundBtn) {
            nextRoundBtn.addEventListener('click', () => {
                this.nextRound();
            });
        }

        // 重置遊戲按鈕
        const resetGameBtn = document.getElementById('reset-game-btn');
        if (resetGameBtn) {
            resetGameBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }

        // 離開房間按鈕
        const leaveRoomBtn = document.getElementById('leave-room-btn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => {
                this.leaveRoom();
            });
        }

        // 即時輸入驗證
        const roomCodeInput = document.getElementById('room-code-input');
        if (roomCodeInput) {
            roomCodeInput.addEventListener('input', (event) => {
                this.validateRoomCodeInput(event.target);
            });
        }

        const nicknameInput = document.getElementById('nickname-input');
        if (nicknameInput) {
            nicknameInput.addEventListener('input', (event) => {
                this.validateNicknameInput(event.target);
            });
        }
    }

    /**
     * 設定遊戲事件監聽器
     */
    setupGameEventListeners() {
        // WebRTC 連線事件
        window.addEventListener('peerConnected', (event) => {
            console.log('對等端連接:', event.detail.peerId);
        });

        window.addEventListener('peerDisconnected', (event) => {
            console.log('對等端斷線:', event.detail.peerId);
            this.handlePeerDisconnected(event.detail.peerId);
        });

        // 遊戲狀態事件
        window.addEventListener('roomCreated', (event) => {
            this.handleRoomCreated(event.detail);
        });

        window.addEventListener('playerJoined', (event) => {
            this.handlePlayerJoined(event.detail);
        });

        // WebRTC 連接建立事件 (主持人專用)
        window.addEventListener('playerConnected', (event) => {
            this.handlePlayerConnected(event.detail);
        });

        // WebRTC 玩家加入請求事件 (主持人專用)
        window.addEventListener('playerJoinRequest', (event) => {
            this.handlePlayerJoinRequest(event.detail);
        });

        // WebRTC 加入回應事件 (參賽者專用)
        window.addEventListener('joinResponse', (event) => {
            this.handleJoinResponse(event.detail);
        });

        window.addEventListener('playerLeft', (event) => {
            this.handlePlayerLeft(event.detail);
        });

        // 抽籤相關事件
        window.addEventListener('lotteryStarted', (event) => {
            this.handleLotteryStarted(event.detail);
        });

        window.addEventListener('numberDrawn', (event) => {
            this.handleNumberDrawn(event.detail);
        });

        window.addEventListener('drawNumberRequest', (event) => {
            this.handleDrawNumberRequest(event.detail);
        });

        window.addEventListener('targetSet', (event) => {
            this.handleTargetSet(event.detail);
        });

        window.addEventListener('roundComplete', (event) => {
            this.handleRoundComplete(event.detail);
        });
    }

    // ==================== 角色管理 ====================

    /**
     * 處理角色選擇
     * @param {string} role - 選擇的角色
     */
    async handleRoleSelection(role) {
        console.log(`選擇角色: ${role}`);
        console.log(`之前的狀態 - isHost: ${this.isHost}, currentRole: ${this.currentRole}`);
        
        // 清理之前的狀態
        this.currentRole = role;
        this.isHost = (role === 'host');
        this.currentPlayerId = undefined;
        this.currentNickname = undefined;

        console.log(`新的狀態 - isHost: ${this.isHost}, currentRole: ${this.currentRole}`);

        if (this.isHost) {
            // 主持人：嘗試恢復之前的遊戲狀態
            await this.restoreGameState();
        } else {
            // 參賽者ID將在加入房間時設定
            console.log('設定為參賽者模式，等待加入房間');
        }
    }

    /**
     * 恢復遊戲狀態
     */
    async restoreGameState() {
        try {
            if (this.isHost) {
                // 恢復主持人的遊戲狀態
                const gameRoomData = window.storageManager.loadGameRoom();
                if (gameRoomData) {
                    const gameRoom = window.GameRoom.fromJSON(gameRoomData);
                    const players = window.storageManager.loadPlayers() || [];
                    
                    console.log('恢復遊戲狀態:', { gameRoom, players });
                    
                    // 確保 WebRTC 管理器已設定為主持人模式
                    const hostPeerId = await window.webRTCManager.setupAsHost();
                    console.log(`恢復主持人 Peer ID: ${hostPeerId}`);
                    
                    // 設定房間代碼到 WebRTC 管理器
                    window.webRTCManager.roomCode = gameRoom.roomCode;
                    
                    // 更新遊戲管理器
                    window.gameManager.gameRoom = gameRoom;
                    window.gameManager.players = players.map(p => window.Player.fromJSON(p));
                    
                    console.log(`恢復了 ${window.gameManager.players.length} 名參賽者:`, window.gameManager.players.map(p => ({ playerId: p.playerId, nickname: p.nickname })));
                    
                    // 更新 UI - 顯示房間資訊和參賽者列表
                    window.uiController.displayRoomInfo(gameRoom.roomCode, gameRoom);
                    window.uiController.displayPlayersList(window.gameManager.players);
                    
                    // 重新顯示連接資訊和 QR Code
                    console.log('重新顯示參賽者連接資訊');
                    const connectionInfo = window.webRTCManager.getRoomConnectionInfo();
                    if (connectionInfo) {
                        console.log('恢復房間連接資訊:', connectionInfo);
                        window.uiController.displayHostPeerId(hostPeerId);
                    } else {
                        // 即使在 fallback 模式也要顯示連接資訊
                        console.log('顯示 fallback 模式連接資訊');
                        window.uiController.displayHostPeerId(hostPeerId || `fallback_${gameRoom.roomCode}`);
                    }
                    
                    // 如果有參賽者，顯示恢復成功訊息
                    if (window.gameManager.players.length > 0) {
                        window.uiController.showSuccess(`已恢復房間 ${gameRoom.roomCode}，包含 ${window.gameManager.players.length} 名參賽者`);
                    } else {
                        window.uiController.showInfo(`已恢復房間 ${gameRoom.roomCode}，等待參賽者加入`);
                    }
                }
            }
        } catch (error) {
            console.warn('恢復遊戲狀態失敗:', error);
        }
    }

    // ==================== 房間管理 ====================

    /**
     * 建立遊戲房間
     */
    async createGameRoom() {
        if (!this.isHost) {
            console.error('只有主持人可以建立房間');
            return;
        }

        try {
            console.log('建立遊戲房間...');
            
            // 讀取參賽者人數設定
            const maxPlayersInput = document.getElementById('max-players-input');
            const maxPlayers = maxPlayersInput ? parseInt(maxPlayersInput.value) || 6 : 6;
            console.log(`設定最大參賽者人數: ${maxPlayers}`);
            
            // 清除舊的主持人 Peer ID，確保新房間有新的連接 ID
            localStorage.removeItem('hostPeerId');
            
            // 確保 WebRTC 管理器已設定為主持人模式
            const hostPeerId = await window.webRTCManager.setupAsHost();
            console.log(`主持人 Peer ID: ${hostPeerId}`);
            
            // 建立新房間，傳入最大參賽者人數
            const gameRoom = window.gameManager.createGameRoom(null, maxPlayers);
            
            // 設定房間代碼到 WebRTC 管理器
            window.webRTCManager.roomCode = gameRoom.roomCode;
            
            // 儲存房間資料
            window.storageManager.saveGameRoom(gameRoom);
            window.storageManager.savePlayers([]); // 清空參賽者列表
            
            // 更新 UI
            window.uiController.displayRoomInfo(gameRoom.roomCode, gameRoom);
            window.uiController.displayPlayersList([]);
            
            // 顯示連接資訊（如果有真實 WebRTC 連接）
            const connectionInfo = window.webRTCManager.getRoomConnectionInfo();
            if (connectionInfo) {
                console.log('房間連接資訊:', connectionInfo);
                // 顯示主持人 Peer ID 供參賽者連接
                window.uiController.displayHostPeerId(hostPeerId);
            }
            
            // 顯示成功訊息
            window.uiController.showSuccess(`遊戲房間 ${gameRoom.roomCode} 建立成功！`);
            
            console.log(`遊戲房間 ${gameRoom.roomCode} 建立完成`);
            
        } catch (error) {
            console.error('建立房間失敗:', error);
            window.uiController.showError('建立房間失敗: ' + error.message);
        }
    }

    /**
     * 加入遊戲房間
     */
    async joinGameRoom() {
        if (this.isHost) {
            console.error('主持人無法加入房間');
            return;
        }

        try {
            const roomCodeInput = document.getElementById('room-code-input');
            const nicknameInput = document.getElementById('nickname-input');

            if (!roomCodeInput || !nicknameInput) {
                throw new Error('找不到輸入欄位');
            }

            const roomCode = roomCodeInput.value.trim();
            const nickname = nicknameInput.value.trim();

            // 驗證輸入
            if (!window.GameRoom.isValidRoomCode(roomCode)) {
                throw new Error('房間代碼格式不正確 (需要4-6位數字)');
            }

            if (!nickname) {
                throw new Error('請輸入暱稱');
            }

            // 設定參賽者ID
            const playerId = window.generateUUID();
            await window.webRTCManager.setupAsPlayer(playerId);

            console.log(`嘗試加入房間 ${roomCode}，暱稱: ${nickname}`);

            // 檢查 URL 參數中是否有主持人 Peer ID
            const urlParams = new URLSearchParams(window.location.search);
            const hostPeerId = urlParams.get('join');
            
            if (hostPeerId && !window.webRTCManager.fallbackMode) {
                // 嘗試透過 WebRTC 連接到主持人
                console.log(`嘗試連接到主持人 Peer ID: ${hostPeerId}`);
                
                try {
                    await window.webRTCManager.connectToHost(hostPeerId);
                    console.log('成功連接到主持人');
                    
                    // 發送加入房間請求給主持人
                    window.webRTCManager.sendMessage({ 
                        type: 'joinRoom', 
                        data: { roomCode, nickname, playerId } 
                    }, hostPeerId); // 指定主持人作為目標
                    
                    window.uiController.showInfo('正在等待主持人確認...');
                    return; // 等待主持人回應
                    
                } catch (connectError) {
                    console.error('WebRTC 連接失敗:', connectError);
                    throw new Error('無法連接到主持人，請檢查房間代碼和網絡連接');
                }
            } else {
                // 沒有主持人 Peer ID
                throw new Error('未找到主持人連接資訊，請使用正確的連接連結');
            }

        } catch (error) {
            console.error('加入房間失敗:', error);
            window.uiController.showError('加入房間失敗: ' + error.message);
        }
    }

    /**
     * 模擬加入房間 (簡化版，實際應透過 WebRTC)
     * @param {string} roomCode - 房間代碼
     * @param {string} nickname - 暱稱
     * @param {string} playerId - 參賽者ID
     */
    simulateJoinRoom(roomCode, nickname, playerId) {
        try {
            console.log('嘗試模擬加入房間:', { roomCode, nickname, playerId });
            
            // 嘗試載入房間資料，如果失敗則創建臨時房間
            let gameRoom;
            let existingPlayers = [];
            
            try {
                const gameRoomData = window.storageManager.loadGameRoom();
                if (gameRoomData && gameRoomData.roomCode === roomCode) {
                    gameRoom = window.GameRoom.fromJSON(gameRoomData);
                    console.log('找到匹配的房間資料');
                } else {
                    throw new Error('房間資料不匹配');
                }
            } catch (error) {
                console.warn('無法載入房間資料，創建臨時房間:', error.message);
                gameRoom = new window.GameRoom(roomCode);
            }
            
            window.gameManager.gameRoom = gameRoom;

            // 嘗試載入現有參賽者，如果失敗則使用空列表
            try {
                existingPlayers = window.storageManager.loadPlayers();
                window.gameManager.players = existingPlayers.map(p => window.Player.fromJSON(p));
                console.log('載入現有參賽者:', existingPlayers.length);
            } catch (error) {
                console.warn('無法載入參賽者資料，使用空列表:', error.message);
                window.gameManager.players = [];
            }

            // 創建參賽者對象
            let player;
            try {
                // 嘗試透過 GameManager 加入
                player = window.gameManager.addPlayer(nickname, playerId);
                console.log('透過 GameManager 成功加入:', player);
            } catch (error) {
                // 如果 GameManager 加入失敗，創建基本的參賽者對象
                console.warn('GameManager 加入失敗，創建基本參賽者對象:', error.message);
                player = {
                    playerId: playerId,
                    nickname: nickname,
                    roomCode: roomCode,
                    currentNumber: null,
                    totalScore: 0,
                    drawnNumbers: [],
                    roundScores: [],
                    connectionStatus: 'offline'
                };
            }

            // 保存參賽者資訊
            this.currentPlayer = player;
            this.currentRoom = gameRoom;
            this.currentPlayerId = playerId;
            this.currentNickname = nickname;
            this.role = 'player';

            // 嘗試儲存資料（可能失敗，但不影響加入流程）
            try {
                window.storageManager.savePlayers(window.gameManager.getPlayersList());
            } catch (error) {
                console.warn('無法儲存參賽者資料:', error.message);
            }

            // 更新 UI - 使用與 handleJoinResponse 相同的流程
            console.log('模擬加入成功，更新 UI');
            window.uiController.showSuccess(`歡迎 ${nickname}！已加入房間 ${roomCode}（離線模式）`);
            window.uiController.showScreen('player-screen');
            window.uiController.updatePlayerInfo(player);

            console.log('模擬加入房間完成');

        } catch (error) {
            console.error('模擬加入房間失敗:', error);
            throw error;
        }
    }

    /**
     * 開始遊戲
     */
    startGame() {
        if (!this.isHost) {
            console.error('只有主持人可以開始遊戲');
            return;
        }

        try {
            if (!window.gameManager.canStartGame()) {
                throw new Error('無法開始遊戲：參賽者人數不足');
            }

            window.gameManager.startGame();

            // 儲存遊戲狀態
            window.storageManager.saveGameRoom(window.gameManager.gameRoom);

            // 更新 UI - 顯示抽籤控制介面
            window.uiController.showLotteryControl();

            window.uiController.showSuccess('遊戲已開始！可以開始第一輪抽籤');
            console.log('遊戲開始');

        } catch (error) {
            console.error('開始遊戲失敗:', error);
            window.uiController.showError('開始遊戲失敗: ' + error.message);
        }
    }

    /**
     * 開始抽籤 (主持人)
     */
    startLottery() {
        if (!this.isHost) {
            console.error('只有主持人可以開始抽籤');
            return;
        }

        try {
            console.log('開始抽籤...');
            
            // 開始抽籤
            window.gameManager.startLottery();
            
            // 儲存狀態
            window.storageManager.saveGameRoom(window.gameManager.gameRoom);

            // 更新 UI
            window.uiController.updateLotteryStatus('抽籤進行中', 0);
            
            // 廣播抽籤開始事件給所有參賽者
            const lotteryData = {
                roundNumber: window.gameManager.gameRoom.currentRound,
                gameState: window.gameManager.gameRoom.gameState,
                timestamp: Date.now()
            };
            
            // 觸發抽籤開始事件
            window.dispatchEvent(new CustomEvent('lotteryStarted', {
                detail: lotteryData
            }));
            
            // 透過 WebRTC 廣播給參賽者（如果有連接的話）
            if (window.webRTCManager) {
                window.webRTCManager.sendMessage({
                    type: 'lotteryStarted',
                    data: lotteryData
                });
            }

            window.uiController.showSuccess(`第 ${window.gameManager.gameRoom.currentRound} 輪抽籤已開始！`);
            console.log('抽籤開始成功');

        } catch (error) {
            console.error('開始抽籤失敗:', error);
            window.uiController.showError('開始抽籤失敗: ' + error.message);
        }
    }

    /**
     * 參賽者抽數字
     */
    drawNumber() {
        if (this.isHost) {
            console.error('主持人不能抽數字');
            return;
        }

        try {
            console.log('參賽者抽取數字...');
            
            // 參賽者透過 WebRTC 請求主持人幫忙抽取數字
            const drawRequest = {
                playerId: this.currentPlayerId,
                nickname: this.currentNickname,
                timestamp: Date.now()
            };
            
            console.log('發送抽取數字請求:', drawRequest);
            
            // 透過 WebRTC 發送抽取數字請求給主持人
            if (window.webRTCManager) {
                window.webRTCManager.sendMessage({
                    type: 'drawNumber',
                    data: drawRequest
                });
            } else {
                throw new Error('WebRTC 連接不可用');
            }

        } catch (error) {
            console.error('抽數字失敗:', error);
            window.uiController.showError('抽數字失敗: ' + error.message);
        }
    }

    /**
     * 設定目標數字 (主持人)
     */
    setTargetNumber() {
        if (!this.isHost) {
            console.error('只有主持人可以設定目標數字');
            return;
        }

        try {
            const targetNumberInput = document.getElementById('target-number-input');
            if (!targetNumberInput) {
                throw new Error('找不到目標數字輸入框');
            }

            const targetNumber = parseInt(targetNumberInput.value);
            
            // 設定目標數字並計算得分
            const roundResults = window.gameManager.setTargetNumber(targetNumber);
            
            // 完成本輪
            const roundSummary = window.gameManager.completeRound();
            
            // 儲存狀態
            window.storageManager.saveGameRoom(window.gameManager.gameRoom);
            window.storageManager.savePlayers(window.gameManager.getPlayersList());

            // 顯示結果
            window.uiController.displayRoundResults(roundSummary);

            window.uiController.showSuccess(`目標數字已設定為 ${targetNumber}，本輪計分完成！`);
            console.log(`目標數字設定: ${targetNumber}`);

        } catch (error) {
            console.error('設定目標數字失敗:', error);
            window.uiController.showError('設定目標數字失敗: ' + error.message);
        }
    }

    /**
     * 進行下一輪 (主持人)
     */
    nextRound() {
        if (!this.isHost) {
            console.error('只有主持人可以進行下一輪');
            return;
        }

        try {
            if (window.gameManager.gameRoom.gameState === window.GameState.GAME_FINISHED) {
                // 遊戲結束，顯示最終結果
                this.showFinalResults();
                return;
            }

            // 開始下一輪
            window.gameManager.startNextRound();
            
            // 儲存狀態
            window.storageManager.saveGameRoom(window.gameManager.gameRoom);

            // 廣播新輪次開始事件給所有參賽者
            const lotteryData = {
                roundNumber: window.gameManager.gameRoom.currentRound,
                gameState: window.gameManager.gameRoom.gameState,
                timestamp: Date.now()
            };
            
            // 觸發抽籤開始事件
            window.dispatchEvent(new CustomEvent('lotteryStarted', {
                detail: lotteryData
            }));
            
            // 透過 WebRTC 廣播給參賽者
            if (window.webRTCManager) {
                window.webRTCManager.sendMessage({
                    type: 'lotteryStarted',
                    data: lotteryData
                });
            }

            // 回到抽籤控制介面
            window.uiController.showLotteryControl();
            
            // 更新輪數顯示
            const currentRoundElement = document.getElementById('current-round');
            if (currentRoundElement) {
                currentRoundElement.textContent = `${window.gameManager.gameRoom.currentRound}/5`;
            }

            window.uiController.showSuccess(`第 ${window.gameManager.gameRoom.currentRound} 輪準備開始！`);
            console.log(`開始第 ${window.gameManager.gameRoom.currentRound} 輪`);

        } catch (error) {
            console.error('進行下一輪失敗:', error);
            window.uiController.showError('進行下一輪失敗: ' + error.message);
        }
    }

    /**
     * 顯示最終結果
     */
    showFinalResults() {
        try {
            const finalRanking = window.gameManager.calculateFinalRanking();
            const players = window.storageManager.loadPlayers() || [];
            
            // 計算遊戲統計
            const gameStats = this.calculateGameStatistics(finalRanking, players);
            
            // 顯示最終結果介面
            window.uiController.displayFinalResults({
                finalRanking: finalRanking,
                gameStats: gameStats
            });
            
            console.log('最終結果已顯示:', finalRanking);
            
            // 設置按鈕事件監聽器
            this.setupFinalResultsButtons();

        } catch (error) {
            console.error('顯示最終結果失敗:', error);
            window.uiController.showError('顯示最終結果失敗: ' + error.message);
        }
    }

    /**
     * 計算遊戲統計數據
     * @param {Array} finalRanking - 最終排名
     * @param {Array} players - 參賽者陣列
     * @returns {Object} 統計數據
     */
    calculateGameStatistics(finalRanking, players) {
        const totalScores = finalRanking.map(p => p.totalScore);
        
        return {
            totalRounds: 5,
            totalPlayers: finalRanking.length,
            highestScore: Math.max(...totalScores),
            lowestScore: Math.min(...totalScores),
            averageScore: totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length,
            gameDuration: '約 ' + Math.ceil((Date.now() - (window.gameManager.gameRoom?.createdAt?.getTime() || Date.now())) / 60000) + ' 分鐘'
        };
    }

    /**
     * 設置最終結果按鈕事件
     */
    setupFinalResultsButtons() {
        const restartBtn = document.getElementById('restart-game-btn');
        const exportBtn = document.getElementById('export-results-btn');
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (confirm('確定要重新開始遊戲嗎？這將清除所有數據。')) {
                    this.restartGame();
                }
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportResults();
            });
        }
    }

    /**
     * 重新開始遊戲
     */
    restartGame() {
        try {
            // 清除所有數據
            window.storageManager.clearGameData();
            
            // 重新載入頁面
            location.reload();
            
        } catch (error) {
            console.error('重新開始遊戲失敗:', error);
            window.uiController.showError('重新開始遊戲失敗: ' + error.message);
        }
    }

    /**
     * 匯出遊戲結果
     */
    exportResults() {
        try {
            const finalRanking = window.gameManager.calculateFinalRanking();
            
            // 生成 CSV 內容
            let csvContent = 'data:text/csv;charset=utf-8,';
            csvContent += '排名,暱稱,總分,第1輪,第2輪,第3輪,第4輪,第5輪\n';
            
            finalRanking.forEach(player => {
                const roundScoresStr = player.roundScores.map(score => score || 0).join(',');
                csvContent += `${player.rank},${player.nickname},${player.totalScore},${roundScoresStr}\n`;
            });
            
            // 下載檔案
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `數字抽籤遊戲結果_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.uiController.showSuccess('結果已匯出為 CSV 檔案');
            
        } catch (error) {
            console.error('匯出結果失敗:', error);
            window.uiController.showError('匯出結果失敗: ' + error.message);
        }
    }

    /**
     * 模擬抽籤廣播 (簡化版)
     */
    simulateLotteryBroadcast() {
        // 在實際版本中，這會透過 WebRTC 廣播給所有參賽者
        // 這裡模擬參賽者介面的更新
        
        // 如果當前是參賽者角色，啟用抽籤按鈕
        if (!this.isHost) {
            const playerData = {
                nickname: 'Test Player',
                roundNumber: window.gameManager.gameRoom.currentRound
            };
            
            window.uiController.showPlayerLottery(playerData);
            window.uiController.enableLotteryButton();
        }
    }

    // ==================== 事件處理 - 抽籤相關 ====================

    /**
     * 處理抽籤開始事件
     * @param {Object} data - 抽籤數據
     */
    handleLotteryStarted(data) {
        console.log('=== handleLotteryStarted 被調用 ===');
        console.log('事件數據:', data);
        console.log('當前角色 isHost:', this.isHost);
        console.log('當前玩家ID:', this.currentPlayerId);
        console.log('當前暱稱:', this.currentNickname);
        
        // 同步遊戲狀態到本地
        if (window.gameManager && window.gameManager.gameRoom) {
            console.log('更新本地遊戲狀態:', data.gameState);
            window.gameManager.gameRoom.gameState = data.gameState;
            window.gameManager.gameRoom.currentRound = data.roundNumber;
        }
        
        if (!this.isHost) {
            // 參賽者：顯示抽籤介面
            const playerData = {
                nickname: this.currentNickname || 'Player',
                playerId: this.currentPlayerId || 'unknown',
                roundNumber: data.roundNumber || window.gameManager?.gameRoom?.currentRound || 1
            };
            
            console.log('準備更新參賽者抽籤介面:', playerData);
            window.uiController.showPlayerLottery(playerData);
            window.uiController.enableLotteryButton();
            console.log('參賽者抽籤介面更新完成');
        } else {
            // 主持人：更新主持人介面狀態
            console.log('主持人收到抽籤開始事件，輪次:', data.roundNumber);
        }
    }

    /**
     * 處理抽取數字請求 (主持人端)
     * @param {Object} data - 抽取數字請求數據
     */
    handleDrawNumberRequest(data) {
        console.log('=== handleDrawNumberRequest 被調用 ===');
        console.log('請求數據:', data);
        
        if (!this.isHost) {
            console.log('只有主持人可以處理抽取數字請求');
            return;
        }
        
        try {
            console.log(`處理玩家 ${data.playerId} 的抽取數字請求`);
            
            // 在主持人端執行抽取數字
            const drawnNumber = window.gameManager.drawNumber(data.playerId);
            
            // 儲存狀態
            window.storageManager.savePlayers(window.gameManager.getPlayersList());
            
            // 準備回覆數據
            const responseData = {
                playerId: data.playerId,
                nickname: data.nickname,
                drawnNumber: drawnNumber,
                roundNumber: window.gameManager.gameRoom.currentRound,
                timestamp: Date.now()
            };
            
            console.log('抽數字成功，發送回覆:', responseData);
            
            // 廣播數字抽中事件給所有參賽者
            window.dispatchEvent(new CustomEvent('numberDrawn', {
                detail: responseData
            }));
            
            // 透過 WebRTC 廣播給所有參賽者
            if (window.webRTCManager) {
                window.webRTCManager.sendMessage({
                    type: 'numberDrawn',
                    data: responseData
                });
            }
            
        } catch (error) {
            console.error('處理抽取數字請求失敗:', error);
            
            // 發送錯誤回覆給請求者
            if (window.webRTCManager) {
                window.webRTCManager.sendMessage({
                    type: 'drawNumberError',
                    data: {
                        playerId: data.playerId,
                        error: error.message,
                        timestamp: Date.now()
                    }
                }, data.playerId);
            }
        }
    }

    /**
     * 處理數字抽中事件
     * @param {Object} data - 抽中數據
     */
    handleNumberDrawn(data) {
        console.log('數字抽中事件:', data);
        
        if (!this.isHost) {
            // 參賽者：只顯示自己抽中的數字
            if (data.playerId === this.currentPlayerId) {
                console.log(`我抽中了數字: ${data.drawnNumber}`);
                window.uiController.displayDrawnNumber(data.drawnNumber);
                window.uiController.showSuccess(`您抽中了數字: ${data.drawnNumber}`);
                
                // 禁用抽籤按鈕，防止重複抽取
                const drawBtn = document.getElementById('draw-number-btn');
                if (drawBtn) {
                    drawBtn.disabled = true;
                    drawBtn.textContent = '已抽取';
                }
            } else {
                console.log(`其他玩家 ${data.nickname} 抽中了數字: ${data.drawnNumber}`);
            }
        } else {
            // 主持人：更新投影幕顯示
            const lotteryStats = window.gameManager.getLotteryStats();
            window.uiController.updateProjectorLotteryStatus(
                window.gameManager.getPlayersList(),
                lotteryStats
            );
            
            // 如果所有人都抽完，顯示目標數字設定
            if (lotteryStats.allDrawn) {
                window.uiController.showTargetNumberSection();
            }
        }
    }

    /**
     * 處理目標數字設定事件
     * @param {Object} data - 目標數字數據
     */
    handleTargetSet(data) {
        console.log('目標數字設定事件:', data);
        
        if (!this.isHost) {
            // 參賽者：顯示得分
            const myScore = data.roundScores.find(score => 
                score.playerId === this.currentPlayerId
            );
            
            if (myScore) {
                window.uiController.displayRoundScore({
                    drawnNumber: myScore.drawnNumber,
                    targetNumber: data.targetNumber,
                    score: myScore.score
                });
            }
        }
    }

    /**
     * 處理輪次完成事件
     * @param {Object} data - 輪次完成數據
     */
    handleRoundComplete(data) {
        console.log('輪次完成事件:', data);
        
        if (this.isHost) {
            // 主持人：顯示本輪結果
            window.uiController.displayRoundResults(data);
        }
    }

    /**
     * 重置遊戲
     */
    resetGame() {
        if (!confirm('確定要重新開始遊戲嗎？所有數據將被清除。')) {
            return;
        }

        try {
            // 重置遊戲管理器
            window.gameManager.resetGame();

            // 清除儲存的數據
            window.storageManager.clearLocalStorage();

            // 重置 UI
            if (this.isHost) {
                window.uiController.resetHostInterface();
            } else {
                window.uiController.resetPlayerInterface();
            }

            window.uiController.showSuccess('遊戲已重置');
            console.log('遊戲重置完成');

        } catch (error) {
            console.error('重置遊戲失敗:', error);
            window.uiController.showError('重置遊戲失敗: ' + error.message);
        }
    }

    /**
     * 離開房間 (參賽者)
     */
    leaveRoom() {
        if (this.isHost) {
            console.error('主持人無法離開房間，請使用重置功能');
            return;
        }

        try {
            // 重置參賽者 UI
            window.uiController.resetPlayerInterface();
            
            window.uiController.showSuccess('已離開房間');
            console.log('已離開房間');

        } catch (error) {
            console.error('離開房間失敗:', error);
            window.uiController.showError('離開房間失敗: ' + error.message);
        }
    }

    // ==================== 輸入驗證 ====================

    /**
     * 驗證房間代碼輸入
     * @param {HTMLInputElement} input - 輸入框元素
     */
    validateRoomCodeInput(input) {
        const value = input.value.trim();
        const isValid = window.GameRoom.isValidRoomCode(value);
        
        input.classList.toggle('error', value.length > 0 && !isValid);
        
        // 只允許數字
        input.value = input.value.replace(/[^0-9]/g, '');
    }

    /**
     * 驗證暱稱輸入
     * @param {HTMLInputElement} input - 輸入框元素
     */
    validateNicknameInput(input) {
        try {
            const value = input.value.trim();
            if (value.length > 0) {
                // 使用 Player 的驗證邏輯
                const tempPlayer = { validateNickname: window.Player.prototype.validateNickname };
                tempPlayer.validateNickname(value);
            }
            
            input.classList.remove('error');
        } catch (error) {
            input.classList.add('error');
        }
    }

    // ==================== 事件處理 ====================

    /**
     * 處理對等端斷線
     * @param {string} peerId - 斷線的對等端ID
     */
    handlePeerDisconnected(peerId) {
        console.log(`處理對等端斷線: ${peerId}`);
        
        if (this.isHost && window.gameManager.gameRoom) {
            // 更新參賽者連線狀態
            const player = window.gameManager.getPlayer(peerId);
            if (player) {
                player.updateConnectionStatus(window.ConnectionStatus.OFFLINE);
                
                // 更新 UI
                window.uiController.displayPlayersList(window.gameManager.getPlayersList());
                
                // 儲存狀態
                window.storageManager.savePlayers(window.gameManager.getPlayersList());
            }
        }
    }

    /**
     * 處理房間建立成功
     * @param {Object} data - 房間數據
     */
    handleRoomCreated(data) {
        console.log('房間建立成功回調:', data);
        // 這個回調用於 WebRTC 版本，目前使用本地版本
    }

    /**
     * 處理參賽者連接建立 (主持人專用)
     * @param {Object} data - 連接數據 {playerId}
     */
    handlePlayerConnected(data) {
        console.log('收到參賽者連接事件:', data);
        
        if (!this.isHost) {
            console.warn('非主持人收到連接事件，忽略');
            return;
        }

        const { playerId } = data;
        console.log(`參賽者 ${playerId} 已建立 WebRTC 連接，等待加入房間請求...`);
        
        // 顯示連接狀態
        window.uiController.showInfo(`參賽者 ${playerId.substring(0, 8)}... 已建立連接`);
    }

    /**
     * 處理 WebRTC 參賽者加入請求 (主持人專用)
     * @param {Object} data - 加入請求數據 {playerId, roomCode, nickname}
     */
    handlePlayerJoinRequest(data) {
        console.log('收到參賽者加入請求:', data);
        
        if (!this.isHost) {
            console.warn('非主持人收到加入請求，忽略');
            return;
        }

        const { playerId, roomCode, nickname } = data;
        
        // 驗證房間代碼是否正確
        const currentRoom = window.gameManager.gameRoom;
        console.log(`房間驗證 - 請求代碼: "${roomCode}" (${typeof roomCode}), 當前房間代碼: "${currentRoom?.roomCode}" (${typeof currentRoom?.roomCode})`);
        console.log('完整房間對象:', currentRoom);
        
        if (!currentRoom) {
            console.warn('當前沒有遊戲房間');
            window.webRTCManager.sendMessage({
                type: 'joinResponse',
                data: {
                    success: false,
                    error: '房間不存在'
                }
            }, playerId);
            return;
        }
        
        // 比較房間代碼 - 使用字符串比較和強制類型轉換
        const requestedCode = String(roomCode);
        const actualCode = String(currentRoom.roomCode);
        
        if (requestedCode !== actualCode) {
            console.warn(`房間代碼不匹配 - 請求: "${requestedCode}", 實際: "${actualCode}"`);
            window.webRTCManager.sendMessage({
                type: 'joinResponse',
                data: {
                    success: false,
                    error: '房間代碼錯誤'
                }
            }, playerId);
            return;
        }

        try {
            // 加入參賽者到遊戲管理器
            const newPlayer = window.gameManager.addPlayer(nickname || `參賽者${playerId.substring(0, 6)}`, playerId);
            
            console.log(`參賽者 ${newPlayer.nickname} (${playerId}) 成功加入房間`);
            
            // 發送加入成功回應
            window.webRTCManager.sendMessage({
                type: 'joinResponse', 
                data: {
                    success: true,
                    player: newPlayer,
                    room: currentRoom
                }
            }, playerId);

            // 更新主持人界面
            window.uiController.displayPlayersList(window.gameManager.getPlayersList());
            window.uiController.showSuccess(`${newPlayer.nickname} 已加入房間`);

        } catch (error) {
            console.error('處理參賽者加入請求失敗:', error);
            // 發送加入失敗回應
            window.webRTCManager.sendMessage({
                type: 'joinResponse',
                data: {
                    success: false,
                    error: '加入房間失敗: ' + error.message
                }
            }, playerId);
        }
    }

    /**
     * 處理加入房間回應 (參賽者專用)
     * @param {Object} data - 加入回應數據 {success, player, room, error}
     */
    handleJoinResponse(data) {
        console.log('收到加入房間回應:', data);
        
        if (this.isHost) {
            console.warn('主持人收到加入回應，忽略');
            return;
        }

        if (data.success) {
            const { player, room } = data;
            
            // 設置當前參賽者信息
            this.currentPlayer = player;
            this.currentRoom = room;
            this.currentPlayerId = player.playerId;
            this.currentNickname = player.nickname;
            this.role = 'player';
            
            console.log(`成功加入房間 ${room.code}，參賽者信息:`, player);
            
            // 顯示成功訊息並切換到參賽者介面
            window.uiController.showSuccess(`歡迎 ${player.nickname}！已成功加入房間`);
            window.uiController.showScreen('player-screen');
            
            // 更新參賽者介面
            window.uiController.updatePlayerInfo(player);
            
        } else {
            // 加入失敗
            const errorMsg = data.error || '加入房間失敗';
            console.error('加入房間失敗:', errorMsg);
            window.uiController.showError(errorMsg);
        }
    }

    /**
     * 處理參賽者加入
     * @param {Object} data - 參賽者數據
     */
    handlePlayerJoined(data) {
        console.log('參賽者加入回調:', data);
        
        if (this.isHost) {
            // 更新主持人介面的參賽者列表
            window.uiController.displayPlayersList(window.gameManager.getPlayersList());
        }
    }

    /**
     * 處理參賽者離開
     * @param {Object} data - 參賽者數據
     */
    handlePlayerLeft(data) {
        console.log('參賽者離開回調:', data);
        
        if (this.isHost) {
            // 更新主持人介面的參賽者列表
            window.uiController.displayPlayersList(window.gameManager.getPlayersList());
        }
    }
}

// 創建全域遊戲控制器實例
const gameController = new GameController();

// 當所有模組載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    // 確保所有依賴都已載入
    if (window.uiController && window.webRTCManager && window.gameManager) {
        gameController.init();
        console.log('遊戲控制器已啟動');
    } else {
        console.error('遊戲依賴未完全載入');
        console.error('依賴狀態:', {
            uiController: !!window.uiController,
            webRTCManager: !!window.webRTCManager,
            gameManager: !!window.gameManager
        });
    }
});

// 匯出
window.GameController = GameController;
window.gameController = gameController;
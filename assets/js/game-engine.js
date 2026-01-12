/**
 * 數字抽籤遊戲 - 遊戲引擎
 * 核心遊戲邏輯和實體管理
 */

// ==================== 枚舉定義 ====================

const GameState = {
    WAITING: 'waiting',                     // 等待參賽者加入
    LOTTERY_IN_PROGRESS: 'lottery_in_progress', // 抽籤進行中
    SCORING: 'scoring',                     // 計分階段
    ROUND_COMPLETE: 'round_complete',       // 本輪完成
    GAME_FINISHED: 'game_finished'          // 遊戲結束
};

const ConnectionStatus = {
    ONLINE: 'online',                       // 線上
    OFFLINE: 'offline',                     // 離線
    RECONNECTING: 'reconnecting'            // 重新連線中
};

// ==================== 工具函數 ====================

/**
 * 生成 UUID
 * @returns {string} UUID 字串
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 生成房間代碼 (4-6位數字)
 * @returns {string} 房間代碼
 */
function generateRoomCode() {
    const length = Math.floor(Math.random() * 3) + 4; // 4-6位
    let code = '';
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

/**
 * 生成隨機數字 (0-100)
 * @returns {number} 隨機數字
 */
function generateRandomNumber() {
    return Math.floor(Math.random() * 101); // 0-100
}

// ==================== 遊戲房間類別 ====================

class GameRoom {
    constructor(roomCode = null) {
        this.roomCode = roomCode || generateRoomCode();
        this.currentRound = 1;
        this.gameState = GameState.WAITING;
        this.hostTargetNumber = null;
        this.maxPlayers = 5;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * 更新房間狀態
     */
    updateTimestamp() {
        this.updatedAt = new Date();
    }

    /**
     * 驗證遊戲狀態轉換
     * @param {string} newState - 新狀態
     * @returns {boolean} 是否允許轉換
     */
    canTransitionTo(newState) {
        const validTransitions = {
            [GameState.WAITING]: [GameState.LOTTERY_IN_PROGRESS],
            [GameState.LOTTERY_IN_PROGRESS]: [GameState.SCORING],
            [GameState.SCORING]: [GameState.ROUND_COMPLETE, GameState.GAME_FINISHED],
            [GameState.ROUND_COMPLETE]: [GameState.LOTTERY_IN_PROGRESS, GameState.GAME_FINISHED],
            [GameState.GAME_FINISHED]: [GameState.WAITING] // 重新開始
        };

        return validTransitions[this.gameState]?.includes(newState) || false;
    }

    /**
     * 轉換遊戲狀態
     * @param {string} newState - 新狀態
     */
    transitionTo(newState) {
        // 如果新狀態與當前狀態相同，直接返回，不拋出錯誤
        if (this.gameState === newState) {
            console.log(`遊戲狀態已經是 ${newState}，跳過轉換`);
            return;
        }
        
        if (!this.canTransitionTo(newState)) {
            throw new Error(`無法從 ${this.gameState} 轉換到 ${newState}`);
        }
        
        console.log(`遊戲狀態轉換: ${this.gameState} -> ${newState}`);
        this.gameState = newState;
        this.updateTimestamp();
    }

    /**
     * 進入下一輪
     */
    nextRound() {
        if (this.currentRound >= 5) {
            throw new Error('已達到最大輪數');
        }
        
        this.currentRound++;
        this.hostTargetNumber = null; // 重置目標數字
        this.updateTimestamp();
        
        console.log(`進入第 ${this.currentRound} 輪`);
    }

    /**
     * 檢查是否為最後一輪
     * @returns {boolean} 是否為最後一輪
     */
    isLastRound() {
        return this.currentRound >= 5;
    }

    /**
     * 重置遊戲
     */
    reset() {
        this.currentRound = 1;
        this.gameState = GameState.WAITING;
        this.hostTargetNumber = null;
        this.updateTimestamp();
        
        console.log('遊戲已重置');
    }

    /**
     * 驗證房間代碼格式
     * @param {string} code - 房間代碼
     * @returns {boolean} 是否有效
     */
    static isValidRoomCode(code) {
        return /^\d{4,6}$/.test(code);
    }

    /**
     * 序列化為 JSON
     */
    toJSON() {
        return {
            roomCode: this.roomCode,
            currentRound: this.currentRound,
            gameState: this.gameState,
            hostTargetNumber: this.hostTargetNumber,
            maxPlayers: this.maxPlayers,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * 從 JSON 建立實例
     * @param {Object} data - JSON 數據
     */
    static fromJSON(data) {
        const room = new GameRoom(data.roomCode);
        room.currentRound = data.currentRound;
        room.gameState = data.gameState;
        room.hostTargetNumber = data.hostTargetNumber;
        room.maxPlayers = data.maxPlayers;
        room.createdAt = new Date(data.createdAt);
        room.updatedAt = new Date(data.updatedAt);
        return room;
    }
}

// ==================== 參賽者類別 ====================

class Player {
    constructor(nickname, roomCode, playerId = null) {
        this.playerId = playerId || generateUUID();
        this.nickname = this.validateNickname(nickname);
        this.roomCode = roomCode;
        this.currentNumber = null;
        this.totalScore = 0;
        this.connectionStatus = ConnectionStatus.ONLINE;
        this.position = null; // 將由遊戲管理器設定
        this.joinedAt = new Date();
    }

    /**
     * 驗證暱稱
     * @param {string} nickname - 暱稱
     * @returns {string} 驗證後的暱稱
     */
    validateNickname(nickname) {
        if (!nickname || typeof nickname !== 'string') {
            throw new Error('暱稱不能為空');
        }
        
        const trimmed = nickname.trim();
        if (trimmed.length === 0) {
            throw new Error('暱稱不能為空');
        }
        
        if (trimmed.length > 20) {
            throw new Error('暱稱不能超過 20 個字元');
        }
        
        // 檢查特殊符號 (允許中文、英文、數字、基本符號)
        if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
            throw new Error('暱稱包含不允許的特殊符號');
        }
        
        return trimmed;
    }

    /**
     * 抽取數字
     * @returns {number} 抽中的數字
     */
    drawNumber() {
        if (this.currentNumber !== null) {
            throw new Error('本輪已經抽過數字');
        }
        
        this.currentNumber = generateRandomNumber();
        console.log(`${this.nickname} 抽中數字: ${this.currentNumber}`);
        return this.currentNumber;
    }

    /**
     * 計算本輪得分
     * @param {number} hostTargetNumber - 主持人目標數字
     * @returns {number} 本輪得分
     */
    calculateRoundScore(hostTargetNumber) {
        if (this.currentNumber === null) {
            throw new Error('尚未抽取數字');
        }
        
        if (hostTargetNumber === null || hostTargetNumber === undefined) {
            throw new Error('主持人未設定目標數字');
        }
        
        const score = this.currentNumber - hostTargetNumber;
        console.log(`${this.nickname} 本輪得分: ${this.currentNumber} - ${hostTargetNumber} = ${score}`);
        return score;
    }

    /**
     * 添加得分到總分
     * @param {number} score - 本輪得分
     */
    addScore(score) {
        this.totalScore += score;
        console.log(`${this.nickname} 總得分更新為: ${this.totalScore}`);
    }

    /**
     * 重置本輪數字 (開始新輪次時調用)
     */
    resetCurrentNumber() {
        this.currentNumber = null;
    }

    /**
     * 更新連線狀態
     * @param {string} status - 新的連線狀態
     */
    updateConnectionStatus(status) {
        if (!Object.values(ConnectionStatus).includes(status)) {
            throw new Error(`無效的連線狀態: ${status}`);
        }
        
        console.log(`${this.nickname} 連線狀態: ${this.connectionStatus} -> ${status}`);
        this.connectionStatus = status;
    }

    /**
     * 檢查是否已抽取數字
     * @returns {boolean} 是否已抽取
     */
    hasDrawnNumber() {
        return this.currentNumber !== null;
    }

    /**
     * 檢查是否在線
     * @returns {boolean} 是否在線
     */
    isOnline() {
        return this.connectionStatus === ConnectionStatus.ONLINE;
    }

    /**
     * 序列化為 JSON
     */
    toJSON() {
        return {
            playerId: this.playerId,
            nickname: this.nickname,
            roomCode: this.roomCode,
            currentNumber: this.currentNumber,
            totalScore: this.totalScore,
            connectionStatus: this.connectionStatus,
            position: this.position,
            joinedAt: this.joinedAt.toISOString()
        };
    }

    /**
     * 從 JSON 建立實例
     * @param {Object} data - JSON 數據
     */
    static fromJSON(data) {
        const player = new Player(data.nickname, data.roomCode, data.playerId);
        player.currentNumber = data.currentNumber;
        player.totalScore = data.totalScore;
        player.connectionStatus = data.connectionStatus;
        player.position = data.position;
        player.joinedAt = new Date(data.joinedAt);
        return player;
    }
}

// ==================== 遊戲輪次類別 ====================

class GameRound {
    constructor(roomCode, roundNumber) {
        this.roundId = generateUUID();
        this.roomCode = roomCode;
        this.roundNumber = roundNumber;
        this.hostTargetNumber = null;
        this.playerScores = [];
        this.isComplete = false;
        this.completedAt = null;
    }

    /**
     * 設定主持人目標數字
     * @param {number} targetNumber - 目標數字 (0-100)
     */
    setHostTargetNumber(targetNumber) {
        if (targetNumber < 0 || targetNumber > 100 || !Number.isInteger(targetNumber)) {
            throw new Error('目標數字必須是 0-100 之間的整數');
        }
        
        this.hostTargetNumber = targetNumber;
        console.log(`第 ${this.roundNumber} 輪目標數字設定為: ${targetNumber}`);
    }

    /**
     * 添加參賽者得分
     * @param {string} playerId - 參賽者ID
     * @param {number} drawnNumber - 抽中數字
     * @param {number} score - 得分
     */
    addPlayerScore(playerId, drawnNumber, score) {
        // 檢查是否已有該參賽者的得分
        const existingIndex = this.playerScores.findIndex(ps => ps.playerId === playerId);
        
        const playerScore = {
            playerId,
            drawnNumber,
            score,
            drawnAt: new Date()
        };

        if (existingIndex >= 0) {
            // 更新現有得分
            this.playerScores[existingIndex] = playerScore;
        } else {
            // 添加新得分
            this.playerScores.push(playerScore);
        }

        console.log(`添加 ${playerId} 的得分: ${score}`);
    }

    /**
     * 完成本輪
     */
    complete() {
        if (this.hostTargetNumber === null) {
            throw new Error('主持人未設定目標數字，無法完成本輪');
        }
        
        this.isComplete = true;
        this.completedAt = new Date();
        
        console.log(`第 ${this.roundNumber} 輪已完成`);
    }

    /**
     * 獲取參賽者得分
     * @param {string} playerId - 參賽者ID
     * @returns {Object|null} 參賽者得分對象
     */
    getPlayerScore(playerId) {
        return this.playerScores.find(ps => ps.playerId === playerId) || null;
    }

    /**
     * 檢查所有參賽者是否都已抽取數字
     * @param {Array} playerIds - 參賽者ID陣列
     * @returns {boolean} 是否都已抽取
     */
    areAllPlayersDrawn(playerIds) {
        return playerIds.every(playerId => 
            this.playerScores.some(ps => ps.playerId === playerId)
        );
    }

    /**
     * 序列化為 JSON
     */
    toJSON() {
        return {
            roundId: this.roundId,
            roomCode: this.roomCode,
            roundNumber: this.roundNumber,
            hostTargetNumber: this.hostTargetNumber,
            playerScores: this.playerScores.map(ps => ({
                ...ps,
                drawnAt: ps.drawnAt.toISOString()
            })),
            isComplete: this.isComplete,
            completedAt: this.completedAt ? this.completedAt.toISOString() : null
        };
    }

    /**
     * 從 JSON 建立實例
     * @param {Object} data - JSON 數據
     */
    static fromJSON(data) {
        const round = new GameRound(data.roomCode, data.roundNumber);
        round.roundId = data.roundId;
        round.hostTargetNumber = data.hostTargetNumber;
        round.playerScores = data.playerScores.map(ps => ({
            ...ps,
            drawnAt: new Date(ps.drawnAt)
        }));
        round.isComplete = data.isComplete;
        round.completedAt = data.completedAt ? new Date(data.completedAt) : null;
        return round;
    }
}

// ==================== 遊戲結果類別 ====================

class GameResult {
    constructor(roomCode) {
        this.resultId = generateUUID();
        this.roomCode = roomCode;
        this.winners = [];
        this.finalRankings = [];
        this.gameCompletedAt = new Date();
        this.totalRounds = 5;
    }

    /**
     * 計算最終排名
     * @param {Array} players - 參賽者陣列
     * @param {Array} rounds - 所有輪次陣列
     */
    calculateFinalRankings(players, rounds) {
        // 建立參賽者排名數據
        const playerRankings = players.map(player => {
            const roundScores = rounds.map(round => {
                const playerScore = round.getPlayerScore(player.playerId);
                return playerScore ? playerScore.score : 0;
            });

            return {
                playerId: player.playerId,
                nickname: player.nickname,
                totalScore: player.totalScore,
                roundScores,
                rank: 0, // 將在下面設定
                isWinner: false
            };
        });

        // 按總分排序 (降序)
        playerRankings.sort((a, b) => b.totalScore - a.totalScore);

        // 設定排名和獲勝者
        let currentRank = 1;
        const highestScore = playerRankings[0]?.totalScore;
        
        for (let i = 0; i < playerRankings.length; i++) {
            const player = playerRankings[i];
            
            // 處理並列排名
            if (i > 0 && player.totalScore < playerRankings[i - 1].totalScore) {
                currentRank = i + 1;
            }
            
            player.rank = currentRank;
            
            // 最高分者都是獲勝者 (支援並列第一)
            if (player.totalScore === highestScore) {
                player.isWinner = true;
                this.winners.push(player.playerId);
            }
        }

        this.finalRankings = playerRankings;
        
        console.log('最終排名計算完成:', {
            winners: this.winners,
            rankings: this.finalRankings
        });
    }

    /**
     * 獲取獲勝者資訊
     * @returns {Array} 獲勝者陣列
     */
    getWinners() {
        return this.finalRankings.filter(player => player.isWinner);
    }

    /**
     * 檢查是否有並列冠軍
     * @returns {boolean} 是否並列
     */
    hasTiedWinners() {
        return this.winners.length > 1;
    }

    /**
     * 序列化為 JSON
     */
    toJSON() {
        return {
            resultId: this.resultId,
            roomCode: this.roomCode,
            winners: this.winners,
            finalRankings: this.finalRankings,
            gameCompletedAt: this.gameCompletedAt.toISOString(),
            totalRounds: this.totalRounds
        };
    }

    /**
     * 從 JSON 建立實例
     * @param {Object} data - JSON 數據
     */
    static fromJSON(data) {
        const result = new GameResult(data.roomCode);
        result.resultId = data.resultId;
        result.winners = data.winners;
        result.finalRankings = data.finalRankings;
        result.gameCompletedAt = new Date(data.gameCompletedAt);
        result.totalRounds = data.totalRounds;
        return result;
    }
}

// ==================== 遊戲管理器類別 ====================

class GameManager {
    constructor() {
        this.gameRoom = null;
        this.players = [];
        this.rounds = [];
        this.gameResult = null;
    }

    /**
     * 建立新遊戲房間
     * @param {string} roomCode - 可選的房間代碼
     * @returns {GameRoom} 新建立的遊戲房間
     */
    createGameRoom(roomCode = null) {
        this.gameRoom = new GameRoom(roomCode);
        this.players = [];
        this.rounds = [];
        this.gameResult = null;
        
        console.log(`遊戲房間 ${this.gameRoom.roomCode} 已建立`);
        return this.gameRoom;
    }

    /**
     * 驗證參賽者人數限制
     * @returns {boolean} 是否可以加入更多參賽者
     */
    canAddPlayer() {
        if (!this.gameRoom) {
            throw new Error('遊戲房間不存在');
        }
        
        return this.players.length < this.gameRoom.maxPlayers;
    }

    /**
     * 加入參賽者
     * @param {string} nickname - 參賽者暱稱
     * @param {string} playerId - 參賽者ID
     * @returns {Player} 新加入的參賽者
     */
    addPlayer(nickname, playerId = null) {
        if (!this.gameRoom) {
            throw new Error('遊戲房間不存在');
        }

        // 檢查人數限制
        if (!this.canAddPlayer()) {
            throw new Error(`遊戲人數已滿 (最多 ${this.gameRoom.maxPlayers} 人)`);
        }

        // 檢查暱稱唯一性
        if (this.isNicknameTaken(nickname)) {
            throw new Error('暱稱已被使用，請選擇其他暱稱');
        }

        // 建立新參賽者
        const player = new Player(nickname, this.gameRoom.roomCode, playerId);
        player.position = this.players.length + 1;

        this.players.push(player);
        
        console.log(`參賽者 ${nickname} 已加入遊戲 (${this.players.length}/${this.gameRoom.maxPlayers})`);
        return player;
    }

    /**
     * 檢查暱稱是否已被使用
     * @param {string} nickname - 要檢查的暱稱
     * @returns {boolean} 暱稱是否已被使用
     */
    isNicknameTaken(nickname) {
        const trimmedNickname = nickname.trim().toLowerCase();
        return this.players.some(player => 
            player.nickname.trim().toLowerCase() === trimmedNickname
        );
    }

    /**
     * 移除參賽者
     * @param {string} playerId - 參賽者ID
     * @returns {boolean} 是否成功移除
     */
    removePlayer(playerId) {
        const index = this.players.findIndex(player => player.playerId === playerId);
        
        if (index === -1) {
            return false;
        }

        const removedPlayer = this.players.splice(index, 1)[0];
        
        // 重新分配位置
        this.players.forEach((player, idx) => {
            player.position = idx + 1;
        });

        console.log(`參賽者 ${removedPlayer.nickname} 已離開遊戲`);
        return true;
    }

    /**
     * 獲取參賽者資訊
     * @param {string} playerId - 參賽者ID
     * @returns {Player|null} 參賽者對象
     */
    getPlayer(playerId) {
        return this.players.find(player => player.playerId === playerId) || null;
    }

    /**
     * 獲取參賽者清單
     * @returns {Array} 參賽者陣列
     */
    getPlayersList() {
        return [...this.players]; // 返回副本
    }

    /**
     * 檢查是否可以開始遊戲
     * @returns {boolean} 是否可以開始遊戲
     */
    canStartGame() {
        return this.players.length >= 2 && // 至少2位參賽者
               this.gameRoom && 
               this.gameRoom.gameState === GameState.WAITING;
    }

    /**
     * 開始遊戲
     */
    startGame() {
        if (!this.canStartGame()) {
            throw new Error('無法開始遊戲：參賽者人數不足或遊戲狀態不正確');
        }

        console.log(`當前遊戲狀態: ${this.gameRoom.gameState}`);
        
        // 只有在不是 WAITING 狀態時才需要轉換
        if (this.gameRoom.gameState === GameState.GAME_FINISHED) {
            console.log('遊戲已結束，重新開始新遊戲');
            this.gameRoom.transitionTo(GameState.WAITING);
        } else if (this.gameRoom.gameState === GameState.WAITING) {
            console.log('遊戲狀態已經是 WAITING，準備開始');
        } else {
            console.log(`遊戲狀態為 ${this.gameRoom.gameState}，無法直接開始`);
        }
        
        console.log('遊戲已開始，等待主持人啟動抽籤');
    }

    /**
     * 開始抽籤
     * @param {number} roundNumber - 輪數（可選，預設為當前輪）
     */
    startLottery(roundNumber = null) {
        if (!this.gameRoom) {
            throw new Error('遊戲房間不存在');
        }

        // 如果指定輪數，更新當前輪數
        if (roundNumber && roundNumber !== this.gameRoom.currentRound) {
            this.gameRoom.currentRound = roundNumber;
        }

        // 檢查狀態
        const validStates = [GameState.WAITING, GameState.ROUND_COMPLETE];
        if (!validStates.includes(this.gameRoom.gameState)) {
            throw new Error(`無法開始抽籤：當前狀態為 ${this.gameRoom.gameState}`);
        }

        this.gameRoom.transitionTo(GameState.LOTTERY_IN_PROGRESS);
        
        // 重置本輪數據
        this.players.forEach(player => {
            if (!player.drawnNumbers) {
                player.drawnNumbers = [];
            }
            if (!player.roundScores) {
                player.roundScores = [];
            }
        });

        console.log(`第 ${this.gameRoom.currentRound} 輪抽籤已開始`);
    }

    /**
     * 參賽者抽取數字
     * @param {string} playerId - 參賽者ID
     * @returns {number} 抽中的數字
     */
    drawNumber(playerId) {
        if (!this.gameRoom || this.gameRoom.gameState !== GameState.LOTTERY_IN_PROGRESS) {
            throw new Error('當前無法抽取數字');
        }

        const player = this.getPlayer(playerId);
        if (!player) {
            throw new Error('參賽者不存在');
        }

        const roundIndex = this.gameRoom.currentRound - 1;
        
        // 檢查是否已經抽過
        if (player.drawnNumbers[roundIndex] !== undefined) {
            throw new Error('您已經抽過數字了');
        }

        // 抽取數字
        const drawnNumber = generateRandomNumber();
        player.drawnNumbers[roundIndex] = drawnNumber;

        console.log(`參賽者 ${player.nickname} 在第 ${this.gameRoom.currentRound} 輪抽中數字: ${drawnNumber}`);
        
        return drawnNumber;
    }

    /**
     * 設定目標數字並計算得分
     * @param {number} targetNumber - 目標數字
     * @returns {Array} 本輪得分結果
     */
    setTargetNumber(targetNumber) {
        if (!this.gameRoom || this.gameRoom.gameState !== GameState.LOTTERY_IN_PROGRESS) {
            throw new Error('當前無法設定目標數字');
        }

        if (targetNumber < 0 || targetNumber > 100 || !Number.isInteger(targetNumber)) {
            throw new Error('目標數字必須是0-100之間的整數');
        }

        this.gameRoom.hostTargetNumber = targetNumber;
        this.gameRoom.transitionTo(GameState.SCORING);

        // 計算本輪得分
        const roundResults = this.calculateRoundScores();
        
        console.log(`目標數字已設定: ${targetNumber}，本輪計分完成`);
        
        return roundResults;
    }

    /**
     * 計算本輪得分
     * @returns {Array} 本輪得分結果
     */
    calculateRoundScores() {
        if (!this.gameRoom) {
            throw new Error('遊戲房間不存在');
        }

        const roundIndex = this.gameRoom.currentRound - 1;
        const targetNumber = this.gameRoom.hostTargetNumber;
        const roundResults = [];

        this.players.forEach(player => {
            const drawnNumber = player.drawnNumbers[roundIndex];
            
            if (drawnNumber !== undefined) {
                const score = drawnNumber - targetNumber;
                player.roundScores[roundIndex] = score;
                
                // 更新總得分
                player.totalScore = player.roundScores.reduce((sum, s) => sum + (s || 0), 0);
                
                roundResults.push({
                    playerId: player.playerId,
                    nickname: player.nickname,
                    drawnNumber: drawnNumber,
                    score: score,
                    totalScore: player.totalScore
                });
            }
        });

        return roundResults;
    }

    /**
     * 完成當前輪
     * @returns {Object} 輪次結果摘要
     */
    completeRound() {
        if (!this.gameRoom || this.gameRoom.gameState !== GameState.SCORING) {
            throw new Error('當前無法完成輪次');
        }

        // 生成輪次摘要
        const roundSummary = {
            roundNumber: this.gameRoom.currentRound,
            targetNumber: this.gameRoom.hostTargetNumber,
            results: this.calculateRoundScores(),
            isGameComplete: this.gameRoom.currentRound >= 5
        };

        if (roundSummary.isGameComplete) {
            // 遊戲結束
            this.gameRoom.transitionTo(GameState.GAME_FINISHED);
            roundSummary.finalRanking = this.calculateFinalRanking();
        } else {
            // 準備下一輪
            this.gameRoom.transitionTo(GameState.ROUND_COMPLETE);
        }

        console.log(`第 ${this.gameRoom.currentRound} 輪已完成`);
        
        return roundSummary;
    }

    /**
     * 開始下一輪
     */
    startNextRound() {
        if (!this.gameRoom || this.gameRoom.gameState !== GameState.ROUND_COMPLETE) {
            throw new Error('當前無法開始下一輪');
        }

        if (this.gameRoom.currentRound >= 5) {
            throw new Error('遊戲已完成所有輪次');
        }

        this.gameRoom.currentRound += 1;
        this.startLottery();
        
        console.log(`開始第 ${this.gameRoom.currentRound} 輪`);
    }

    /**
     * 計算最終排名
     * @returns {Array} 最終排名
     */
    calculateFinalRanking() {
        // 按總得分排序（降序）
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        
        if (sortedPlayers.length === 0) return [];
        
        const ranking = [];
        let currentRank = 1;
        const highestScore = sortedPlayers[0].totalScore;
        
        for (let i = 0; i < sortedPlayers.length; i++) {
            const player = sortedPlayers[i];
            
            // 處理並列情況 - 只有當分數不同時才更新排名
            if (i > 0 && sortedPlayers[i - 1].totalScore !== player.totalScore) {
                currentRank = i + 1;
            }
            
            // 判斷是否為獲勝者（最高分）
            const isWinner = player.totalScore === highestScore;
            
            ranking.push({
                rank: currentRank,
                playerId: player.playerId,
                nickname: player.nickname,
                totalScore: player.totalScore,
                roundScores: [...player.roundScores],
                isWinner: isWinner
            });
        }
        
        // 計算獲勝者數量
        const winners = ranking.filter(p => p.isWinner);
        console.log(`最終排名計算完成，共有 ${winners.length} 位獲勝者`);
        
        return ranking;
    }

    /**
     * 檢查是否所有參賽者都已抽籤
     * @returns {boolean} 是否全部完成
     */
    areAllPlayersDrawn() {
        if (!this.gameRoom) return false;
        
        const roundIndex = this.gameRoom.currentRound - 1;
        return this.players.every(player => 
            player.drawnNumbers && player.drawnNumbers[roundIndex] !== undefined
        );
    }

    /**
     * 獲取抽籤統計
     * @returns {Object} 抽籤統計
     */
    getLotteryStats() {
        if (!this.gameRoom) return null;
        
        const roundIndex = this.gameRoom.currentRound - 1;
        const drawnCount = this.players.filter(player => 
            player.drawnNumbers && player.drawnNumbers[roundIndex] !== undefined
        ).length;
        
        return {
            roundNumber: this.gameRoom.currentRound,
            drawnCount: drawnCount,
            totalPlayers: this.players.length,
            allDrawn: drawnCount === this.players.length,
            gameState: this.gameRoom.gameState,
            targetNumber: this.gameRoom.hostTargetNumber
        };
    }

    /**
     * 重置遊戲
     */
    resetGame() {
        if (this.gameRoom) {
            this.gameRoom.reset();
        }
        
        this.players = [];
        this.rounds = [];
        this.gameResult = null;
        
        console.log('遊戲已重置');
    }

    /**
     * 獲取遊戲統計資訊
     * @returns {Object} 遊戲統計
     */
    getGameStats() {
        return {
            roomCode: this.gameRoom?.roomCode || null,
            playerCount: this.players.length,
            maxPlayers: this.gameRoom?.maxPlayers || 5,
            gameState: this.gameRoom?.gameState || null,
            currentRound: this.gameRoom?.currentRound || 1,
            canAddPlayer: this.canAddPlayer(),
            canStartGame: this.canStartGame()
        };
    }

    // ==================== Phase 6: 遊戲狀態管理與重置 ====================

    /**
     * 獲取完整遊戲狀態 (T048)
     */
    getCurrentGameState() {
        return {
            roomCode: this.gameRoom?.roomCode || null,
            gameState: this.gameRoom?.gameState || GameState.WAITING,
            currentRound: this.gameRoom?.currentRound || 1,
            totalRounds: this.gameRoom?.totalRounds || 5,
            players: this.players.map(player => ({
                playerId: player.playerId,
                nickname: player.nickname,
                totalScore: player.totalScore,
                roundScores: player.roundScores,
                drawnNumbers: player.drawnNumbers,
                connectionStatus: player.connectionStatus || ConnectionStatus.ONLINE
            })),
            scores: this.getAllScores(),
            startTime: this.gameRoom?.createdAt || null,
            statistics: this.getGameStatistics()
        };
    }

    /**
     * 重置遊戲狀態 (T049)
     */
    resetGame() {
        console.log('重置遊戲狀態');

        // 重置遊戲房間
        if (this.gameRoom) {
            this.gameRoom.reset();
        }

        // 重置所有玩家狀態
        this.players.forEach(player => {
            player.totalScore = 0;
            player.roundScores = [];
            player.drawnNumbers = [];
        });

        // 清空輪次記錄
        this.rounds.clear();

        // 觸發重置事件
        window.dispatchEvent(new CustomEvent('gameReset', {
            detail: {
                timestamp: Date.now(),
                playersCount: this.players.length
            }
        }));

        console.log('遊戲重置完成');
    }

    /**
     * 獲取遊戲統計資料
     */
    getGameStatistics() {
        const now = Date.now();
        const startTime = this.gameRoom?.createdAt || now;
        const duration = now - startTime;

        // 計算總抽籤次數
        let totalDraws = 0;
        this.players.forEach(player => {
            if (player.drawnNumbers) {
                totalDraws += player.drawnNumbers.filter(num => num !== undefined).length;
            }
        });

        // 計算平均得分
        const totalScores = this.players.reduce((sum, player) => sum + player.totalScore, 0);
        const averageScore = this.players.length > 0 ? totalScores / this.players.length : 0;

        // 找到最高分和最低分
        const scores = this.players.map(player => player.totalScore);
        const highestScore = Math.max(...scores, 0);
        const lowestScore = Math.min(...scores, 0);

        return {
            gameStartTime: startTime,
            gameDuration: duration,
            totalDraws: totalDraws,
            completedRounds: this.gameRoom?.currentRound ? this.gameRoom.currentRound - 1 : 0,
            playersCount: this.players.length,
            averageScore: Math.round(averageScore * 100) / 100,
            highestScore: highestScore,
            lowestScore: lowestScore,
            isGameComplete: this.gameRoom?.gameState === GameState.GAME_FINISHED
        };
    }

    /**
     * 獲取總抽籤次數
     */
    getTotalDraws() {
        let totalDraws = 0;
        this.players.forEach(player => {
            if (player.drawnNumbers) {
                totalDraws += player.drawnNumbers.filter(num => num !== undefined).length;
            }
        });
        return totalDraws;
    }

    /**
     * 獲取所有得分記錄
     */
    getAllScores() {
        const allScores = {};
        
        this.players.forEach(player => {
            allScores[player.playerId] = {
                totalScore: player.totalScore,
                roundScores: [...player.roundScores],
                drawnNumbers: [...(player.drawnNumbers || [])]
            };
        });

        return allScores;
    }

    /**
     * 更新玩家連線狀態 (T050, T052)
     */
    updatePlayerConnectionStatus(playerId, status) {
        const player = this.players.find(p => p.playerId === playerId);
        if (player) {
            player.connectionStatus = status;
            
            // 觸發連線狀態更新事件
            window.dispatchEvent(new CustomEvent('playerConnectionStatusChanged', {
                detail: {
                    playerId: playerId,
                    nickname: player.nickname,
                    status: status,
                    timestamp: Date.now()
                }
            }));

            return true;
        }
        return false;
    }

    /**
     * 獲取離線玩家列表
     */
    getOfflinePlayers() {
        return this.players.filter(player => 
            player.connectionStatus === ConnectionStatus.OFFLINE
        );
    }

    /**
     * 獲取在線玩家列表
     */
    getOnlinePlayers() {
        return this.players.filter(player => 
            player.connectionStatus === ConnectionStatus.ONLINE
        );
    }

    /**
     * 檢查遊戲是否可以繼續
     */
    canGameContinue() {
        const onlinePlayers = this.getOnlinePlayers();
        return onlinePlayers.length >= 2; // 至少需要2位在線玩家
    }

    /**
     * 暫停遊戲（等待重新連線）
     */
    pauseGame(reason = 'connection_lost') {
        if (this.gameRoom && this.gameRoom.gameState !== GameState.GAME_FINISHED) {
            console.log(`遊戲暫停: ${reason}`);
            
            // 觸發遊戲暫停事件
            window.dispatchEvent(new CustomEvent('gamePaused', {
                detail: {
                    reason: reason,
                    timestamp: Date.now(),
                    onlinePlayersCount: this.getOnlinePlayers().length
                }
            }));
        }
    }

    /**
     * 恢復遊戲
     */
    resumeGame() {
        if (this.canGameContinue()) {
            console.log('遊戲恢復');
            
            // 觸發遊戲恢復事件
            window.dispatchEvent(new CustomEvent('gameResumed', {
                detail: {
                    timestamp: Date.now(),
                    onlinePlayersCount: this.getOnlinePlayers().length
                }
            }));

            return true;
        }
        
        console.log('無法恢復遊戲：在線玩家不足');
        return false;
    }
}

// ==================== 匯出 ====================

// 將所有類別和枚舉匯出到全域空間
window.GameState = GameState;
window.ConnectionStatus = ConnectionStatus;
window.GameRoom = GameRoom;
window.Player = Player;
window.GameRound = GameRound;
window.GameResult = GameResult;
window.GameManager = GameManager;

// 工具函數
window.generateUUID = generateUUID;
window.generateRoomCode = generateRoomCode;
window.generateRandomNumber = generateRandomNumber;

// 建立全域遊戲管理器實例
window.gameManager = new GameManager();

console.log('遊戲引擎已載入完成');
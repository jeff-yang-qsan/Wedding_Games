# API 合約: 遊戲邏輯與狀態管理

**Created**: 2026-01-12  
**Purpose**: 數字輸入邏輯、計分系統、排名計算相關的 API 合約

## 遊戲邏輯 API

### 輪次管理

#### 完成當前輪次
**消息類型**: `COMPLETE_ROUND`  
**發送者**: 系統 (當所有條件滿足時自動觸發)

```javascript
{
  type: "COMPLETE_ROUND",
  timestamp: "2026-01-12T12:05:45.000Z",
  senderId: "system",
  data: {
    completedRound: 1,
    nextRound: 2,
    gameState: "round_complete",
    canStartNextRound: true,
    isGameComplete: false
  }
}
```

#### 開始下一輪
**消息類型**: `START_NEXT_ROUND`  
**發送者**: 主持人

```javascript
// Request
{
  type: "START_NEXT_ROUND",
  timestamp: "2026-01-12T12:06:00.000Z",
  senderId: "host",
  data: {
    nextRoundNumber: 2
  }
}

// Response
{
  type: "NEXT_ROUND_STARTED",
  timestamp: "2026-01-12T12:06:00.100Z",
  senderId: "system",
  data: {
    currentRound: 2,
    gameState: "waiting",
    resetFields: ["hostTargetNumber", "playerCurrentNumbers"],
    playersReady: []
  }
}
```

### 計分系統

#### 即時排名更新
**消息類型**: `RANKINGS_UPDATE`  
**發送者**: 系統 (每輪計分後自動觸發)

```javascript
{
  type: "RANKINGS_UPDATE",
  timestamp: "2026-01-12T12:05:35.000Z",
  senderId: "system",
  data: {
    currentRound: 1,
    rankings: [
      {
        rank: 1,
        playerId: "player-uuid-1",
        nickname: "小明",
        totalScore: 25,
        roundScores: [25, null, null, null, null],
        isWinning: true
      },
      {
        rank: 2,
        playerId: "player-uuid-3",
        nickname: "小華",
        totalScore: 10,
        roundScores: [10, null, null, null, null],
        isWinning: false
      },
      {
        rank: 3,
        playerId: "player-uuid-2",
        nickname: "小美",
        totalScore: -20,
        roundScores: [-20, null, null, null, null],
        isWinning: false
      }
    ]
  }
}
```

#### 並列排名處理
**消息類型**: `TIE_DETECTED`  
**發送者**: 系統

```javascript
{
  type: "TIE_DETECTED",
  timestamp: "2026-01-12T12:25:30.000Z",
  senderId: "system",
  data: {
    tieType: "FINAL_TIE", // 或 "ROUND_TIE"
    tiedPlayers: [
      {
        playerId: "player-uuid-1",
        nickname: "小明",
        totalScore: 50
      },
      {
        playerId: "player-uuid-2", 
        nickname: "小美",
        totalScore: 50
      }
    ],
    resolution: "ALL_WINNERS" // 根據澄清決策
  }
}
```

### 遊戲結束

#### 遊戲完成
**消息類型**: `GAME_COMPLETE`  
**發送者**: 系統 (第5輪完成後自動觸發)

```javascript
{
  type: "GAME_COMPLETE",
  timestamp: "2026-01-12T12:25:00.000Z",
  senderId: "system",
  data: {
    totalRounds: 5,
    gameCompletedAt: "2026-01-12T12:25:00.000Z",
    finalRankings: [
      {
        rank: 1,
        playerId: "player-uuid-1",
        nickname: "小明", 
        totalScore: 125,
        roundScores: [25, 30, 15, 40, 15],
        isWinner: true
      },
      {
        rank: 1, // 並列第一
        playerId: "player-uuid-2",
        nickname: "小美",
        totalScore: 125, 
        roundScores: [10, 35, 25, 30, 25],
        isWinner: true
      }
    ],
    winners: ["player-uuid-1", "player-uuid-2"],
    gameStats: {
      totalPlayTime: "00:10:15",
      averageResponseTime: "15s",
      reconnectionCount: 2
    }
  }
}
```

#### 慶祝畫面數據
**消息類型**: `CELEBRATION_DATA`  
**發送者**: 系統

```javascript
{
  type: "CELEBRATION_DATA",
  timestamp: "2026-01-12T12:25:01.000Z",
  senderId: "system",
  data: {
    celebrationType: "MULTIPLE_WINNERS", // 或 "SINGLE_WINNER"
    winners: [
      {
        playerId: "player-uuid-1",
        nickname: "小明",
        avatar: "🎉"
      },
      {
        playerId: "player-uuid-2", 
        nickname: "小美",
        avatar: "🏆"
      }
    ],
    giftReminder: "請為獲勝者頒發小禮物！",
    achievements: [
      {
        playerId: "player-uuid-3",
        achievement: "最佳進步獎",
        description: "後三輪連續正分"
      }
    ]
  }
}
```

## 狀態查詢 API

### 遊戲狀態查詢
**消息類型**: `GET_GAME_STATE`  
**發送者**: 任何參與者

```javascript
// Request
{
  type: "GET_GAME_STATE",
  timestamp: "2026-01-12T12:15:00.000Z",
  senderId: "player-uuid-1",
  data: {}
}

// Response
{
  type: "GAME_STATE_RESPONSE",
  timestamp: "2026-01-12T12:15:00.100Z",
  senderId: "system",
  data: {
    roomCode: "1234",
    gameState: "lottery_in_progress",
    currentRound: 3,
    totalRounds: 5,
    hostTargetNumber: null,
    players: [
      {
        playerId: "player-uuid-1",
        nickname: "小明",
        position: 1,
        connectionStatus: "online",
        currentNumber: 65,
        totalScore: 55,
        hasDrawnThisRound: true
      }
    ],
    roundHistory: [
      {
        roundNumber: 1,
        hostTargetNumber: 50,
        playerScores: [...]
      },
      {
        roundNumber: 2,
        hostTargetNumber: 30,
        playerScores: [...]
      }
    ]
  }
}
```

### 統計數據查詢
**消息類型**: `GET_GAME_STATS`  
**發送者**: 主持人

```javascript
// Response
{
  type: "GAME_STATS_RESPONSE",
  timestamp: "2026-01-12T12:20:00.100Z",
  senderId: "system",
  data: {
    gameProgress: {
      completedRounds: 3,
      totalRounds: 5,
      percentComplete: 60,
      estimatedTimeRemaining: "00:04:30"
    },
    playerStats: [
      {
        playerId: "player-uuid-1",
        nickname: "小明",
        averageScore: 18.3,
        bestRound: {roundNumber: 2, score: 30},
        worstRound: {roundNumber: 1, score: 5},
        consistency: 0.7
      }
    ],
    systemStats: {
      averageDrawTime: "12s",
      connectionQuality: "excellent",
      errorCount: 0
    }
  }
}
```

## 管理員 API

### 遊戲重置
**消息類型**: `RESET_GAME`  
**發送者**: 主持人

```javascript
// Request
{
  type: "RESET_GAME",
  timestamp: "2026-01-12T12:30:00.000Z",
  senderId: "host",
  data: {
    resetType: "FULL_RESET", // 或 "CURRENT_ROUND_ONLY"
    confirmation: true
  }
}

// Response
{
  type: "GAME_RESET",
  timestamp: "2026-01-12T12:30:00.100Z",
  senderId: "system",
  data: {
    resetFields: [
      "currentRound",
      "gameState", 
      "hostTargetNumber",
      "playerScores",
      "roundHistory"
    ],
    newGameState: "waiting",
    playersRetained: true
  }
}
```

### 強制狀態變更
**消息類型**: `FORCE_STATE_CHANGE`  
**發送者**: 主持人 (緊急情況使用)

```javascript
// Request
{
  type: "FORCE_STATE_CHANGE",
  timestamp: "2026-01-12T12:25:00.000Z", 
  senderId: "host",
  data: {
    targetState: "game_finished",
    reason: "time_limit_exceeded",
    forceWinners: ["player-uuid-1"] // 可選
  }
}
```

## 驗證規則

### 數字輸入驗證
- 參賽者每輪只能輸入數字一次
- 輸入數字時遊戲狀態必須為 `lottery_in_progress`
- 輸入數字必須在 0-100 範圍內
- 輸入數字必須為有效整數

### 計分驗證  
- 主持人目標數字必須在設定後才能計分
- 所有參賽者必須完成輸入數字才能計分
- 計分公式：參賽者數字 - 主持人數字

### 狀態轉換驗證
- 嚴格按照狀態機規則轉換
- 不允許跳過必要的中間狀態
- 回退操作需要管理員權限
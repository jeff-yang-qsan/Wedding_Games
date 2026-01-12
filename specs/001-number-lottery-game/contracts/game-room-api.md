# API 合約: 遊戲房間管理

**Created**: 2026-01-12  
**Purpose**: 遊戲房間建立、加入、狀態管理相關的 API 合約

## WebRTC 消息格式

由於使用 P2P WebRTC 架構，所有 API 都是透過 WebRTC DataChannel 傳輸的消息格式。

### 基礎消息結構
```javascript
{
  type: string,           // 消息類型
  timestamp: Date,        // 發送時間戳
  senderId: string,       // 發送者ID (主持人為 "host")
  data: object           // 具體數據內容
}
```

## 房間管理 API

### 建立遊戲房間
**消息類型**: `CREATE_ROOM`  
**發送者**: 主持人

```javascript
// Request
{
  type: "CREATE_ROOM",
  timestamp: "2026-01-12T12:00:00.000Z",
  senderId: "host",
  data: {
    maxPlayers: 5
  }
}

// Response
{
  type: "ROOM_CREATED",
  timestamp: "2026-01-12T12:00:00.100Z",
  senderId: "system",
  data: {
    roomCode: "1234",
    gameState: "waiting",
    currentRound: 1,
    players: []
  }
}
```

### 參賽者加入房間
**消息類型**: `JOIN_ROOM`  
**發送者**: 參賽者

```javascript
// Request
{
  type: "JOIN_ROOM",
  timestamp: "2026-01-12T12:00:30.000Z",
  senderId: "player-uuid-1",
  data: {
    roomCode: "1234",
    nickname: "小明"
  }
}

// Response - 成功
{
  type: "PLAYER_JOINED",
  timestamp: "2026-01-12T12:00:30.100Z",
  senderId: "system",
  data: {
    playerId: "player-uuid-1",
    nickname: "小明",
    position: 1,
    connectionStatus: "online"
  }
}

// Response - 失敗
{
  type: "JOIN_REJECTED",
  timestamp: "2026-01-12T12:00:30.100Z",
  senderId: "system",
  data: {
    reason: "ROOM_FULL", // 或 "INVALID_ROOM_CODE", "DUPLICATE_NICKNAME"
    message: "遊戲人數已滿"
  }
}
```

### 廣播房間狀態更新
**消息類型**: `ROOM_STATE_UPDATE`  
**發送者**: 系統

```javascript
{
  type: "ROOM_STATE_UPDATE",
  timestamp: "2026-01-12T12:00:30.200Z",
  senderId: "system",
  data: {
    roomCode: "1234",
    gameState: "waiting",
    currentRound: 1,
    players: [
      {
        playerId: "player-uuid-1",
        nickname: "小明",
        position: 1,
        connectionStatus: "online",
        totalScore: 0
      }
    ],
    hostTargetNumber: null
  }
}
```

## 遊戲流程 API

### 開始抽籤
**消息類型**: `START_LOTTERY`  
**發送者**: 主持人

```javascript
// Request
{
  type: "START_LOTTERY",
  timestamp: "2026-01-12T12:05:00.000Z",
  senderId: "host",
  data: {
    roundNumber: 1
  }
}

// Response
{
  type: "LOTTERY_STARTED",
  timestamp: "2026-01-12T12:05:00.100Z",
  senderId: "system",
  data: {
    gameState: "lottery_in_progress",
    roundNumber: 1,
    allowedPlayers: ["player-uuid-1", "player-uuid-2", ...]
  }
}
```

### 參賽者抽籤
**消息類型**: `DRAW_NUMBER`  
**發送者**: 參賽者

```javascript
// Request
{
  type: "DRAW_NUMBER",
  timestamp: "2026-01-12T12:05:10.000Z",
  senderId: "player-uuid-1",
  data: {
    roundNumber: 1
  }
}

// Response
{
  type: "NUMBER_DRAWN",
  timestamp: "2026-01-12T12:05:10.100Z",
  senderId: "system",
  data: {
    playerId: "player-uuid-1",
    drawnNumber: 75,
    roundNumber: 1
  }
}
```

### 主持人設定目標數字
**消息類型**: `SET_TARGET_NUMBER`  
**發送者**: 主持人

```javascript
// Request
{
  type: "SET_TARGET_NUMBER",
  timestamp: "2026-01-12T12:05:30.000Z",
  senderId: "host",
  data: {
    targetNumber: 50,
    roundNumber: 1
  }
}

// Response
{
  type: "TARGET_NUMBER_SET",
  timestamp: "2026-01-12T12:05:30.100Z",
  senderId: "system",
  data: {
    hostTargetNumber: 50,
    roundNumber: 1,
    gameState: "scoring"
  }
}
```

### 計分結果
**消息類型**: `SCORING_COMPLETE`  
**發送者**: 系統 (自動觸發)

```javascript
{
  type: "SCORING_COMPLETE",
  timestamp: "2026-01-12T12:05:30.200Z",
  senderId: "system",
  data: {
    roundNumber: 1,
    hostTargetNumber: 50,
    playerScores: [
      {
        playerId: "player-uuid-1",
        drawnNumber: 75,
        score: 25,
        totalScore: 25
      },
      {
        playerId: "player-uuid-2", 
        drawnNumber: 30,
        score: -20,
        totalScore: -20
      }
    ],
    gameState: "round_complete"
  }
}
```

## 錯誤處理

### 通用錯誤格式
```javascript
{
  type: "ERROR",
  timestamp: "2026-01-12T12:00:00.000Z",
  senderId: "system",
  data: {
    errorCode: string,
    message: string,
    details: object
  }
}
```

### 錯誤代碼
- `INVALID_GAME_STATE`: 遊戲狀態不允許該操作
- `PLAYER_NOT_FOUND`: 參賽者不存在
- `ROOM_NOT_FOUND`: 房間不存在
- `DUPLICATE_ACTION`: 重複操作
- `VALIDATION_ERROR`: 數據驗證失敗
- `CONNECTION_ERROR`: 連線錯誤

## 連線管理

### 心跳檢測
**消息類型**: `HEARTBEAT`  
**頻率**: 每30秒

```javascript
// Ping
{
  type: "HEARTBEAT",
  timestamp: "2026-01-12T12:00:00.000Z",
  senderId: "player-uuid-1",
  data: {}
}

// Pong
{
  type: "HEARTBEAT_ACK",
  timestamp: "2026-01-12T12:00:00.050Z",
  senderId: "system", 
  data: {
    latency: 50
  }
}
```

### 重新連線
**消息類型**: `RECONNECT`  

```javascript
// Request
{
  type: "RECONNECT",
  timestamp: "2026-01-12T12:10:00.000Z",
  senderId: "player-uuid-1",
  data: {
    lastKnownState: "lottery_in_progress",
    lastKnownRound: 2
  }
}

// Response
{
  type: "RECONNECT_SUCCESS",
  timestamp: "2026-01-12T12:10:00.100Z", 
  senderId: "system",
  data: {
    currentGameState: "scoring",
    currentRound: 2,
    missedMessages: [...] // 重新連線期間錯過的消息
  }
}
```
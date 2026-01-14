# 數字抽籤遊戲 - 從抽籤改為手動輸入的修改摘要

**修改日期**: 2026-01-14  
**修改範圍**: 將參賽者的幸運數字從隨機抽籤改為手動輸入

## 主要變更

### 1. 規格文件更新

#### specs/001-number-lottery-game/spec.md
- User Story 2: 將"單輪抽籤與計分"改為"單輪輸入與計分"
- 更新Acceptance Scenarios中的所有抽籤相關描述
- 更新Functional Requirements FR-003
- 更新Success Criteria SC-002

#### specs/001-number-lottery-game/data-model.md
- Player實體：`currentNumber`描述從"當前抽中數字"改為"當前輸入數字"
- PlayerScore類型：`drawnNumber`改為`inputNumber`，`drawnAt`改為`inputAt`
- 更新遊戲狀態轉換規則和驗證規則

#### specs/001-number-lottery-game/contracts/game-room-api.md
- API消息類型：`START_LOTTERY`改為`START_INPUT`
- API響應：`LOTTERY_STARTED`改為`INPUT_STARTED`
- 參賽者API：`DRAW_NUMBER`改為`INPUT_NUMBER`，新增`inputNumber`參數
- 響應消息：`NUMBER_DRAWN`改為`NUMBER_INPUTTED`

#### specs/001-number-lottery-game/contracts/game-logic-api.md
- Purpose描述：從"抽籤邏輯"改為"數字輸入邏輯"
- 驗證規則：將所有抽籤相關規則改為輸入驗證

### 2. 核心邏輯修改

#### assets/js/game-engine.js

##### Player類別
- `drawNumber()` → `inputNumber(inputNumber)`: 接收手動輸入數字並進行驗證
- `hasDrawnNumber()` → `hasInputNumber()`: 更新方法名稱
- `calculateRoundScore()`: 更新錯誤訊息

##### GameManager類別  
- `drawNumber(playerId)` → `inputNumber(playerId, inputNumber)`: 處理輸入數字請求
- 更新相關方法註解

### 3. 前端界面修改

#### index.html
- 抽籤按鈕區域改為數字輸入區域
- 新增`number-input`輸入框（type="number", min="0", max="100"）
- `draw-number-btn` → `submit-number-btn`
- 更新主持人界面按鈕文字

#### assets/css/game-styles.css
- 新增`.form-input.invalid`樣式，用於顯示無效輸入狀態

#### assets/js/ui-controller.js
- `resetLotteryInterface()`: 更新為處理輸入控件
- `enableLotteryButton()` → `enableInputInterface()`: 啟用輸入介面
- `displayDrawnNumber()` → `displayInputNumber()`: 顯示輸入結果

### 4. 控制邏輯更新

#### assets/js/game-controller.js
- 事件監聽器：新增對`submit-number-btn`和`number-input`的處理
- `drawNumber()` → `submitNumber()`: 處理數字提交
- `handleDrawNumberRequest()` → `handleInputNumberRequest()`: 處理輸入請求
- `handleNumberDrawn()` → `handleNumberInputted()`: 處理輸入事件
- 新增`validateNumberInput()`: 即時驗證輸入

### 5. 通訊協定更新

#### assets/js/webrtc-manager.js
- WebRTC消息類型：
  - `drawNumber` → `inputNumber`
  - `numberDrawn` → `numberInputted`  
  - `drawNumberError` → `inputNumberError`
- 更新對應的事件分派

### 6. 驗證與測試

#### test-input-changes.html
- 創建獨立測試頁面驗證新的輸入功能
- 包含輸入驗證、Enter鍵提交、錯誤狀態顯示等功能測試

## 技術改進

### 輸入驗證機制
- 即時驗證：輸入時檢查數字有效性（0-100整數）
- 視覺回饋：無效輸入時顯示紅色邊框和背景
- 按鈕狀態：只有輸入有效數字後才啟用提交按鈕
- Enter鍵支援：可使用Enter鍵快速提交

### 用戶體驗優化
- 清晰的提示文字："請輸入您的幸運數字"
- 即時反饋：輸入後立即驗證並更新按鈕狀態
- 防止重複提交：提交後禁用輸入控件
- 一致的術語：統一使用"輸入"而非"抽取"

### 向後相容性
- 保持原有的遊戲流程和狀態機
- 保持原有的計分邏輯（輸入數字 - 主持人數字）
- 保持原有的WebRTC通訊架構
- 保持原有的存儲和狀態管理

## 測試建議

1. **功能測試**
   - 測試數字輸入驗證（邊界值、無效值）
   - 測試Enter鍵提交功能
   - 測試重複提交防護
   - 測試WebRTC通訊

2. **整合測試**  
   - 多人遊戲場景測試
   - 網路中斷恢復測試
   - 主持人和參賽者界面同步測試

3. **用戶體驗測試**
   - 觸摸設備上的輸入體驗
   - 各種屏幕尺寸的顯示效果
   - 無障礙功能支援

## 部署注意事項

- 所有修改都是前端更新，無需伺服器端變更
- 建議先在測試環境驗證所有功能
- 確認所有參賽者設備都支援HTML5輸入控件
- 保留原始版本作為回退選項

---

*此修改完全實現了從隨機抽籤到手動輸入的功能轉換，同時保持了原有遊戲的核心玩法和用戶體驗。*
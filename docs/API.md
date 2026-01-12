# 部署文檔 - 數字抽籤遊戲

## 快速部署

### 選項 1: 單檔部署 (推薦)
```bash
# 使用建構好的單一檔案
1. 上傳 index-standalone.html 到網頁伺服器
2. 重新命名為 index.html (可選)
3. 完成！無需其他檔案
```

### 選項 2: 完整專案部署
```bash
# 上傳整個專案目錄
1. 上傳所有檔案到網頁伺服器
2. 確保目錄結構完整
3. 訪問 index.html
```

## 部署平台

### GitHub Pages
```bash
1. Push 專案到 GitHub 倉庫
2. 啟用 GitHub Pages
3. 選擇主分支或 docs 資料夾
4. 自動部署完成
```

### Netlify 拖拉部署
```bash
1. 打開 netlify.com
2. 將 index-standalone.html 拖放到部署區域
3. 獲得即時 URL
```

### 本地測試
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

## 系統需求

### 瀏覽器支援
- Chrome 88+ (推薦)
- Safari 14+
- Firefox 85+
- Edge 88+

### 功能需求
- WebRTC 支援 (P2P 連線)
- LocalStorage 支援
- ES6+ JavaScript 支援

### 網路需求
- 初次載入需要網路連線
- 遊戲進行可離線運作
- STUN 伺服器連線 (Google STUN)

## 性能優化

### 檔案大小
- 原始專案: ~25 KB
- 單檔版本: ~270 KB
- Gzip 壓縮後: ~60 KB

### 載入時間
- 3G 網路: <3 秒
- 4G/WiFi: <1 秒
- 快取後: <0.5 秒

## 故障排除

### 連線問題
```
問題: 玩家無法加入遊戲
解決: 檢查防火牆設置，確保允許 WebRTC 連線
```

### 效能問題
```
問題: 遊戲回應緩慢
解決: 清除瀏覽器快取，關閉其他分頁
```

### 相容性問題
```
問題: 功能無法正常運作
解決: 更新瀏覽器到最新版本
```

## 自訂配置

### 遊戲設定
```javascript
// 在 game-engine.js 中調整
const GAME_CONFIG = {
    maxPlayers: 5,        // 最大參賽者數量
    maxRounds: 5,         // 遊戲輪數
    numberRange: [0, 100] // 數字範圍
};
```

### UI 語言
```javascript
// 在 ui-controller.js 中修改文字
const UI_TEXT = {
    startGame: '開始遊戲',
    joinGame: '加入遊戲',
    // ... 其他文字
};
```

## 維護與更新

### 版本控制
- 使用 Git 追蹤變更
- Tag 重要版本
- 保留建構腳本

### 監控
- 檢查瀏覽器主控台錯誤
- 監控連線品質
- 收集使用者反饋

### 備份
- 定期備份專案檔案
- 匯出遊戲記錄 (可選)
- 保存設定檔案

## 安全考量

### 資料隱私
- 遊戲資料僅存於本地
- 無資料傳送至外部伺服器
- P2P 連線加密

### 網路安全
- 使用 HTTPS 部署 (建議)
- 防止 XSS 攻擊
- 輸入資料驗證

## 支援與聯絡

如有問題或建議，請參考：
- GitHub Issues
- 技術文檔
- 用戶手冊

---

建構日期: $(Get-Date)
版本: Phase 7 完整版
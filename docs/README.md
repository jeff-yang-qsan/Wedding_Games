# 數字抽籤遊戲

一個專為婚禮設計的多人互動數字抽籤遊戲，支援五位參賽者透過手機瀏覽器參與，主持人透過投影幕控制遊戲進程。

## 🎮 遊戲特色

- **零依賴部署** - 單一 HTML 檔案，5分鐘內完成部署
- **多人即時互動** - 支援最多5位參賽者同時參與
- **跨平台相容** - 手機、平板、桌面瀏覽器完美支援
- **離線容錯** - 網路不穩定時仍可正常遊戲
- **正體中文** - 完整正體中文介面和說明

## 🚀 快速開始

### 部署方法 1: GitHub Pages (推薦)
1. Fork 此專案或下載 `index.html`
2. 上傳到 GitHub 存儲庫
3. 啟用 GitHub Pages
4. 立即可用！

### 部署方法 2: 本地伺服器
```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js  
npx serve .

# 使用 PHP
php -S localhost:8000
```

### 遊戲流程
1. **主持人**: 開啟網頁，點擊「建立新遊戲」
2. **參賽者**: 用手機掃描 QR Code 或輸入房間代碼
3. **遊戲進行**: 五輪數字抽籤，累計得分
4. **宣布結果**: 自動計算獲勝者，提醒頒發小禮物

## 🛠️ 技術架構

### 核心技術
- **前端**: Vanilla JavaScript ES6+, HTML5, CSS3
- **通信**: WebRTC P2P (點對點連線)
- **儲存**: LocalStorage + IndexedDB
- **部署**: 靜態檔案，零伺服器依賴

### 系統需求
- **瀏覽器**: Chrome 70+, Safari 14+, Firefox 65+
- **網路**: 3G 或更快 (建議 WiFi)
- **設備**: 智慧型手機 + 投影設備

### 效能指標
- 頁面載入: <3秒 (3G網路)
- 遊戲回應: <500ms
- 支援人數: 最多5人同時
- 完整遊戲: 約10分鐘

## 🎯 遊戲規則

### 基本玩法
1. 五位參賽者各自輸入暱稱加入遊戲
2. 每輪遊戲：
   - 參賽者在手機上抽取 0-100 隨機數字
   - 主持人設定目標數字 (0-100)
   - 系統計算得分：參賽者數字 - 主持人數字
3. 進行五輪後，累計得分最高者獲勝
4. 並列第一時，所有最高分者都獲得小禮物

### 特殊規則
- 允許負數得分
- 支援多人並列冠軍
- 網路中斷時自動保存進度
- 主持人可隨時重置遊戲

## 📁 專案結構

```
Wedding_Games/
├── index.html                    # 主遊戲檔案 (包含所有功能)
├── assets/
│   ├── css/
│   │   └── game-styles.css      # 響應式樣式表
│   ├── js/
│   │   ├── game-engine.js       # 遊戲邏輯核心
│   │   ├── webrtc-manager.js    # P2P 通信管理
│   │   ├── storage-manager.js   # 資料存儲管理
│   │   └── ui-controller.js     # 介面控制器
│   └── icons/
│       └── game-icon.png        # 遊戲圖示
├── docs/
│   ├── README.md               # 專案文檔 (本檔案)
│   └── API.md                  # API 說明文檔
└── tests/                      # 測試檔案 (開發用)
```

## 🔧 開發指南

### 本地開發
```bash
# 複製專案
git clone <repository-url>
cd Wedding_Games

# 啟動開發伺服器
python -m http.server 8000
# 或
npx serve .

# 開啟瀏覽器
open http://localhost:8000
```

### 自訂設定
可在瀏覽器開發者工具中修改遊戲參數：
```javascript
// 修改遊戲設定
gameConfig = {
  maxPlayers: 5,              // 參賽者數量
  totalRounds: 5,             // 遊戲輪數
  numberRange: [0, 100],      // 數字範圍
  allowNegativeScore: true,   // 允許負分
  tieResolution: "all_winners" // 平手處理
}
```

### 測試功能
- 單元測試: `tests/unit/`
- 整合測試: `tests/integration/`
- E2E 測試: `tests/e2e/`

## 🌐 部署選項

### GitHub Pages
最簡單的部署方式，完全免費：
1. Fork 專案到您的 GitHub 帳號
2. 在 Settings → Pages 中啟用
3. 選擇 main branch
4. 幾分鐘後即可訪問

### Netlify / Vercel
支援更多進階功能：
1. 連接 GitHub 存儲庫
2. 自動部署設定
3. 自訂網域支援

### 自架伺服器
適用於內網環境：
```bash
# Apache
cp index.html /var/www/html/

# Nginx  
cp index.html /usr/share/nginx/html/

# 任何 HTTP 伺服器都可以
```

## 🐛 疑難排解

### 常見問題

**Q: 參賽者無法加入房間？**
A: 檢查房間代碼是否正確，確認網路連線，重新整理頁面

**Q: 投影幕沒有即時更新？**  
A: 檢查 WebRTC 連線狀態，確認防火牆設定

**Q: 遊戲進行中有人離線？**
A: 系統會自動保存數據，離線者重新連線後可繼續參與

**Q: 需要重新開始遊戲？**
A: 主持人可點擊「重新開始」按鈕重置所有數據

### 效能優化
1. 使用穩定的 WiFi 網路
2. 關閉不必要的瀏覽器分頁
3. 確保投影設備網路連線良好
4. 建議使用最新版本瀏覽器

## 📄 授權條款

MIT License - 可自由使用、修改和分發

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發環境
- Node.js 16+ (開發工具)
- 任何現代文字編輯器
- 支援 ES6+ 的瀏覽器

### 提交指南
1. Fork 專案
2. 建立功能分支
3. 撰寫測試
4. 確保所有測試通過
5. 提交 Pull Request

## 📞 支援

- **問題回報**: GitHub Issues
- **功能建議**: GitHub Discussions  
- **技術文檔**: [API.md](./API.md)

---

**祝您的婚禮遊戲圓滿成功！** 🎉
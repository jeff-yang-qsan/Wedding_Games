# Technical Research: 數字抽籤遊戲

**Created**: 2026-01-12  
**Purpose**: 解決技術背景中的所有 NEEDS CLARIFICATION 項目

## Research Tasks

### 任務 1: 前端技術棧選擇
**研究範圍**: 適合靜態部署的即時多人遊戲技術方案

**Decision**: Vanilla JavaScript + WebSocket + LocalStorage
**Rationale**: 
- 零依賴部署：無需 Node.js 或複雜建置流程
- 原生 WebSocket 支援：現代瀏覽器內建，效能優異
- LocalStorage 持久化：網路中斷時保持數據
- 響應式 CSS：單一代碼庫適配手機和桌面

**Alternatives considered**:
- React/Vue.js: 需要建置流程，違反快速部署需求
- Socket.IO: 需要 Node.js 後端，增加部署複雜度
- Firebase: 依賴第三方服務，不符合靜態部署要求

### 任務 2: 即時通信架構
**研究範圍**: 無後端環境下的多人即時同步方案

**Decision**: WebRTC DataChannel + Signaling Server (靜態 JSON)
**Rationale**:
- P2P 架構：參賽者直接通信，減少伺服器負載
- 無需持續伺服器：使用公共 STUN 伺服器建立連接
- 低延遲：直接點對點通信，符合 <500ms 要求
- 離線容錯：連接失敗時回退到 LocalStorage 同步

**Alternatives considered**:
- WebSocket + 自建伺服器: 違反靜態部署要求
- 輪詢 (Polling): 延遲過高，不符合即時性要求
- 純 LocalStorage: 無法即時同步多個裝置

### 任務 3: 數據存儲策略
**研究範圍**: 靜態環境下的數據持久化和同步

**Decision**: LocalStorage + IndexedDB 混合方案
**Rationale**:
- LocalStorage: 存儲房間狀態和參賽者資訊 (4KB 限制內)
- IndexedDB: 存儲遊戲歷史記錄和詳細數據
- 離線優先：網路中斷時完全功能正常
- 自動清理：遊戲結束後選擇性保留數據

**Alternatives considered**:
- 純 LocalStorage: 容量限制，無法存儲完整遊戲記錄
- SessionStorage: 分頁關閉即失數據，不適合多輪遊戲
- Cookie: 大小限制嚴重，每次請求都傳輸

### 任務 4: 測試框架選擇
**研究範圍**: 零依賴環境下的自動化測試方案

**Decision**: 自建輕量測試框架 + Puppeteer E2E
**Rationale**:
- 零依賴：自建 assertion 函數庫，純 JavaScript
- 瀏覽器測試：直接在目標環境中執行測試
- E2E 測試：使用 Puppeteer 模擬多人遊戲場景
- CI 友好：GitHub Actions 可直接執行

**Alternatives considered**:
- Jest/Mocha: 需要 Node.js 環境和建置流程
- Selenium: 設定複雜，不符合簡化部署需求
- 純手動測試: 無法確保代碼品質和回歸測試

### 任務 5: 部署和分發策略
**研究範圍**: 5分鐘內完成部署的最佳實務

**Decision**: GitHub Pages + 單一 HTML 檔案
**Rationale**:
- 即時部署：推送程式碼後自動發布
- 零設定：無需 CI/CD 配置，GitHub 自動處理
- 單檔案設計：所有資源內嵌，零依賴分發
- CDN 加速：GitHub Pages 全球 CDN，符合效能要求

**Alternatives considered**:
- Netlify/Vercel: 功能過於複雜，不符合簡化需求
- 自建 HTTP 伺服器: 違反靜態部署約束
- 檔案分享服務: 不適合持續更新的開發流程

## 技術決策總結

| 項目 | 選擇 | 主要理由 |
|------|------|----------|
| 前端語言 | Vanilla JavaScript ES6+ | 零依賴、現代瀏覽器支援 |
| 即時通信 | WebRTC DataChannel | P2P 低延遲、無伺服器需求 |
| 數據存儲 | LocalStorage + IndexedDB | 離線支援、容量充足 |
| 測試框架 | 自建 + Puppeteer | 環境一致性、零設定 |
| 部署方式 | GitHub Pages 單檔案 | 極速部署、全球 CDN |

## 風險評估

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|----------|
| WebRTC 連接失敗 | 中 | 高 | 回退到 LocalStorage 手動同步 |
| 瀏覽器相容性 | 低 | 中 | Polyfill 支援舊版瀏覽器 |
| 網路中斷 | 高 | 低 | 完整離線功能設計 |

## 效能基準

- 頁面載入: <3秒 (3G 網路)
- WebRTC 連接建立: <5秒
- 數據同步延遲: <500ms
- 記憶體使用: <50MB (所有參賽者)
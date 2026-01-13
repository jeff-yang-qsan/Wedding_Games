/**
 * 數字抽籤遊戲 - 存儲管理器
 * 負責 LocalStorage 和 IndexedDB 的數據持久化
 */

class StorageManager {
    constructor() {
        this.dbName = 'NumberLotteryGame';
        this.dbVersion = 1;
        this.db = null;
        this.isIndexedDBSupported = 'indexedDB' in window;
        this.isLocalStorageSupported = 'localStorage' in window;
        
        // Phase 7: 性能優化設置
        this.cacheEnabled = true;
        this.memoryCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分鐘快取
        this.compressionEnabled = true;
        this.batchOperations = [];
        this.batchTimeout = null;
        this.batchDelay = 100; // 100ms 批次延遲
        
        this.init();
    }

    /**
     * 初始化存儲系統
     */
    async init() {
        if (this.isIndexedDBSupported) {
            try {
                await this.initIndexedDB();
                console.log('IndexedDB 初始化成功');
            } catch (error) {
                console.warn('IndexedDB 初始化失敗:', error);
            }
        }

        if (!this.isLocalStorageSupported) {
            console.warn('LocalStorage 不受支援，將使用記憶體存儲');
        }
    }

    /**
     * 初始化 IndexedDB
     */
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('IndexedDB 開啟失敗'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 創建遊戲歷史表
                if (!db.objectStoreNames.contains('gameHistory')) {
                    const gameStore = db.createObjectStore('gameHistory', { keyPath: 'id', autoIncrement: true });
                    gameStore.createIndex('roomCode', 'roomCode', { unique: false });
                    gameStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // 創建參賽者歷史表
                if (!db.objectStoreNames.contains('playerHistory')) {
                    const playerStore = db.createObjectStore('playerHistory', { keyPath: 'id', autoIncrement: true });
                    playerStore.createIndex('playerId', 'playerId', { unique: false });
                    playerStore.createIndex('nickname', 'nickname', { unique: false });
                }

                // 創建錯誤日誌表
                if (!db.objectStoreNames.contains('errorLogs')) {
                    const errorStore = db.createObjectStore('errorLogs', { keyPath: 'id', autoIncrement: true });
                    errorStore.createIndex('timestamp', 'timestamp', { unique: false });
                    errorStore.createIndex('level', 'level', { unique: false });
                }
            };
        });
    }

    // ==================== LocalStorage 方法 ====================

    /**
     * 儲存遊戲房間狀態
     * @param {Object} gameRoom - 遊戲房間對象
     */
    saveGameRoom(gameRoom) {
        try {
            if (this.isLocalStorageSupported) {
                localStorage.setItem('currentGameRoom', JSON.stringify(gameRoom));
            } else {
                // 降級到記憶體存儲
                this._memoryStorage = this._memoryStorage || {};
                this._memoryStorage.currentGameRoom = gameRoom;
            }
        } catch (error) {
            console.error('儲存遊戲房間失敗:', error);
            throw error;
        }
    }

    /**
     * 讀取遊戲房間狀態
     * @returns {Object|null} 遊戲房間對象
     */
    loadGameRoom() {
        try {
            if (this.isLocalStorageSupported) {
                const data = localStorage.getItem('currentGameRoom');
                return data ? JSON.parse(data) : null;
            } else {
                return this._memoryStorage?.currentGameRoom || null;
            }
        } catch (error) {
            console.error('讀取遊戲房間失敗:', error);
            return null;
        }
    }

    /**
     * 儲存參賽者列表
     * @param {Array} players - 參賽者陣列
     */
    savePlayers(players) {
        try {
            if (this.isLocalStorageSupported) {
                localStorage.setItem('currentPlayers', JSON.stringify(players));
            } else {
                this._memoryStorage = this._memoryStorage || {};
                this._memoryStorage.currentPlayers = players;
            }
        } catch (error) {
            console.error('儲存參賽者列表失敗:', error);
            throw error;
        }
    }

    /**
     * 讀取參賽者列表
     * @returns {Array} 參賽者陣列
     */
    loadPlayers() {
        try {
            if (this.isLocalStorageSupported) {
                const data = localStorage.getItem('currentPlayers');
                return data ? JSON.parse(data) : [];
            } else {
                return this._memoryStorage?.currentPlayers || [];
            }
        } catch (error) {
            console.error('讀取參賽者列表失敗:', error);
            return [];
        }
    }

    /**
     * 儲存當前輪次數據
     * @param {Object} currentRound - 輪次對象
     */
    saveCurrentRound(currentRound) {
        try {
            if (this.isLocalStorageSupported) {
                localStorage.setItem('currentRound', JSON.stringify(currentRound));
            } else {
                this._memoryStorage = this._memoryStorage || {};
                this._memoryStorage.currentRound = currentRound;
            }
        } catch (error) {
            console.error('儲存輪次數據失敗:', error);
            throw error;
        }
    }

    /**
     * 讀取當前輪次數據
     * @returns {Object|null} 輪次對象
     */
    loadCurrentRound() {
        try {
            if (this.isLocalStorageSupported) {
                const data = localStorage.getItem('currentRound');
                return data ? JSON.parse(data) : null;
            } else {
                return this._memoryStorage?.currentRound || null;
            }
        } catch (error) {
            console.error('讀取輪次數據失敗:', error);
            return null;
        }
    }

    /**
     * 清除所有 LocalStorage 數據
     */
    clearLocalStorage() {
        try {
            if (this.isLocalStorageSupported) {
                localStorage.removeItem('currentGameRoom');
                localStorage.removeItem('currentPlayers');
                localStorage.removeItem('currentRound');
                localStorage.removeItem('hostPeerId'); // 清除主持人 Peer ID
            } else {
                this._memoryStorage = {};
            }
            console.log('LocalStorage 已清除');
        } catch (error) {
            console.error('清除 LocalStorage 失敗:', error);
        }
    }

    // ==================== IndexedDB 方法 ====================

    /**
     * 儲存完整遊戲記錄到 IndexedDB
     * @param {Object} gameRecord - 遊戲記錄對象
     */
    async saveGameHistory(gameRecord) {
        if (!this.db) {
            console.warn('IndexedDB 不可用，跳過遊戲歷史儲存');
            return;
        }

        try {
            const transaction = this.db.transaction(['gameHistory'], 'readwrite');
            const store = transaction.objectStore('gameHistory');
            
            const record = {
                ...gameRecord,
                timestamp: new Date().toISOString()
            };
            
            await new Promise((resolve, reject) => {
                const request = store.add(record);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            console.log('遊戲歷史已儲存');
        } catch (error) {
            console.error('儲存遊戲歷史失敗:', error);
        }
    }

    /**
     * 讀取遊戲歷史記錄
     * @param {number} limit - 限制返回數量
     * @returns {Array} 遊戲歷史陣列
     */
    async loadGameHistory(limit = 10) {
        if (!this.db) {
            return [];
        }

        try {
            const transaction = this.db.transaction(['gameHistory'], 'readonly');
            const store = transaction.objectStore('gameHistory');
            const index = store.index('timestamp');

            return new Promise((resolve, reject) => {
                const records = [];
                const request = index.openCursor(null, 'prev'); // 最新的在前

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && records.length < limit) {
                        records.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(records);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('讀取遊戲歷史失敗:', error);
            return [];
        }
    }

    /**
     * 儲存參賽者歷史表現
     * @param {Object} playerRecord - 參賽者記錄
     */
    async savePlayerHistory(playerRecord) {
        if (!this.db) {
            return;
        }

        try {
            const transaction = this.db.transaction(['playerHistory'], 'readwrite');
            const store = transaction.objectStore('playerHistory');
            
            const record = {
                ...playerRecord,
                timestamp: new Date().toISOString()
            };
            
            await new Promise((resolve, reject) => {
                const request = store.add(record);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('儲存參賽者歷史失敗:', error);
        }
    }

    /**
     * 記錄錯誤日誌
     * @param {string} level - 錯誤等級 (error, warn, info)
     * @param {string} message - 錯誤訊息
     * @param {Object} details - 詳細資訊
     */
    async logError(level, message, details = {}) {
        // 同時記錄到 console 和 IndexedDB
        console[level](`[${level.toUpperCase()}] ${message}`, details);

        if (!this.db) {
            return;
        }

        try {
            const transaction = this.db.transaction(['errorLogs'], 'readwrite');
            const store = transaction.objectStore('errorLogs');
            
            const record = {
                level,
                message,
                details: JSON.stringify(details),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            await new Promise((resolve, reject) => {
                const request = store.add(record);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('儲存錯誤日誌失敗:', error);
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 檢查存儲空間使用情況
     * @returns {Object} 存儲狀態資訊
     */
    async getStorageInfo() {
        const info = {
            localStorage: {
                supported: this.isLocalStorageSupported,
                used: 0,
                available: 0
            },
            indexedDB: {
                supported: this.isIndexedDBSupported,
                connected: !!this.db
            }
        };

        // 計算 LocalStorage 使用量
        if (this.isLocalStorageSupported) {
            let totalSize = 0;
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }
            info.localStorage.used = totalSize;
            info.localStorage.available = 5 * 1024 * 1024 - totalSize; // 假設 5MB 限制
        }

        return info;
    }

    /**
     * 清理過期數據
     * @param {number} daysToKeep - 保留天數
     */
    async cleanupOldData(daysToKeep = 30) {
        if (!this.db) {
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffTimestamp = cutoffDate.toISOString();

        try {
            // 清理遊戲歷史
            const gameTransaction = this.db.transaction(['gameHistory'], 'readwrite');
            const gameStore = gameTransaction.objectStore('gameHistory');
            const gameIndex = gameStore.index('timestamp');
            
            const gameRange = IDBKeyRange.upperBound(cutoffTimestamp);
            gameIndex.openCursor(gameRange).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            // 清理錯誤日誌
            const errorTransaction = this.db.transaction(['errorLogs'], 'readwrite');
            const errorStore = errorTransaction.objectStore('errorLogs');
            const errorIndex = errorStore.index('timestamp');
            
            const errorRange = IDBKeyRange.upperBound(cutoffTimestamp);
            errorIndex.openCursor(errorRange).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            console.log(`已清理 ${daysToKeep} 天前的過期數據`);
        } catch (error) {
            console.error('清理過期數據失敗:', error);
        }
    }

    // ==================== Phase 7: 性能優化功能 ====================

    /**
     * 啟用記憶體快取
     */
    enableCache() {
        this.cacheEnabled = true;
        console.log('記憶體快取已啟用');
    }

    /**
     * 停用記憶體快取
     */
    disableCache() {
        this.cacheEnabled = false;
        this.memoryCache.clear();
        console.log('記憶體快取已停用');
    }

    /**
     * 從快取獲取資料
     */
    getFromCache(key) {
        if (!this.cacheEnabled) return null;
        
        const cached = this.memoryCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        // 清理過期快取
        if (cached) {
            this.memoryCache.delete(key);
        }
        
        return null;
    }

    /**
     * 設定快取資料
     */
    setCache(key, data) {
        if (!this.cacheEnabled) return;
        
        this.memoryCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        // 限制快取大小
        if (this.memoryCache.size > 100) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
    }

    /**
     * 壓縮資料
     */
    compressData(data) {
        if (!this.compressionEnabled) return data;
        
        try {
            const jsonString = JSON.stringify(data);
            // 簡單的 LZ 類似壓縮
            return this.simpleCompress(jsonString);
        } catch (error) {
            console.warn('資料壓縮失敗:', error);
            return data;
        }
    }

    /**
     * 解壓縮資料
     */
    decompressData(compressedData) {
        if (!this.compressionEnabled || typeof compressedData !== 'string') {
            return compressedData;
        }
        
        try {
            const decompressed = this.simpleDecompress(compressedData);
            return JSON.parse(decompressed);
        } catch (error) {
            console.warn('資料解壓縮失敗:', error);
            return compressedData;
        }
    }

    /**
     * 簡單字符串壓縮
     */
    simpleCompress(str) {
        const compressed = [];
        let i = 0;
        
        while (i < str.length) {
            let match = '';
            let matchLength = 0;
            
            // 尋找重複模式
            for (let j = i + 1; j < Math.min(i + 255, str.length); j++) {
                const substr = str.substring(i, j);
                const nextIndex = str.indexOf(substr, j);
                
                if (nextIndex !== -1 && substr.length > matchLength) {
                    match = substr;
                    matchLength = substr.length;
                }
            }
            
            if (matchLength > 3) {
                compressed.push(`[${matchLength}:${match}]`);
                i += matchLength;
            } else {
                compressed.push(str[i]);
                i++;
            }
        }
        
        return compressed.join('');
    }

    /**
     * 簡單字符串解壓縮
     */
    simpleDecompress(compressed) {
        return compressed.replace(/\[(\d+):([^\]]+)\]/g, (match, length, pattern) => {
            return pattern.repeat(Math.ceil(parseInt(length) / pattern.length));
        });
    }

    /**
     * 批次操作
     */
    addToBatch(operation) {
        this.batchOperations.push(operation);
        
        // 設定批次處理延遲
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
            this.executeBatch();
        }, this.batchDelay);
    }

    /**
     * 執行批次操作
     */
    async executeBatch() {
        if (this.batchOperations.length === 0) return;
        
        const operations = [...this.batchOperations];
        this.batchOperations = [];
        
        console.log(`執行 ${operations.length} 個批次操作`);
        
        for (const operation of operations) {
            try {
                await operation();
            } catch (error) {
                console.error('批次操作失敗:', error);
            }
        }
        
        console.log('批次操作完成');
    }

    /**
     * 獲取儲存統計
     */
    async getStorageStats() {
        const stats = {
            localStorage: {
                supported: this.isLocalStorageSupported,
                used: 0,
                available: 0
            },
            indexedDB: {
                supported: this.isIndexedDBSupported,
                used: 0,
                available: 0
            },
            memoryCache: {
                entries: this.memoryCache.size,
                enabled: this.cacheEnabled
            }
        };

        // LocalStorage 統計
        if (this.isLocalStorageSupported) {
            try {
                let localStorageSize = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        localStorageSize += localStorage[key].length;
                    }
                }
                stats.localStorage.used = localStorageSize;
                stats.localStorage.available = 10 * 1024 * 1024 - localStorageSize; // 假設 10MB 限制
            } catch (error) {
                console.warn('無法計算 LocalStorage 大小:', error);
            }
        }

        // IndexedDB 統計
        if (this.isIndexedDBSupported && navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                stats.indexedDB.used = estimate.usage || 0;
                stats.indexedDB.available = (estimate.quota || 0) - (estimate.usage || 0);
            } catch (error) {
                console.warn('無法獲取 IndexedDB 統計:', error);
            }
        }

        return stats;
    }

    /**
     * 清理快取
     */
    clearCache() {
        this.memoryCache.clear();
        console.log('記憶體快取已清理');
    }

    /**
     * 優化儲存空間
     */
    async optimizeStorage() {
        console.log('開始優化儲存空間...');
        
        // 清理過期快取
        this.clearCache();
        
        // 清理過期數據
        await this.cleanupExpiredData(7); // 清理 7 天前的數據
        
        // 執行未完成的批次操作
        await this.executeBatch();
        
        const stats = await this.getStorageStats();
        console.log('儲存空間優化完成:', stats);
        
        return stats;
    }
}

// 創建全域實例
const storageManager = new StorageManager();

// 匯出供其他模組使用
window.StorageManager = StorageManager;
window.storageManager = storageManager;
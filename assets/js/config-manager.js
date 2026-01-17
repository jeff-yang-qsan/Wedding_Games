/**
 * 配置管理器 - 負責載入和管理遊戲配置
 */
class ConfigManager {
    constructor() {
        this.config = null;
        this.defaultConfig = {
            backgroundEffects: {
                loveText: {
                    enabled: true,
                    text: "Shumin ❤️ Jinfu"
                },
                petals: {
                    enabled: true
                }
            },
            ui: {
                theme: "wheat-cream"
            }
        };
    }

    /**
     * 載入配置檔案
     * @returns {Promise<Object>} 配置對象
     */
    async loadConfig() {
        try {
            const response = await fetch('./config.json');
            if (!response.ok) {
                console.warn('無法載入配置檔案，使用預設配置');
                this.config = this.defaultConfig;
            } else {
                this.config = await response.json();
                console.log('✅ 配置檔案載入成功:', this.config);
            }
            
            // 自動應用主題
            this.applyTheme();
            
            return this.config;
        } catch (error) {
            console.warn('載入配置檔案時發生錯誤，使用預設配置:', error);
            this.config = this.defaultConfig;
            this.applyTheme();
            return this.config;
        }
    }

    /**
     * 獲取配置值
     * @param {string} path - 配置路徑 (例: 'backgroundEffects.loveText.enabled')
     * @returns {any} 配置值
     */
    get(path) {
        if (!this.config) {
            console.warn('配置尚未載入，返回預設值');
            return this.getFromObject(this.defaultConfig, path);
        }
        
        return this.getFromObject(this.config, path);
    }

    /**
     * 從對象中獲取嵌套屬性值
     * @param {Object} obj - 對象
     * @param {string} path - 屬性路徑
     * @returns {any} 屬性值
     */
    getFromObject(obj, path) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return undefined;
            }
        }
        
        return result;
    }

    /**
     * 檢查背景愛心文字是否啟用
     * @returns {boolean}
     */
    isLoveTextEnabled() {
        return this.get('backgroundEffects.loveText.enabled') !== false;
    }

    /**
     * 獲取背景愛心文字內容
     * @returns {string}
     */
    getLoveTextContent() {
        return this.get('backgroundEffects.loveText.text') || 'Shumin ❤️ Jinfu';
    }

    /**
     * 檢查花瓣特效是否啟用
     * @returns {boolean}
     */
    isPetalsEnabled() {
        return this.get('backgroundEffects.petals.enabled') !== false;
    }

    /**
     * 獲取當前主題
     * @returns {string}
     */
    getTheme() {
        return this.get('ui.theme') || 'wheat-cream';
    }

    /**
     * 應用主題配色
     */
    applyTheme() {
        const theme = this.getTheme();
        const body = document.body;
        
        // 移除舊的主題類別
        body.classList.remove('theme-romantic-pink', 'theme-wheat-cream');
        
        // 添加新的主題類別
        body.classList.add(`theme-${theme}`);
        
        console.log(`🎨 已應用主題: ${theme}`);
    }

    /**
     * 動態更新配置 (僅記憶體中)
     * @param {string} path - 配置路徑
     * @param {any} value - 新值
     */
    set(path, value) {
        if (!this.config) {
            this.config = { ...this.defaultConfig };
        }
        
        const keys = path.split('.');
        let target = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[keys[keys.length - 1]] = value;
        console.log(`配置已更新: ${path} = ${value}`);
    }
}

// 創建全局配置管理器實例
window.configManager = new ConfigManager();
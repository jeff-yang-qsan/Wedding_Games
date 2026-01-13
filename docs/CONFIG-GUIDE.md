# 配置功能使用說明

## 簡介

數字抽籤遊戲現在支援透過設定檔控制背景效果，包括：
1. 背景愛心文字的開啟/關閉
2. 自訂背景文字內容
3. 花瓣飄落特效的開啟/關閉

## 配置檔案位置

主配置檔案：`config.json`

## 配置選項

### backgroundEffects.loveText
- `enabled` (布林值): 是否啟用背景愛心文字
- `text` (字串): 背景文字內容

### backgroundEffects.petals
- `enabled` (布林值): 是否啟用花瓣飄落特效

## 使用範例

### 預設配置 (全部啟用)
```json
{
  "backgroundEffects": {
    "loveText": {
      "enabled": true,
      "text": "Shumin ❤️ Jinfu"
    },
    "petals": {
      "enabled": true
    }
  }
}
```

### 只顯示自訂文字，不顯示花瓣
```json
{
  "backgroundEffects": {
    "loveText": {
      "enabled": true,
      "text": "我的客製化文字 ✨"
    },
    "petals": {
      "enabled": false
    }
  }
}
```

### 只顯示花瓣，不顯示文字
```json
{
  "backgroundEffects": {
    "loveText": {
      "enabled": false,
      "text": "Shumin ❤️ Jinfu"
    },
    "petals": {
      "enabled": true
    }
  }
}
```

### 關閉所有背景效果
```json
{
  "backgroundEffects": {
    "loveText": {
      "enabled": false,
      "text": "Shumin ❤️ Jinfu"
    },
    "petals": {
      "enabled": false
    }
  }
}
```

## 測試頁面

使用 `test-config.html` 來測試配置功能：
1. 顯示當前配置狀態
2. 動態切換背景效果
3. 重新載入配置

## 故障排除

如果配置載入失敗，遊戲會自動使用預設值：
- 背景文字：啟用，顯示 "Shumin ❤️ Jinfu"
- 花瓣特效：啟用

## 擴展性

未來可以輕鬆新增更多配置選項，如：
- 動畫速度
- 顏色主題
- 文字字體大小
- 花瓣顏色和大小
# 建構單一檔案部署版本的腳本
# Phase 7: 將所有 CSS 和 JS 資源內嵌到 index.html 中

param(
    [string]$InputFile = "index.html",
    [string]$OutputFile = "index-standalone.html"
)

Write-Host "開始建構單一檔案版本..." -ForegroundColor Green

# 讀取原始 HTML 檔案
$htmlContent = Get-Content $InputFile -Raw -Encoding UTF8

# 讀取 CSS 檔案
$cssFile = "assets\css\game-styles.css"
if (Test-Path $cssFile) {
    Write-Host "內嵌 CSS 檔案: $cssFile" -ForegroundColor Yellow
    $cssContent = Get-Content $cssFile -Raw -Encoding UTF8
    
    # 替換 CSS 連結為內嵌樣式
    $cssLink = '<link rel="stylesheet" href="assets/css/game-styles.css">'
    $inlineCSS = "<style>$cssContent</style>"
    $htmlContent = $htmlContent -replace [regex]::Escape($cssLink), $inlineCSS
} else {
    Write-Warning "找不到 CSS 檔案: $cssFile"
}

# 讀取並內嵌 JS 檔案
$jsFiles = @(
    "assets\js\storage-manager.js",
    "assets\js\webrtc-manager.js", 
    "assets\js\game-engine.js",
    "assets\js\ui-controller.js",
    "assets\js\game-controller.js"
)

$allJsContent = ""
foreach ($jsFile in $jsFiles) {
    if (Test-Path $jsFile) {
        Write-Host "內嵌 JS 檔案: $jsFile" -ForegroundColor Yellow
        $jsContent = Get-Content $jsFile -Raw -Encoding UTF8
        $allJsContent += "`n// ==================== $jsFile ====================`n"
        $allJsContent += $jsContent + "`n"
    } else {
        Write-Warning "找不到 JS 檔案: $jsFile"
    }
}

# 找到現有 script 標籤的位置，並替換為內嵌腳本
if ($allJsContent -ne "") {
    # 替換所有外部 script 標籤
    $scriptPattern = '<script src="assets/js/[^"]+"></script>'
    $htmlContent = $htmlContent -replace $scriptPattern, ''
    
    # 在 </body> 前插入內嵌腳本
    $inlineScript = "<script>$allJsContent</script>"
    $htmlContent = $htmlContent -replace '</body>', "$inlineScript`n</body>"
}

# 處理 favicon (轉換為 base64)
$faviconFile = "assets\icons\game-icon.png"
if (Test-Path $faviconFile) {
    Write-Host "內嵌 favicon: $faviconFile" -ForegroundColor Yellow
    try {
        $faviconBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $faviconFile))
        $faviconBase64 = [System.Convert]::ToBase64String($faviconBytes)
        $faviconDataUri = "data:image/png;base64,$faviconBase64"
        
        # 替換 favicon 連結
        $faviconLink = '<link rel="icon" type="image/png" sizes="32x32" href="assets/icons/game-icon.png">'
        $inlineFavicon = '<link rel="icon" type="image/png" sizes="32x32" href="' + $faviconDataUri + '">'
        $htmlContent = $htmlContent -replace [regex]::Escape($faviconLink), $inlineFavicon
    } catch {
        Write-Warning "無法處理 favicon: $($_.Exception.Message)"
    }
} else {
    Write-Warning "找不到 favicon 檔案: $faviconFile"
}

# 添加建構資訊註解
$buildInfo = @"
<!-- 
    建構資訊:
    - 建構時間: $(Get-Date)
    - 來源檔案: $InputFile
    - 版本: 單一檔案部署版本
    - Phase 7: 所有資源已內嵌，支援離線使用
-->
"@

$htmlContent = $htmlContent -replace '<!DOCTYPE html>', "$buildInfo`n<!DOCTYPE html>"

# 寫入輸出檔案
$htmlContent | Out-File -FilePath $OutputFile -Encoding UTF8 -NoNewline

# 檢查檔案大小
$originalSize = (Get-Item $InputFile).Length
$newSize = (Get-Item $OutputFile).Length

Write-Host "`n建構完成！" -ForegroundColor Green
Write-Host "原始檔案: $InputFile ($([Math]::Round($originalSize/1024, 2)) KB)" -ForegroundColor Cyan
Write-Host "單一檔案: $OutputFile ($([Math]::Round($newSize/1024, 2)) KB)" -ForegroundColor Cyan
Write-Host "增加大小: $([Math]::Round(($newSize - $originalSize)/1024, 2)) KB" -ForegroundColor $(if ($newSize -gt $originalSize * 3) { "Red" } else { "Green" })

# 驗證檔案完整性
Write-Host "`n驗證檔案完整性..." -ForegroundColor Yellow
$validation = @{
    "包含 CSS 樣式" = $htmlContent.Contains("<style>")
    "包含 JS 腳本" = $htmlContent.Contains("class StorageManager") -and $htmlContent.Contains("class WebRTCManager") -and $htmlContent.Contains("class GameManager") -and $htmlContent.Contains("class UIController")
    "包含內嵌 favicon" = $htmlContent.Contains("data:image/png;base64,")
    "無外部資源依賴" = -not ($htmlContent.Contains('href="assets/') -or $htmlContent.Contains('src="assets/'))
}

foreach ($check in $validation.GetEnumerator()) {
    $status = if ($check.Value) { "✓" } else { "✗" }
    $color = if ($check.Value) { "Green" } else { "Red" }
    Write-Host "$status $($check.Key)" -ForegroundColor $color
}

if ($validation.Values -contains $false) {
    Write-Warning "檔案驗證發現問題，請檢查建構過程"
    exit 1
} else {
    Write-Host "`n✅ 單一檔案建構成功！可以直接部署 $OutputFile" -ForegroundColor Green
}
#!/bin/bash
# deploy.sh - 部署腳本

echo "🚀 開始部署員工系統 PWA..."

# 建立必要資料夾
mkdir -p icons
mkdir -p splash

echo "📁 建立檔案結構..."

# 建立所有檔案
cat > manifest.json << 'EOF'
{
  "name": "員工管理系統",
  "short_name": "員工系統",
  "description": "公司員工權限管理系統",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#764ba2",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["business", "productivity"],
  "lang": "zh-TW",
  "dir": "ltr"
}
EOF

# 建立 service-worker.js
cat > service-worker.js << 'EOF'
// 這裡放上面 service-worker.js 的內容
EOF

# 建立 index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<!-- 這裡放上面 index.html 的內容 -->
EOF

# 建立 style.css
cat > style.css << 'EOF'
/* 這裡放上面 style.css 的內容 */
EOF

# 建立 app.js
cat > app.js << 'EOF'
// 這裡放上面 app.js 的內容
EOF

echo "✅ 檔案建立完成！"

# 下載範例圖示（如果沒有圖示）
if [ ! -f "icons/icon-512x512.png" ]; then
    echo "🖼️ 請下載並放置圖示到 icons/ 資料夾"
    echo "建議尺寸: 512x512, 192x192, 144x144, 96x96, 72x72"
fi

echo ""
echo "📋 部署步驟："
echo "1. 將所有檔案上傳到你的網站伺服器"
echo "2. 確保伺服器支援 HTTPS (PWA 必要)"
echo "3. 更新 app.js 中的 Supabase URL 和金鑰"
echo "4. 測試是否可以在手機上安裝"
echo ""
echo "📱 測試安裝："
echo "- iOS: Safari → 分享 → 加入主畫面"
echo "- Android: Chrome → ⋮ → 安裝應用程式"
echo ""
echo "🎉 部署完成！"
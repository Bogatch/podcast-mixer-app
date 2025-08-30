#!/bin/bash
set -e

echo "🔧 Generujem ikony z assets/logo.png..."

# Skontroluj či existuje pôvodný súbor
if [ ! -f assets/logo.png ]; then
  echo "❌ Chýba assets/logo.png"
  exit 1
fi

# macOS .icns
mkdir -p icon.iconset
sips -z 16 16     assets/logo.png --out icon.iconset/icon_16x16.png
sips -z 32 32     assets/logo.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     assets/logo.png --out icon.iconset/icon_32x32.png
sips -z 64 64     assets/logo.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   assets/logo.png --out icon.iconset/icon_128x128.png
sips -z 256 256   assets/logo.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   assets/logo.png --out icon.iconset/icon_256x256.png
sips -z 512 512   assets/logo.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   assets/logo.png --out icon.iconset/icon_512x512.png
cp assets/logo.png icon.iconset/icon_512x512@2x.png

iconutil -c icns icon.iconset -o assets/icon.icns
rm -rf icon.iconset

# Windows .ico
magick assets/logo.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico

# Linux PNG
cp assets/logo.png assets/icon.png

echo "✅ Ikony hotové: assets/icon.icns, assets/icon.ico, assets/icon.png"

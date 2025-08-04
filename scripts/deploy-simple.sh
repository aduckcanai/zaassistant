#!/bin/bash

# Simple Deploy Commands for AI Assistant
# Usage: ./scripts/deploy-simple.sh

set -e

echo "🚀 AI Assistant - Simple Deployment Commands"
echo ""

# Build first
echo "📦 Building application..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build completed successfully"
echo ""

echo "📋 Copy and paste these commands one by one:"
echo ""
echo "# 1. SSH vào server và chuẩn bị thư mục:"
echo "ssh -p 2222 zah18-team2@118.102.2.102"
echo "mkdir -p ~/ai-assistant"
echo "rm -rf ~/ai-assistant/*"
echo "exit"
echo ""

echo "# 2. Upload files từ máy local:"
echo "scp -P 2222 -r dist/* zah18-team2@118.102.2.102:~/ai-assistant/"
echo ""

echo "# 3. SSH lại để fix permissions:"
echo "ssh -p 2222 zah18-team2@118.102.2.102"
echo "chmod 755 /home/zah18-team2/"
echo "chmod -R 755 ~/ai-assistant/"
echo "find ~/ai-assistant -type f -exec chmod 644 {} \\;"
echo "find ~/ai-assistant -type d -exec chmod 755 {} \\;"
echo "exit"
echo ""

echo "# 4. Test website:"
echo "# Open: https://zah-2.123c.vn/ai-assistant/"
echo ""

echo "🎯 That's it! Copy-paste từng command ở trên."
echo ""

# Show file count
file_count=$(find dist -type f | wc -l)
echo "📊 Ready to deploy: $file_count files in dist/ directory" 
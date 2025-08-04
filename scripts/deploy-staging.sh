#!/bin/bash

# Staging Deploy script for AI Assistant
# Usage: ./scripts/deploy-staging.sh

set -e

echo "🧪 Starting STAGING deployment process..."

# Build the application
echo "📦 Building application..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build completed successfully"

# SSH connection details
SSH_HOST="118.102.2.102"
SSH_PORT="2222"
SSH_USER="zah18-team2"
REMOTE_DIR="~/ai-assistant-staging"

echo "🔐 Connecting to STAGING server..."

# Create remote directory and clean old files
sshpass -p "xxxx" ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
  echo "📁 Creating STAGING deployment directory..."
  mkdir -p ~/ai-assistant-staging
  echo "🧹 Cleaning old STAGING files..."
  rm -rf ~/ai-assistant-staging/*
  echo "✅ STAGING server prepared"
EOF

# Upload files to server
echo "📡 Uploading files to STAGING server..."
sshpass -p "xxxx" scp -P $SSH_PORT -r dist/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/

# Set permissions
echo "🔧 Setting STAGING permissions..."
sshpass -p "xxxx" ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
  chmod -R 755 ~/ai-assistant-staging/
  echo "✅ STAGING permissions set"
EOF

echo "🎉 STAGING deployment completed successfully!"
echo "🧪 Your STAGING application is available at:"
echo "   - Direct access: ~/ai-assistant-staging/"
echo "   - Web server: Start with 'cd ~/ai-assistant-staging && python3 -m http.server 8001'"
echo "   - URL: http://118.102.2.102:8001 (after starting web server)" 
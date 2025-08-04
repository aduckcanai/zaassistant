#!/bin/bash

# Deploy script for AI Assistant
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting deployment process..."

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
REMOTE_DIR="~/ai-assistant"

echo "🔐 Connecting to server..."

# Create remote directory and clean old files
sshpass -p "xxxx" ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
  echo "📁 Creating deployment directory..."
  mkdir -p ~/ai-assistant
  echo "🧹 Cleaning old files..."
  rm -rf ~/ai-assistant/*
  echo "✅ Server prepared"
EOF

# Upload files to server
echo "📡 Uploading files to server..."
sshpass -p "xxxx" scp -P $SSH_PORT -r dist/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/

# Set permissions
echo "🔧 Setting permissions..."
sshpass -p "xxxx" ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
  chmod -R 755 ~/ai-assistant/
  echo "✅ Permissions set"
EOF

echo "🎉 Deployment completed successfully!"
echo "🌐 Your application should now be available on the server" 
#!/bin/bash

# Manual Deploy script for AI Assistant
# Usage: ./scripts/deploy-manual.sh [staging|production]

set -e

# Default to production if no argument provided
ENVIRONMENT=${1:-production}

echo "🚀 Starting MANUAL deployment process for: $ENVIRONMENT"

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

# Set remote directory based on environment
if [ "$ENVIRONMENT" = "staging" ]; then
    REMOTE_DIR="~/ai-assistant-staging"
    echo "🧪 Deploying to STAGING: $REMOTE_DIR"
else

fi

echo ""
echo "🔐 SSH Connection Details:"
echo "   Host: $SSH_HOST:$SSH_PORT"
echo "   User: $SSH_USER"
echo "   Directory: $REMOTE_DIR"
echo ""

# Option 1: Interactive deployment (recommended)
echo "📡 Choose deployment method:"
echo "1) Interactive (enter password when prompted) - RECOMMENDED"
echo "2) Show manual commands"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "🔐 You will be prompted for SSH password 3 times..."
        echo ""
        
        # Create remote directory and clean old files
        echo "📁 Creating deployment directory..."
        ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << EOF
            echo "📁 Creating deployment directory..."
            mkdir -p $REMOTE_DIR
            echo "🧹 Cleaning old files..."
            rm -rf $REMOTE_DIR/*
            echo "✅ Server prepared"
EOF

        # Upload files to server
        echo "📡 Uploading files..."
        scp -P $SSH_PORT -r dist/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/

        # Set permissions
        echo "🔧 Setting permissions..."
        ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << EOF
            chmod 755 /home/zah18-team2/
            chmod -R 755 $REMOTE_DIR/
            find $REMOTE_DIR -type f -exec chmod 644 {} \;
            find $REMOTE_DIR -type d -exec chmod 755 {} \;
            echo "✅ Permissions set"
EOF

        echo ""
        echo "🎉 Manual deployment completed successfully!"
        if [ "$ENVIRONMENT" = "staging" ]; then
            echo "🧪 Your STAGING application should be available at:"
            echo "   https://zah-2.123c.vn/ai-assistant-staging/"
        else
            echo "🚀 Your PRODUCTION application should be available at:"
            echo "   https://zah-2.123c.vn/ai-assistant/"
        fi
        ;;
    2)
        echo ""
        echo "📋 Manual Commands (run these step by step):"
        echo ""
        echo "# 1. Create directory and clean old files:"
        echo "ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
        echo "mkdir -p $REMOTE_DIR"
        echo "rm -rf $REMOTE_DIR/*"
        echo "exit"
        echo ""
        echo "# 2. Upload files:"
        echo "scp -P $SSH_PORT -r dist/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/"
        echo ""
        echo "# 3. Fix permissions:"
        echo "ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
        echo "chmod 755 /home/zah18-team2/"
        echo "chmod -R 755 $REMOTE_DIR/"
        echo "find $REMOTE_DIR -type f -exec chmod 644 {} \\;"
        echo "find $REMOTE_DIR -type d -exec chmod 755 {} \\;"
        echo "exit"
        echo ""
        if [ "$ENVIRONMENT" = "staging" ]; then
            echo "# 4. Test: https://zah-2.123c.vn/ai-assistant-staging/"
        else
            echo "# 4. Test: https://zah-2.123c.vn/ai-assistant/"
        fi
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "📋 Deployment Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Local files: $(find dist -type f | wc -l) files in dist/"
echo "   Remote path: $SSH_USER@$SSH_HOST:$REMOTE_DIR"
echo ""
echo "🔍 To check deployment:"
echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'ls -la $REMOTE_DIR/'" 